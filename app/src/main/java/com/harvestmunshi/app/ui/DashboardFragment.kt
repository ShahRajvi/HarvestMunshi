package com.harvestmunshi.app.ui

import android.app.AlertDialog
import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.harvestmunshi.app.R
import com.harvestmunshi.app.data.CropDataManager
import com.harvestmunshi.app.model.Crop
import com.harvestmunshi.app.model.HarvestEvent
import org.json.JSONArray
import org.json.JSONObject

class DashboardFragment : Fragment() {
    private lateinit var cropsRecyclerView: RecyclerView
    private lateinit var cropsAdapter: CropsAdapter
    private lateinit var crops: MutableList<Crop>
    private lateinit var ringChart: RingChartView

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_dashboard, container, false)
        cropsRecyclerView = view.findViewById(R.id.dashboardCropsRecyclerView)
        ringChart = view.findViewById(R.id.harvestRingChart)

        crops = mutableListOf()
        cropsAdapter = CropsAdapter(crops, requireContext(), { crop ->
            // Open notes page for this crop
            parentFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, CropNotesFragment.newInstance(crop.potId))
                .addToBackStack(null)
                .commit()
        }, onHarvestChanged = {
            val totalHarvest = crops.sumOf { it.totalHarvest }
            ringChart.setValue(totalHarvest)
            CropDataManager.saveCrops(requireContext(), crops)
        })
        cropsRecyclerView.layoutManager = GridLayoutManager(requireContext(), 2)
        cropsRecyclerView.adapter = cropsAdapter

        return view
    }

    override fun onResume() {
        super.onResume()
        refreshDashboardData()
    }

    private fun refreshDashboardData() {
        val loadedCrops = CropDataManager.loadCrops(requireContext())
        crops.clear()
        crops.addAll(loadedCrops)
        cropsAdapter.notifyDataSetChanged()

        val totalHarvest = crops.sumOf { it.totalHarvest }
        ringChart.setValue(totalHarvest)
    }

    private fun showNotesDialog(crop: Crop) {
        val builder = AlertDialog.Builder(requireContext())
        val dialogView = LayoutInflater.from(requireContext()).inflate(android.R.layout.simple_list_item_1, null)
        val notesList = TextView(requireContext())
        notesList.text = crop.notes.joinToString("\n\n")
        val input = EditText(requireContext())
        input.hint = "Add a note..."
        val layout = LinearLayout(requireContext())
        layout.orientation = LinearLayout.VERTICAL
        layout.addView(notesList)
        layout.addView(input)
        builder.setView(layout)
        builder.setTitle("Notes for ${crop.name}")
        builder.setPositiveButton("Add") { _, _ ->
            val note = input.text.toString().trim()
            if (note.isNotEmpty()) {
                crop.notes.add(0, note)
                CropDataManager.saveCrops(requireContext(), crops)
                cropsAdapter.notifyDataSetChanged()
            }
        }
        builder.setNegativeButton("Close", null)
        builder.show()
    }

    private class CropsAdapter(
        private val crops: MutableList<Crop>,
        private val context: Context,
        private val onNotes: (Crop) -> Unit,
        private val onHarvestChanged: (() -> Unit)? = null
    ) : RecyclerView.Adapter<CropsAdapter.CropViewHolder>() {
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CropViewHolder {
            val view = LayoutInflater.from(parent.context).inflate(R.layout.item_crop, parent, false)
            return CropViewHolder(view)
        }
        override fun onBindViewHolder(holder: CropViewHolder, position: Int) {
            val crop = crops[position]
            holder.bind(crop, onNotes, onHarvestChanged)
        }
        override fun getItemCount() = crops.size
        class CropViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            fun bind(crop: Crop, onNotes: (Crop) -> Unit, onHarvestChanged: (() -> Unit)?) {
                val potIdView = itemView.findViewById<TextView>(R.id.potIdText)
                val cropNameView = itemView.findViewById<TextView>(R.id.cropNameText)
                val harvestCountView = itemView.findViewById<TextView>(R.id.harvestCountText)
                val emojiView = itemView.findViewById<TextView>(R.id.cropEmoji)
                val notesIcon = itemView.findViewById<TextView>(R.id.notesIcon)
//                val incrementButton = itemView.findViewById<ImageButton>(R.id.incrementButton)
//                val decrementButton = itemView.findViewById<ImageButton>(R.id.decrementButton)
                cropNameView.text = crop.name
                potIdView.text = "Pot ${crop.potId}"
                harvestCountView.text = crop.totalHarvest.toString()
                emojiView.text = crop.emoji
                notesIcon.setOnClickListener { onNotes(crop) }
//                incrementButton.setOnClickListener {
//                    crop.totalHarvest++
//                    harvestCountView.text = crop.totalHarvest.toString()
//                    onHarvestChanged?.invoke()
//                }
//                decrementButton.setOnClickListener {
//                    if (crop.totalHarvest > 0) {
//                        crop.totalHarvest--
//                        harvestCountView.text = crop.totalHarvest.toString()
//                        onHarvestChanged?.invoke()
//                    }
                }
            }
        }
    }
