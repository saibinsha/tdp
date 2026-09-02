package com.shannu.tdpnative

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.shannu.tdpnative.auth.LoginActivity

/**
 * Decides where to send the user on launch. Because the JWT tokens are kept
 * in SessionManager (SharedPreferences) rather than in memory, a logged-in
 * user goes straight to MainActivity even after fully closing and reopening
 * the app - this is the native equivalent of "keep me logged in".
 */
class SplashActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val loggedIn = TdpApplication.instance.sessionManager.isLoggedIn
        val target = if (loggedIn) MainActivity::class.java else LoginActivity::class.java
        startActivity(Intent(this, target))
        finish()
    }
}
