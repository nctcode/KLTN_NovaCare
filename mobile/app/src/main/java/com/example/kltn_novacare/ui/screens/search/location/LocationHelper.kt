package com.example.kltn_novacare.ui.screens.search.location

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.net.Uri
import android.provider.Settings
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import com.google.android.gms.tasks.Task
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume

sealed interface UserLocationState {
    object Idle : UserLocationState
    object Locating : UserLocationState
    data class Available(val latitude: Double, val longitude: Double) : UserLocationState
    object PermissionDenied : UserLocationState
    object PermissionPermanentlyDenied : UserLocationState
    object LocationDisabled : UserLocationState
    data class Error(val message: String) : UserLocationState
}

private suspend fun <T> Task<T>.awaitTask(): T? =
    suspendCancellableCoroutine { cont ->
        addOnSuccessListener { result ->
            if (cont.isActive) cont.resume(result)
        }
        addOnFailureListener {
            if (cont.isActive) cont.resume(null)
        }
        addOnCanceledListener {
            if (cont.isActive) cont.resume(null)
        }
    }

class LocationHelper(private val context: Context) {
    private val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)
    private var cachedLocation: Location? = null

    fun hasLocationPermission(): Boolean {
        val fineLocation = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        val coarseLocation = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        return fineLocation || coarseLocation
    }

    fun isLocationEnabled(): Boolean {
        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
            ?: return false
        return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
                locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }

    @SuppressLint("MissingPermission")
    suspend fun getCurrentLocation(): UserLocationState = withContext(Dispatchers.IO) {
        if (!hasLocationPermission()) {
            return@withContext UserLocationState.PermissionDenied
        }

        if (!isLocationEnabled()) {
            return@withContext UserLocationState.LocationDisabled
        }

        // Return cached location if fresh (< 2 mins)
        cachedLocation?.let { cached ->
            val ageMs = System.currentTimeMillis() - cached.time
            if (ageMs < 120_000) {
                return@withContext UserLocationState.Available(cached.latitude, cached.longitude)
            }
        }

        try {
            // 1. Try fused location lastLocation
            val lastLocation: Location? = withTimeoutOrNull(2500) {
                try {
                    fusedLocationClient.lastLocation.awaitTask()
                } catch (e: SecurityException) {
                    null
                } catch (e: Exception) {
                    null
                }
            }

            if (lastLocation != null) {
                cachedLocation = lastLocation
                return@withContext UserLocationState.Available(lastLocation.latitude, lastLocation.longitude)
            }

            // 2. Request fresh location with high accuracy
            val cancellationTokenSource = CancellationTokenSource()
            val freshLocation: Location? = withTimeoutOrNull(5000) {
                try {
                    fusedLocationClient.getCurrentLocation(
                        Priority.PRIORITY_HIGH_ACCURACY,
                        cancellationTokenSource.token
                    ).awaitTask()
                } catch (e: SecurityException) {
                    null
                } catch (e: Exception) {
                    null
                }
            }

            if (freshLocation != null) {
                cachedLocation = freshLocation
                return@withContext UserLocationState.Available(freshLocation.latitude, freshLocation.longitude)
            }

            // 3. Fallback to Android LocationManager
            val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
            val gpsLoc = try {
                locationManager?.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            } catch (e: SecurityException) {
                null
            }

            val netLoc = try {
                locationManager?.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            } catch (e: SecurityException) {
                null
            }

            val fallbackLoc = gpsLoc ?: netLoc
            if (fallbackLoc != null) {
                cachedLocation = fallbackLoc
                return@withContext UserLocationState.Available(fallbackLoc.latitude, fallbackLoc.longitude)
            }

            return@withContext UserLocationState.Error("Không thể lấy vị trí hiện tại của thiết bị")
        } catch (e: SecurityException) {
            return@withContext UserLocationState.PermissionDenied
        } catch (e: Exception) {
            return@withContext UserLocationState.Error(e.localizedMessage ?: "Lỗi xác định vị trí")
        }
    }

    fun openLocationSettings() {
        try {
            val intent = Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            // Fallback to general settings
            val intent = Intent(Settings.ACTION_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        }
    }

    fun openAppSettings() {
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.fromParts("package", context.packageName, null)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            // Ignored
        }
    }
}
