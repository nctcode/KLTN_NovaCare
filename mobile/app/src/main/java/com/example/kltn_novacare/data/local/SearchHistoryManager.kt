package com.example.kltn_novacare.data.local

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class SearchHistoryManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    private val gson = Gson()

    fun getRecentSearches(): List<String> {
        val json = prefs.getString(KEY_RECENT_SEARCHES, null) ?: return emptyList()
        return try {
            val type = object : TypeToken<List<String>>() {}.type
            gson.fromJson(json, type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun addSearch(query: String) {
        val clean = query.trim()
        if (clean.isBlank()) return

        val current = getRecentSearches().toMutableList()
        current.removeAll { it.equals(clean, ignoreCase = true) }
        current.add(0, clean)

        // Keep maximum 15 items
        val capped = current.take(15)
        prefs.edit().putString(KEY_RECENT_SEARCHES, gson.toJson(capped)).apply()
    }

    fun removeSearch(query: String) {
        val current = getRecentSearches().toMutableList()
        current.removeAll { it.equals(query, ignoreCase = true) }
        prefs.edit().putString(KEY_RECENT_SEARCHES, gson.toJson(current)).apply()
    }

    fun clearAll() {
        prefs.edit().remove(KEY_RECENT_SEARCHES).apply()
    }

    companion object {
        private const val PREF_NAME = "novacare_search_history"
        private const val KEY_RECENT_SEARCHES = "recent_queries"
    }
}
