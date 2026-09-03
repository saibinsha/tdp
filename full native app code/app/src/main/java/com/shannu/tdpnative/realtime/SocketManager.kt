package com.shannu.tdpnative.realtime

import com.shannu.tdpnative.BuildConfig
import com.shannu.tdpnative.TdpApplication
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject

/**
 * Thin wrapper around socket.io-client that connects to the same Socket.IO
 * server as the website (server/sockets/chat.js / server/index.js), using
 * the JWT access token for auth exactly like src/lib/socket.ts does.
 *
 * Reuses the identical event names so a message or call started from the
 * website is delivered live to this native app and vice-versa:
 *   private:send / private:join / call:offer / call:answer / call:ice /
 *   call:accept / call:reject / call:end
 */
object SocketManager {

    private var socket: Socket? = null
    private var connectedToken: String? = null

    fun connect(): Socket? {
        val token = TdpApplication.instance.sessionManager.accessToken
        if (token.isNullOrBlank()) {
            disconnect()
            return null
        }

        if (socket != null && connectedToken == token && socket!!.connected()) {
            return socket
        }

        disconnect()

        val options = IO.Options.builder()
            .setAuth(mapOf("token" to token))
            .setTransports(arrayOf("websocket"))
            .setReconnection(true)
            .build()

        val newSocket = IO.socket(java.net.URI.create(BuildConfig.API_BASE_URL), options)
        newSocket.connect()
        socket = newSocket
        connectedToken = token
        return newSocket
    }

    fun current(): Socket? = socket

    fun disconnect() {
        socket?.disconnect()
        socket?.off()
        socket = null
        connectedToken = null
    }

    fun emitJson(event: String, json: JSONObject) {
        socket?.emit(event, json)
    }
}
