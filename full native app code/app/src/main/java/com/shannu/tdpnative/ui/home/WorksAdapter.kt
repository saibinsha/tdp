package com.shannu.tdpnative.ui.home

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.shannu.tdpnative.databinding.ItemWorkBinding
import com.shannu.tdpnative.network.dto.WorkDto

class WorksAdapter(private val items: List<WorkDto>) : RecyclerView.Adapter<WorksAdapter.Holder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
        val binding = ItemWorkBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return Holder(binding)
    }

    override fun onBindViewHolder(holder: Holder, position: Int) {
        val item = items[position]
        holder.binding.textTitle.text = item.title
        holder.binding.textDescription.text = item.description.orEmpty()
        Glide.with(holder.binding.imageWork).load(item.imageUrl).centerCrop().into(holder.binding.imageWork)
    }

    override fun getItemCount(): Int = items.size

    class Holder(val binding: ItemWorkBinding) : RecyclerView.ViewHolder(binding.root)
}
