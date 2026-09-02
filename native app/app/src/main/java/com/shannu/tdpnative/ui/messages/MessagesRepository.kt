package com.shannu.tdpnative.ui.messages

import com.shannu.tdpnative.network.ApiClient
import com.shannu.tdpnative.network.dto.ConversationDto
import com.shannu.tdpnative.network.dto.MessageDto
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object MessagesRepository {

    suspend fun conversations(): Result<List<ConversationDto>> = withContext(Dispatchers.IO) {
        try {
            val response = ApiClient.service.conversations()
            val body = response.body()
            if (response.isSuccessful && body != null) {
                Result.success(body.items)
            } else {
                Result.failure(Exception("Failed to load conversations"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun history(otherUserId: String): Result<List<MessageDto>> = withContext(Dispatchers.IO) {
        try {
            val response = ApiClient.service.privateMessages(otherUserId)
            val body = response.body()
            if (response.isSuccessful && body != null) {
                Result.success(body.items)
            } else {
                Result.failure(Exception("Failed to load messages"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
