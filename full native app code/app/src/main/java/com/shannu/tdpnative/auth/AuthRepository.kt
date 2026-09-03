package com.shannu.tdpnative.auth

import com.shannu.tdpnative.TdpApplication
import com.shannu.tdpnative.network.ApiClient
import com.shannu.tdpnative.network.dto.GoogleNativeRequest
import com.shannu.tdpnative.network.dto.LoginRequest
import com.shannu.tdpnative.network.dto.RegisterRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

sealed class AuthResult {
    data class Success(val userName: String) : AuthResult()
    data class Failure(val message: String) : AuthResult()
}

/**
 * Talks to the same /api/auth/* endpoints as src/lib/api.ts on the website,
 * so a native login creates/reuses the exact same MongoDB user document.
 */
object AuthRepository {

    private val session get() = TdpApplication.instance.sessionManager

    suspend fun loginWithGoogleIdToken(idToken: String): AuthResult = withContext(Dispatchers.IO) {
        try {
            val response = ApiClient.service.googleNativeLogin(GoogleNativeRequest(idToken))
            val body = response.body()
            if (!response.isSuccessful || body == null) {
                return@withContext AuthResult.Failure(errorMessage(response.errorBody()?.string()))
            }
            session.saveTokens(body.tokens)
            session.saveUser(body.user)
            AuthResult.Success(body.user.name)
        } catch (e: Exception) {
            AuthResult.Failure(e.message ?: "Network error")
        }
    }

    suspend fun loginWithEmail(email: String, password: String): AuthResult = withContext(Dispatchers.IO) {
        try {
            val response = ApiClient.service.login(LoginRequest(email, password))
            val body = response.body()
            if (!response.isSuccessful || body == null) {
                return@withContext AuthResult.Failure(errorMessage(response.errorBody()?.string()))
            }
            session.saveTokens(body.tokens)
            session.saveUser(body.user)
            AuthResult.Success(body.user.name)
        } catch (e: Exception) {
            AuthResult.Failure(e.message ?: "Network error")
        }
    }

    suspend fun register(name: String, email: String, password: String): AuthResult = withContext(Dispatchers.IO) {
        try {
            val response = ApiClient.service.register(RegisterRequest(name, email, password))
            val body = response.body()
            if (!response.isSuccessful || body == null) {
                return@withContext AuthResult.Failure(errorMessage(response.errorBody()?.string()))
            }
            session.saveTokens(body.tokens)
            session.saveUser(body.user)
            AuthResult.Success(body.user.name)
        } catch (e: Exception) {
            AuthResult.Failure(e.message ?: "Network error")
        }
    }

    private fun errorMessage(raw: String?): String {
        if (raw.isNullOrBlank()) return "Something went wrong. Please try again."
        return try {
            val obj = com.google.gson.JsonParser.parseString(raw).asJsonObject
            obj.get("message")?.asString ?: "Something went wrong. Please try again."
        } catch (e: Exception) {
            "Something went wrong. Please try again."
        }
    }
}
