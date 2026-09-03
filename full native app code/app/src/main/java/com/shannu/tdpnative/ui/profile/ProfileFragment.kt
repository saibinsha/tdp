package com.shannu.tdpnative.ui.profile

import android.content.Intent
import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.shannu.tdpnative.TdpApplication
import com.shannu.tdpnative.auth.LoginActivity
import com.shannu.tdpnative.databinding.FragmentProfileBinding
import com.shannu.tdpnative.network.ApiClient
import com.shannu.tdpnative.network.dto.RefreshRequest
import com.shannu.tdpnative.realtime.SocketManager
import kotlinx.coroutines.launch

class ProfileFragment : Fragment() {

    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val session = TdpApplication.instance.sessionManager
        binding.textName.text = session.currentUserName().orEmpty()
        binding.textEmail.text = session.currentUserEmail().orEmpty()
        Glide.with(binding.imageAvatar).load(session.currentUserPicture()).circleCrop().into(binding.imageAvatar)

        binding.buttonLogout.setOnClickListener { logout() }
    }

    private fun logout() {
        val session = TdpApplication.instance.sessionManager
        val refreshToken = session.refreshToken
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                if (!refreshToken.isNullOrBlank()) {
                    ApiClient.service.logout(RefreshRequest(refreshToken))
                }
            } catch (e: Exception) {
                // Ignore network errors on logout - clear the local session anyway.
            }
            SocketManager.disconnect()
            session.clear()
            startActivity(Intent(requireContext(), LoginActivity::class.java))
            requireActivity().finish()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
