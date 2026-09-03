package com.shannu.tdpnative.network

import com.shannu.tdpnative.network.dto.AuthResponse
import com.shannu.tdpnative.network.dto.ConversationsResponse
import com.shannu.tdpnative.network.dto.DirectoryResponse
import com.shannu.tdpnative.network.dto.GoogleNativeRequest
import com.shannu.tdpnative.network.dto.LeadersResponse
import com.shannu.tdpnative.network.dto.LoginRequest
import com.shannu.tdpnative.network.dto.MeResponse
import com.shannu.tdpnative.network.dto.PrivateMessagesResponse
import com.shannu.tdpnative.network.dto.RefreshRequest
import com.shannu.tdpnative.network.dto.RefreshResponse
import com.shannu.tdpnative.network.dto.RegisterRequest
import com.shannu.tdpnative.network.dto.SaveFcmTokenRequest
import com.shannu.tdpnative.network.dto.WorksResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.POST
import retrofit2.http.Query

/**
 * Mirrors the same REST endpoints used by the website (server/routes/*.js),
 * so the native app talks to the exact same backend + MongoDB database.
 */
interface ApiService {

    @POST("api/auth/google/native")
    suspend fun googleNativeLogin(@Body body: GoogleNativeRequest): Response<AuthResponse>

    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): Response<AuthResponse>

    @POST("api/auth/register")
    suspend fun register(@Body body: RegisterRequest): Response<AuthResponse>

    @POST("api/auth/refresh")
    suspend fun refresh(@Body body: RefreshRequest): Response<RefreshResponse>

    @POST("api/auth/logout")
    suspend fun logout(@Body body: RefreshRequest): Response<Unit>

    @GET("api/users/me")
    suspend fun me(): Response<MeResponse>

    @GET("api/users/directory")
    suspend fun directory(@Query("search") search: String? = null): Response<DirectoryResponse>

    @POST("api/notifications/save-token")
    suspend fun saveFcmToken(@Body body: SaveFcmTokenRequest): Response<Unit>

    @GET("api/leaders")
    suspend fun leaders(@Query("category") category: String? = null): Response<LeadersResponse>

    @GET("api/works")
    suspend fun works(@Query("page") page: Int? = null, @Query("limit") limit: Int? = null): Response<WorksResponse>

    @GET("api/messages/conversations")
    suspend fun conversations(): Response<ConversationsResponse>

    @GET("api/messages/private/{otherUserId}")
    suspend fun privateMessages(
        @Path("otherUserId") otherUserId: String,
        @Query("limit") limit: Int? = null
    ): Response<PrivateMessagesResponse>
}
