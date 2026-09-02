package com.shannu.tdpnative.ui.messages

import android.content.Intent
import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.shannu.tdpnative.databinding.FragmentMessagesBinding
import com.shannu.tdpnative.network.dto.ConversationDto
import kotlinx.coroutines.launch

class MessagesFragment : Fragment() {

    private var _binding: FragmentMessagesBinding? = null
    private val binding get() = _binding!!
    private val items = mutableListOf<ConversationDto>()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentMessagesBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val adapter = ConversationsAdapter(items) { openChat(it) }
        binding.recyclerConversations.layoutManager = LinearLayoutManager(requireContext())
        binding.recyclerConversations.adapter = adapter

        binding.swipeRefresh.setOnRefreshListener { load(adapter) }
        load(adapter)
    }

    private fun load(adapter: ConversationsAdapter) {
        binding.swipeRefresh.isRefreshing = true
        viewLifecycleOwner.lifecycleScope.launch {
            MessagesRepository.conversations().onSuccess { list ->
                items.clear()
                items.addAll(list)
                adapter.notifyDataSetChanged()
            }
            binding.swipeRefresh.isRefreshing = false
        }
    }

    private fun openChat(conversation: ConversationDto) {
        val intent = Intent(requireContext(), ChatActivity::class.java).apply {
            putExtra(ChatActivity.EXTRA_USER_ID, conversation.otherUser._id)
            putExtra(ChatActivity.EXTRA_USER_NAME, conversation.otherUser.name)
        }
        startActivity(intent)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
