package com.shannu.tdpnative.ui.leaders

import com.shannu.tdpnative.network.ApiClient
import com.shannu.tdpnative.network.dto.LeaderDto
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object LeadersRepository {
    suspend fun leaders(): Result<List<LeaderDto>> = withContext(Dispatchers.IO) {
        try {
            val response = ApiClient.service.leaders()
            val body = response.body()
            if (response.isSuccessful && body != null) {
                Result.success(body.items)
            } else {
                Result.failure(Exception("Failed to load leaders"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
