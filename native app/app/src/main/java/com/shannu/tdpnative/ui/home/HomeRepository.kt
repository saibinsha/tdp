package com.shannu.tdpnative.ui.home

import com.shannu.tdpnative.network.ApiClient
import com.shannu.tdpnative.network.dto.WorkDto
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object HomeRepository {
    suspend fun works(): Result<List<WorkDto>> = withContext(Dispatchers.IO) {
        try {
            val response = ApiClient.service.works()
            val body = response.body()
            if (response.isSuccessful && body != null) {
                Result.success(body.items)
            } else {
                Result.failure(Exception("Failed to load updates"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
