package com.harvestmunshi.app.data

import android.content.Context
import com.harvestmunshi.app.model.Crop
import com.harvestmunshi.app.model.HarvestEvent
import org.json.JSONArray
import org.json.JSONException
import android.util.Log

object CropDataManager {

    private const val PREFS_NAME = "config_crops"
    private const val CROPS_KEY = "crops"
    private const val TAG = "CropDataManager"

    fun loadCrops(context: Context): MutableList<Crop> {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val set = prefs.getStringSet(CROPS_KEY, emptySet()) ?: emptySet()
        Log.d(TAG, "Loading crops. Found ${set.size} entries in SharedPreferences.")
        return set.mapNotNull {
            try {
                val parts = it.split("|")
                if (parts.size >= 4) {
                    val potId = parts[0].toInt()
                    val name = parts[1]
                    val emoji = parts[2]
                    val totalHarvest = parts[3].toInt()
                    val harvestEvents = if (parts.size >= 5) parseHarvestEvents(parts[4]) else mutableListOf()
                    val notes = if (parts.size >= 6) parseNotes(parts[5]) else mutableListOf()
                    Crop(potId, name, emoji, totalHarvest, harvestEvents, notes)
                } else null
            } catch (e: Exception) {
                // Ignore malformed entries
                Log.e(TAG, "Failed to parse crop: $it", e)
                null
            }
        }.toMutableList()
    }

    fun saveCrops(context: Context, crops: List<Crop>) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val set = crops.map {
            val eventsJson = JSONArray(it.harvestEvents.map { event ->
                mapOf("date" to event.date, "quantity" to event.quantity)
            })
            val notesJson = JSONArray(it.notes)
            "${it.potId}|${it.name}|${it.emoji}|${it.totalHarvest}|${eventsJson}|${notesJson}"
        }.toSet()
        Log.d(TAG, "Saving ${crops.size} crops to SharedPreferences.")
        prefs.edit().putStringSet(CROPS_KEY, set).apply()
    }

    private fun parseHarvestEvents(json: String?): MutableList<HarvestEvent> {
        val list = mutableListOf<HarvestEvent>()
        if (json.isNullOrEmpty()) return list
        try {
            val array = JSONArray(json)
            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                list.add(HarvestEvent(obj.getLong("date"), obj.getInt("quantity")))
            }
        } catch (e: JSONException) {
            // Ignore malformed array
        }
        return list
    }

    private fun parseNotes(json: String?): MutableList<String> {
        val list = mutableListOf<String>()
        if (json.isNullOrEmpty()) return list
        try {
            val array = JSONArray(json)
            for (i in 0 until array.length()) {
                list.add(array.getString(i))
            }
        } catch (e: JSONException) {
            // Ignore malformed array
        }
        return list
    }
} 