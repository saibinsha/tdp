package com.shannu.tdpnative.auth

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.shannu.tdpnative.BuildConfig
import com.shannu.tdpnative.MainActivity
import com.shannu.tdpnative.R
import com.shannu.tdpnative.databinding.ActivityLoginBinding
import kotlinx.coroutines.launch

/**
 * Native login screen. Google Sign-In shows the real in-app account picker
 * (Play Services bottom sheet) - never leaves the app or opens a browser,
 * which is exactly the "popup" behaviour requested for the WebView wrapper
 * app too (see andriod wrap/.../MainActivity.java WebAppBridge#googleSignIn).
 */
class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private lateinit var googleClient: GoogleSignInClient

    private val googleSignInLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        try {
            val account = task.getResult(ApiException::class.java)
            val idToken = account?.idToken
            if (idToken.isNullOrBlank()) {
                toast("Google sign-in failed: missing ID token")
            } else {
                submitGoogleToken(idToken)
            }
        } catch (e: ApiException) {
            toast("Google sign-in failed (code ${e.statusCode})")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestEmail()
            .requestIdToken(BuildConfig.WEB_CLIENT_ID)
            .build()
        googleClient = GoogleSignIn.getClient(this, gso)

        binding.buttonGoogle.setOnClickListener {
            googleSignInLauncher.launch(googleClient.signInIntent)
        }

        binding.buttonLogin.setOnClickListener {
            val email = binding.inputEmail.text?.toString().orEmpty().trim()
            val password = binding.inputPassword.text?.toString().orEmpty()
            if (email.isEmpty() || password.isEmpty()) {
                toast(getString(R.string.hint_email) + " / " + getString(R.string.hint_password))
                return@setOnClickListener
            }
            lifecycleScope.launch {
                setLoading(true)
                when (val result = AuthRepository.loginWithEmail(email, password)) {
                    is AuthResult.Success -> goToMain()
                    is AuthResult.Failure -> toast(result.message)
                }
                setLoading(false)
            }
        }

        binding.buttonRegister.setOnClickListener {
            val name = binding.inputName.text?.toString().orEmpty().trim()
            val email = binding.inputEmail.text?.toString().orEmpty().trim()
            val password = binding.inputPassword.text?.toString().orEmpty()
            if (name.isEmpty() || email.isEmpty() || password.length < 6) {
                toast("Enter name, email and a password with 6+ characters")
                return@setOnClickListener
            }
            lifecycleScope.launch {
                setLoading(true)
                when (val result = AuthRepository.register(name, email, password)) {
                    is AuthResult.Success -> goToMain()
                    is AuthResult.Failure -> toast(result.message)
                }
                setLoading(false)
            }
        }
    }

    private fun submitGoogleToken(idToken: String) {
        lifecycleScope.launch {
            setLoading(true)
            when (val result = AuthRepository.loginWithGoogleIdToken(idToken)) {
                is AuthResult.Success -> goToMain()
                is AuthResult.Failure -> toast(result.message)
            }
            setLoading(false)
        }
    }

    private fun setLoading(loading: Boolean) {
        binding.progress.visibility = if (loading) android.view.View.VISIBLE else android.view.View.GONE
        binding.buttonGoogle.isEnabled = !loading
        binding.buttonLogin.isEnabled = !loading
        binding.buttonRegister.isEnabled = !loading
    }

    private fun goToMain() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }

    private fun toast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }
}
