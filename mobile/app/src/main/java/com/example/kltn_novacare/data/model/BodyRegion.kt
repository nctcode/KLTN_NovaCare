package com.example.kltn_novacare.data.model

data class BodyRegion(
    val id: String,
    val name: String,
    val displayName: String,
    val side: String, // "left", "right", "center"
    val category: String, // "head", "neck", "chest", "abdomen", "back", "shoulder", "arm", "leg"
    val modelEntityNames: List<String> = emptyList()
)
