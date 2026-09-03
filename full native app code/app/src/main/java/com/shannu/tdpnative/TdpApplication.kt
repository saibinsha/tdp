package com.shannu.tdpnative

import android.app.Application
import com.shannu.tdpnative.data.SessionManager
import com.shannu.tdpnative.network.ApiClient

/**
 * Application entry point. Initializes the session store and the Retrofit
 * client that talks to the exact same backend/database as the website
 * (server/*.js) and the WebView wrapper app ("andriod wrap/").
 */
class TdpApplication : Application() {

    lateinit var sessionManager: SessionManager
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        sessionManager = SessionManager(this)
        ApiClient.init(sessionManager)
    }

    companion object {
        lateinit var instance: TdpApplication
            private set
    }
}
