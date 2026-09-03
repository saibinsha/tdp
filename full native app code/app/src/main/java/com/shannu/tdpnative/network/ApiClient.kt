package com.shannu.tdpnative.network

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.shannu.tdpnative.BuildConfig
import com.shannu.tdpnative.data.SessionManager
import com.shannu.tdpnative.network.dto.RefreshRequest
import okhttp3.Authenticator
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.Route
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

/**
 * Single Retrofit/OkHttp client for the whole app. All requests are sent to
 * [BuildConfig.API_BASE_URL] - the same Render deployment
 * (https://mytelugudeshamparty.onrender.com) used by the website and the
 * WebView wrapper app, so both clients share the same database and session
 * semantics (7-day access token / 30-day refresh token).
 */
object ApiClient {

    private lateinit var session: SessionManager
    private val gson: Gson = GsonBuilder().setLenient().create()

    val service: ApiService by lazy { buildRetrofit().create(ApiService::class.java) }

    fun init(sessionManager: SessionManager) {
        session = sessionManager
    }

    private fun buildRetrofit(): Retrofit {
        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BASIC
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(authInterceptor())
            .authenticator(refreshAuthenticator())
            .addInterceptor(logging)
            .build()

        return Retrofit.Builder()
            .baseUrl(ensureTrailingSlash(BuildConfig.API_BASE_URL))
            .client(client)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
    }

    private fun ensureTrailingSlash(url: String) = if (url.endsWith("/")) url else "$url/"

    private fun authInterceptor() = Interceptor { chain ->
        val original = chain.request()
        val token = session.accessToken
        val request = if (!token.isNullOrBlank()) {
            val bearer = "Bearer " + token
            original.newBuilder().header("Authorization", bearer).build()
        } else {
            original
        }
        chain.proceed(request)
    }

    /**
     * Transparently refreshes the access token on a 401, using the same
     * POST /api/auth/refresh contract as src/lib/api.ts, so a logged-in user
     * never has to sign in again just because the 7-day access token expired
     * while the app was closed.
     */
    private fun refreshAuthenticator() = Authenticator { _: Route?, response: Response ->
        if (responseCount(response) >= 2) return@Authenticator null

        val refreshToken = session.refreshToken ?: return@Authenticator null

        val plainClient = OkHttpClient.Builder().build()
        val body = gson.toJson(RefreshRequest(refreshToken)).toRequestBody("application/json".toMediaType())
        val refreshRequest = Request.Builder()
            .url("${ensureTrailingSlash(BuildConfig.API_BASE_URL)}api/auth/refresh")
            .post(body)
            .build()

        return@Authenticator try {
            plainClient.newCall(refreshRequest).execute().use { refreshResponse ->
                if (!refreshResponse.isSuccessful) {
                    session.clear()
                    return@use null
                }
                val text = refreshResponse.body?.string().orEmpty()
                val parsed = gson.fromJson(text, com.shannu.tdpnative.network.dto.RefreshResponse::class.java)
                val tokens = parsed?.tokens
                if (tokens == null) {
                    session.clear()
                    return@use null
                }
                session.saveTokens(tokens)
                response.request.newBuilder()
                    .header("Authorization", "Bearer " + tokens.accessToken)
                    .build()
            }
        } catch (e: Exception) {
            null
        }
    }

    private fun responseCount(response: Response): Int {
        var count = 1
        var prior = response.priorResponse
        while (prior != null) {
            count++
            prior = prior.priorResponse
        }
        return count
    }
}
