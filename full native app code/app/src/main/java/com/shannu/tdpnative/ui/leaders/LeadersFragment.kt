package com.shannu.tdpnative.ui.leaders

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.shannu.tdpnative.databinding.FragmentLeadersBinding
import com.shannu.tdpnative.network.dto.LeaderDto
import kotlinx.coroutines.launch

/** Native equivalent of the "Leaders" static section on the website. */
class LeadersFragment : Fragment() {

    private var _binding: FragmentLeadersBinding? = null
    private val binding get() = _binding!!
    private val items = mutableListOf<LeaderDto>()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentLeadersBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val adapter = LeadersAdapter(items)
        binding.recyclerLeaders.layoutManager = LinearLayoutManager(requireContext())
        binding.recyclerLeaders.adapter = adapter
        binding.swipeRefresh.setOnRefreshListener { load(adapter) }
        load(adapter)
    }

    private fun load(adapter: LeadersAdapter) {
        binding.swipeRefresh.isRefreshing = true
        viewLifecycleOwner.lifecycleScope.launch {
            LeadersRepository.leaders().onSuccess { list ->
                items.clear()
                items.addAll(list)
                adapter.notifyDataSetChanged()
            }
            binding.swipeRefresh.isRefreshing = false
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
