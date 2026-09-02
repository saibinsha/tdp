package com.shannu.tdpnative.ui.messages

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.shannu.tdpnative.databinding.ItemConversationBinding
import com.shannu.tdpnative.network.dto.ConversationDto

class ConversationsAdapter(
    private val items: List<ConversationDto>,
    private val onClick: (ConversationDto) -> Unit
) : RecyclerView.Adapter<ConversationsAdapter.Holder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
        val binding = ItemConversationBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return Holder(binding)
    }

    override fun onBindViewHolder(holder: Holder, position: Int) {
        val item = items[position]
        holder.binding.textName.text = item.otherUser.name ?: "Member"
        holder.binding.textLastMessage.text = item.lastMessage?.text.orEmpty()
        Glide.with(holder.binding.imageAvatar)
            .load(item.otherUser.profilePicture)
            .circleCrop()
            .into(holder.binding.imageAvatar)
        holder.binding.root.setOnClickListener { onClick(item) }
    }

    override fun getItemCount(): Int = items.size

    class Holder(val binding: ItemConversationBinding) : RecyclerView.ViewHolder(binding.root)
}
