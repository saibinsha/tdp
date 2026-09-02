package com.shannu.tdpnative.network.dto

data class Tokens(
    val accessToken: String,
    val refreshToken: String
)

data class UserDto(
    val id: String,
    val membershipId: String? = null,
    val name: String,
    val email: String,
    val phone: String? = null,
    val profilePicture: String? = null,
    val role: String? = null,
    val status: String? = null
)

data class AuthResponse(
    val ok: Boolean,
    val user: UserDto,
    val tokens: Tokens
)

data class RefreshResponse(
    val ok: Boolean,
    val tokens: Tokens
)

data class GoogleNativeRequest(val idToken: String)

data class LoginRequest(val email: String, val password: String)

data class RegisterRequest(val name: String, val email: String, val password: String)

data class RefreshRequest(val refreshToken: String)

data class SaveFcmTokenRequest(val token: String)

data class LeaderDto(
    val _id: String,
    val name: String,
    val slug: String,
    val role: String,
    val category: String? = null,
    val photoUrl: String? = null,
    val bio: String? = null,
    val constituency: String? = null
)

data class LeadersResponse(
    val ok: Boolean,
    val items: List<LeaderDto> = emptyList()
)

data class WorkDto(
    val _id: String,
    val title: String,
    val description: String? = null,
    val imageUrl: String? = null,
    val createdAt: String? = null
)

data class WorksResponse(
    val ok: Boolean,
    val items: List<WorkDto> = emptyList()
)

data class MediaDto(
    val url: String,
    val publicId: String? = null,
    val resourceType: String? = null
)

data class MessageDto(
    val _id: String,
    val type: String,
    val from: com.google.gson.JsonElement? = null,
    val to: String? = null,
    val group: String? = null,
    val text: String? = "",
    val media: MediaDto? = null,
    val createdAt: String? = null
) {
    /** `from` may be a populated user object (REST history) or a plain user id (live socket events). */
    fun fromUserId(): String? {
        val el = from ?: return null
        return if (el.isJsonObject) {
            el.asJsonObject.get("_id")?.asString
        } else if (el.isJsonPrimitive) {
            el.asString
        } else {
            null
        }
    }
}

data class ConversationUserDto(
    val _id: String,
    val name: String? = null,
    val profilePicture: String? = null,
    val membershipId: String? = null
)

data class ConversationLastMessageDto(
    val _id: String? = null,
    val text: String? = null,
    val media: MediaDto? = null,
    val from: com.google.gson.JsonElement? = null,
    val createdAt: String? = null
)

data class ConversationDto(
    val type: String? = null,
    val otherUser: ConversationUserDto,
    val lastMessage: ConversationLastMessageDto? = null
)

data class ConversationsResponse(
    val ok: Boolean,
    val items: List<ConversationDto> = emptyList()
)

data class PrivateMessagesResponse(
    val ok: Boolean,
    val items: List<MessageDto> = emptyList()
)

data class DirectoryUserDto(
    val _id: String,
    val name: String,
    val profilePicture: String? = null,
    val membershipId: String? = null
)

data class DirectoryResponse(
    val ok: Boolean,
    val items: List<DirectoryUserDto> = emptyList()
)

data class MeResponse(
    val ok: Boolean,
    val user: UserDto
)

data class ApiErrorBody(
    val ok: Boolean? = null,
    val message: String? = null
)
