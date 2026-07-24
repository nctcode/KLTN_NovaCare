package com.example.kltn_novacare.data.repository

import com.example.kltn_novacare.data.model.Appointment
import com.example.kltn_novacare.data.model.Notification
import com.example.kltn_novacare.data.remote.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AppointmentRepository {
    private val apiService = ApiClient.getService()

    suspend fun createAppointment(request: CreateAppointmentRequest): Result<Appointment> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.createAppointment(request).execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success && body.data != null) {
                Result.success(body.data)
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Đặt lịch khám thất bại"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAppointments(): Result<List<Appointment>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getAppointments().execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success) {
                Result.success(body.data ?: emptyList())
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Không thể tải lịch khám"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getUpcomingAppointments(): Result<List<Appointment>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getUpcomingAppointments().execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success) {
                Result.success(body.data ?: emptyList())
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Không thể tải lịch khám sắp tới"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAppointmentHistory(): Result<List<Appointment>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getAppointmentHistory().execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success) {
                Result.success(body.data ?: emptyList())
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Không thể tải lịch sử khám"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAppointmentById(id: String): Result<Appointment> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getAppointmentById(id).execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success && body.data != null) {
                Result.success(body.data)
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Không tìm thấy chi tiết lịch khám"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun cancelAppointment(id: String, reason: String): Result<Appointment> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.cancelAppointment(id, CancelAppointmentRequest(reason)).execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success && body.data != null) {
                Result.success(body.data)
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Hủy lịch khám thất bại"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun rescheduleAppointment(id: String, newSlotId: String): Result<Appointment> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.rescheduleAppointment(id, RescheduleAppointmentRequest(newSlotId)).execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success && body.data != null) {
                Result.success(body.data)
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Đổi lịch khám thất bại"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createPayment(appointmentId: String): Result<String> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.createPayment(CreatePaymentRequest(appointmentId)).execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success && body.data != null) {
                Result.success(body.data.paymentUrl)
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Không thể tạo liên kết thanh toán"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getPaymentStatus(appointmentId: String): Result<PaymentStatusResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getPaymentStatus(appointmentId).execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success && body.data != null) {
                Result.success(body.data)
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Không thể kiểm tra trạng thái thanh toán"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getNotifications(): Result<List<Notification>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getNotifications().execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success) {
                Result.success(body.data ?: emptyList())
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Không thể tải thông báo"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markNotificationAsRead(id: String): Result<Notification> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.markNotificationAsRead(id).execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success && body.data != null) {
                Result.success(body.data)
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Thao tác thất bại"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markAllNotificationsAsRead(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.markAllNotificationsAsRead().execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Thao tác thất bại"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getUnreadNotificationsCount(): Result<Int> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getUnreadNotificationsCount().execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success) {
                Result.success(body.data ?: 0)
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Thao tác thất bại"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
