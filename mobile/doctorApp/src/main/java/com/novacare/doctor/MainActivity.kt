package com.novacare.doctor

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.novacare.doctor.data.DoctorApiClient
import com.novacare.doctor.ui.DoctorApp
import com.novacare.doctor.ui.NovaCareDoctorTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        DoctorApiClient.init(applicationContext)
        enableEdgeToEdge()
        setContent { NovaCareDoctorTheme { DoctorApp() } }
    }
}
