package com.shannu.tdpnative.ui.leaders

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.shannu.tdpnative.databinding.ItemLeaderBinding
import com.shannu.tdpnative.network.dto.LeaderDto

class LeadersAdapter(private val items: List<LeaderDto>) :
    RecyclerView.Adapter<LeadersAdapter.Holder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
        val binding = ItemLeaderBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return Holder(binding)
    }

    override fun onBindViewHolder(holder: Holder, position: Int) {
        val item = items[position]
        holder.binding.textName.text = item.name
        holder.binding.textRole.text = item.role
        Glide.with(holder.binding.imagePhoto).load(item.photoUrl).circleCrop().into(holder.binding.imagePhoto)
    }

    override fun getItemCount(): Int = items.size

    class Holder(val binding: ItemLeaderBinding) : RecyclerView.ViewHolder(binding.root)
}
