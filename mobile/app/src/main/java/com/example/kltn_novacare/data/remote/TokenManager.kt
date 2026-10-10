package com.example.kltn_novacare.data.remote

import android.content.Context
import android.content.SharedPreferences

class TokenManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREFS_NAME = "novacare_prefs"
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_AVATAR = "user_avatar"
    }

    fun saveTokens(accessToken: String, refreshToken: String) {
        prefs.edit().apply {
            putString(KEY_ACCESS_TOKEN, accessToken)
            putString(KEY_REFRESH_TOKEN, refreshToken)
            apply()
        }
    }

    fun saveUser(id: String, fullName: String, email: String, avatarUrl: String? = null) {
        prefs.edit().apply {
            putString(KEY_USER_ID, id)
            putString(KEY_USER_NAME, fullName)
            putString(KEY_USER_EMAIL, email)
            if (avatarUrl != null) {
                putString(KEY_USER_AVATAR, avatarUrl)
            }
            apply()
        }
    }

    fun saveAvatar(avatarUri: String?) {
        prefs.edit().apply {
            if (avatarUri != null) {
                putString(KEY_USER_AVATAR, avatarUri)
            } else {
                remove(KEY_USER_AVATAR)
            }
            apply()
        }
    }

    fun getAccessToken(): String? = prefs.getString(KEY_ACCESS_TOKEN, null)

    fun getRefreshToken(): String? = prefs.getString(KEY_REFRESH_TOKEN, null)

    fun getUserId(): String? = prefs.getString(KEY_USER_ID, null)

    fun getUserName(): String? = prefs.getString(KEY_USER_NAME, null)

    fun getUserEmail(): String? = prefs.getString(KEY_USER_EMAIL, null)

    fun getUserAvatar(): String? = prefs.getString(KEY_USER_AVATAR, null)

    fun clear() {
        prefs.edit().clear().apply()
    }
}
