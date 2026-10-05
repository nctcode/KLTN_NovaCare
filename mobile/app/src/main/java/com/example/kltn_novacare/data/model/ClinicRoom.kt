package com.example.kltn_novacare.data.model

data class ClinicRoom(val id: String, val hospitalId: String, val specialtyId: String, val code: String, val name: String)
data class ClinicRoomSession(val id: String, val mode: String, val room: ClinicRoom, val service: MedicalService, val slot: AppointmentSlot)
