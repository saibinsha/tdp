package com.shannu.tdpnative.ui.messages

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.shannu.tdpnative.databinding.ItemMessageInBinding
import com.shannu.tdpnative.databinding.ItemMessageOutBinding
import com.shannu.tdpnative.network.dto.MessageDto

class ChatAdapter(
    private val items: List<MessageDto>,
    private val myUserId: () -> String?
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    override fun getItemViewType(position: Int): Int {
        val msg = items[position]
        return if (msg.fromUserId() == myUserId()) TYPE_OUT else TYPE_IN
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        return if (viewType == TYPE_OUT) {
            OutHolder(ItemMessageOutBinding.inflate(inflater, parent, false))
        } else {
            InHolder(ItemMessageInBinding.inflate(inflater, parent, false))
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val msg = items[position]
        when (holder) {
            is OutHolder -> holder.binding.textMessage.text = msg.text
            is InHolder -> holder.binding.textMessage.text = msg.text
        }
    }

    override fun getItemCount(): Int = items.size

    class OutHolder(val binding: ItemMessageOutBinding) : RecyclerView.ViewHolder(binding.root)
    class InHolder(val binding: ItemMessageInBinding) : RecyclerView.ViewHolder(binding.root)

    companion object {
        private const val TYPE_IN = 0
        private const val TYPE_OUT = 1
    }
}
