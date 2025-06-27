package com.harvestmunshi.app.model

import java.io.Serializable

// Represents a single harvest event
data class HarvestEvent(val date: Long, val quantity: Int) : Serializable

// Represents a crop with harvest history and notes
data class Crop(
    val potId: Int = 0,
    val name: String,
    val emoji: String = "",
    var totalHarvest: Int = 0,
    var harvestEvents: MutableList<HarvestEvent> = mutableListOf(),
    var notes: MutableList<String> = mutableListOf()
) : Serializable 