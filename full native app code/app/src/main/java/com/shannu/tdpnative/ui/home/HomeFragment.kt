package com.shannu.tdpnative.ui.home

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.shannu.tdpnative.databinding.FragmentHomeBinding
import com.shannu.tdpnative.network.dto.WorkDto
import kotlinx.coroutines.launch

/**
 * Native "Home" feed - mirrors the same static/party-works section shown on
 * the website home page (server/routes/works.routes.js), so the app feels
 * like a true native counterpart of the site rather than a generic shell.
 */
class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!
    private val items = mutableListOf<WorkDto>()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val adapter = WorksAdapter(items)
        binding.recyclerWorks.layoutManager = LinearLayoutManager(requireContext())
        binding.recyclerWorks.adapter = adapter
        binding.swipeRefresh.setOnRefreshListener { load(adapter) }
        load(adapter)
    }

    private fun load(adapter: WorksAdapter) {
        binding.swipeRefresh.isRefreshing = true
        viewLifecycleOwner.lifecycleScope.launch {
            HomeRepository.works().onSuccess { list ->
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
