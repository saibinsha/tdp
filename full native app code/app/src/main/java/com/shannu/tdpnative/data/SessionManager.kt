package com.shannu.tdpnative.data

import android.content.Context
import android.content.SharedPreferences
import com.shannu.tdpnative.network.dto.Tokens
import com.shannu.tdpnative.network.dto.UserDto

/**
 * Persists the JWT access/refresh tokens and the logged-in user in
 * SharedPreferences, so the session survives the app being closed and
 * reopened (this is the native equivalent of the `tdp_tokens` /
 * `tdp_user` localStorage keys used by src/lib/api.ts on the website).
 */
class SessionManager(context: Context) {

    private val prefs: SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    var accessToken: String?
        get() = prefs.getString(KEY_ACCESS_TOKEN, null)
        private set(value) = prefs.edit().putString(KEY_ACCESS_TOKEN, value).apply()

    var refreshToken: String?
        get() = prefs.getString(KEY_REFRESH_TOKEN, null)
        private set(value) = prefs.edit().putString(KEY_REFRESH_TOKEN, value).apply()

    var fcmToken: String?
        get() = prefs.getString(KEY_FCM_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_FCM_TOKEN, value).apply()

    val isLoggedIn: Boolean
        get() = !accessToken.isNullOrBlank()

    fun saveTokens(tokens: Tokens) {
        accessToken = tokens.accessToken
        refreshToken = tokens.refreshToken
    }

    fun saveUser(user: UserDto) {
        prefs.edit()
            .putString(KEY_USER_ID, user.id)
            .putString(KEY_USER_NAME, user.name)
            .putString(KEY_USER_EMAIL, user.email)
            .putString(KEY_USER_PICTURE, user.profilePicture)
            .putString(KEY_USER_ROLE, user.role)
            .apply()
    }

    fun currentUserId(): String? = prefs.getString(KEY_USER_ID, null)
    fun currentUserName(): String? = prefs.getString(KEY_USER_NAME, null)
    fun currentUserEmail(): String? = prefs.getString(KEY_USER_EMAIL, null)
    fun currentUserPicture(): String? = prefs.getString(KEY_USER_PICTURE, null)

    fun clear() {
        prefs.edit().clear().apply()
    }

    companion object {
        private const val PREFS_NAME = "tdp_session"
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_FCM_TOKEN = "fcm_token"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_USER_PICTURE = "user_picture"
        private const val KEY_USER_ROLE = "user_role"
    }
}
