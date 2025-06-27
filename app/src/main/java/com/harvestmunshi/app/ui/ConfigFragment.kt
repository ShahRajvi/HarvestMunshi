package com.harvestmunshi.app.ui

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.harvestmunshi.app.R
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.*
import kotlin.collections.ArrayList
import org.json.JSONArray
import org.json.JSONObject
import com.harvestmunshi.app.model.Crop
import com.harvestmunshi.app.model.HarvestEvent
import com.harvestmunshi.app.data.CropDataManager

class ConfigFragment : Fragment() {
    private lateinit var cropsRecyclerView: RecyclerView
    private lateinit var cropsAdapter: CropsAdapter
    private lateinit var crops: MutableList<Crop>
    private lateinit var addCropForm: LinearLayout
    private lateinit var potIdInput: EditText
    private lateinit var cropNameInput: EditText

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_config, container, false)
        cropsRecyclerView = view.findViewById(R.id.cropsRecyclerView)
        addCropForm = view.findViewById(R.id.addCropForm)
        potIdInput = view.findViewById(R.id.potIdInput)
        cropNameInput = view.findViewById(R.id.cropNameInput)
        val addNewCropButton = view.findViewById<Button>(R.id.addNewCropButton)
        val addCropTypeButton = view.findViewById<Button>(R.id.addCropTypeButton)
        val exportLogsButton = view.findViewById<Button>(R.id.exportLogsButton)

        crops = CropDataManager.loadCrops(requireContext())
        cropsAdapter = CropsAdapter(crops, { crop ->
            deleteCrop(crop)
        }, { crop ->
            logHarvest(crop)
        })
        cropsRecyclerView.layoutManager = LinearLayoutManager(requireContext())
        cropsRecyclerView.adapter = cropsAdapter

        addNewCropButton.setOnClickListener {
            addCropForm.visibility = if (addCropForm.visibility == View.VISIBLE) View.GONE else View.VISIBLE
        }
        addCropTypeButton.setOnClickListener {
            val potId = potIdInput.text.toString().trim()
            val cropName = cropNameInput.text.toString().trim()
            if (potId.isEmpty() || cropName.isEmpty()) {
                Toast.makeText(requireContext(), "Please enter both Pot ID and Crop Name", Toast.LENGTH_SHORT).show()
            } else {
                val newCrop = Crop(potId.toInt(), cropName, "")
                crops.add(newCrop)
                CropDataManager.saveCrops(requireContext(), crops)
                cropsAdapter.notifyItemInserted(crops.size - 1)
                potIdInput.text.clear()
                cropNameInput.text.clear()
                addCropForm.visibility = View.GONE
            }
        }
        exportLogsButton.setOnClickListener {
            exportCrops(requireContext(), crops)
        }
        return view
    }

    private fun deleteCrop(crop: Crop) {
        val index = crops.indexOf(crop)
        if (index != -1) {
            crops.removeAt(index)
            CropDataManager.saveCrops(requireContext(), crops)
            cropsAdapter.notifyItemRemoved(index)
        }
    }

    private fun logHarvest(crop: Crop) {
        crop.totalHarvest += 1
        crop.harvestEvents.add(HarvestEvent(System.currentTimeMillis(), 1))
        CropDataManager.saveCrops(requireContext(), crops)
        cropsAdapter.notifyDataSetChanged()
    }

    // Export crops as CSV and share
    private fun exportCrops(context: Context, crops: List<Crop>) {
        if (crops.isEmpty()) {
            Toast.makeText(context, "No crops to export", Toast.LENGTH_SHORT).show()
            return
        }
        val csv = StringBuilder()
        csv.append("Pot ID,Crop Name,Total Harvest\n")
        crops.forEach { csv.append("${'$'}{it.potId},${'$'}{it.name},${'$'}{it.totalHarvest}\n") }
        val fileName = "harvest_crops_${SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())}.csv"
        val file = File(context.cacheDir, fileName)
        FileOutputStream(file).use { it.write(csv.toString().toByteArray()) }
        val uri = androidx.core.content.FileProvider.getUriForFile(
            context,
            context.applicationContext.packageName + ".provider",
            file
        )
        val intent = Intent(Intent.ACTION_SEND)
        intent.type = "text/csv"
        intent.putExtra(Intent.EXTRA_STREAM, uri)
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        startActivity(Intent.createChooser(intent, "Export Crops"))
    }

    // RecyclerView Adapter
    private class CropsAdapter(
        private val crops: List<Crop>,
        private val onDelete: (Crop) -> Unit,
        private val onLogHarvest: (Crop) -> Unit
    ) : RecyclerView.Adapter<CropsAdapter.CropViewHolder>() {
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CropViewHolder {
            val view = LayoutInflater.from(parent.context).inflate(R.layout.item_crop_table_row, parent, false)
            return CropViewHolder(view)
        }
        override fun onBindViewHolder(holder: CropViewHolder, position: Int) {
            val crop = crops[position]
            holder.bind(crop, onDelete, onLogHarvest)
        }
        override fun getItemCount() = crops.size
        class CropViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            fun bind(crop: Crop, onDelete: (Crop) -> Unit, onLogHarvest: (Crop) -> Unit) {
                val potIdView = itemView.findViewById<TextView>(R.id.potIdText)
                val cropNameView = itemView.findViewById<TextView>(R.id.cropNameText)
                val harvestCountView = itemView.findViewById<TextView>(R.id.harvestCountText)
                val logHarvestButton = itemView.findViewById<Button?>(R.id.logHarvestButton)
                potIdView.text = crop.potId.toString()
                cropNameView.text = crop.name
                harvestCountView.text = crop.totalHarvest.toString()
                itemView.setOnLongClickListener {
                    onDelete(crop)
                    true
                }
                logHarvestButton?.setOnClickListener {
                    onLogHarvest(crop)
                }
            }
        }
    }
} 