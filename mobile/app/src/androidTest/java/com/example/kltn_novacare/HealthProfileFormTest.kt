package com.example.kltn_novacare

import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextReplacement
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.example.kltn_novacare.data.model.PatientProfile
import com.example.kltn_novacare.data.remote.CreatePatientProfileRequest
import com.example.kltn_novacare.ui.screens.profile.FullProfileFormDialog
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class HealthProfileFormTest {
    @get:Rule val compose = createComposeRule()

    @Test fun invalidFormDoesNotSubmit() {
        var submitted: CreatePatientProfileRequest? = null
        compose.setContent {
            MaterialTheme { FullProfileFormDialog("Tạo hồ sơ", "Thông tin bệnh nhân", onDismiss = {}, onSubmit = { submitted = it }) }
        }
        compose.onNodeWithText("Lưu hồ sơ").performClick()
        compose.runOnIdle { assertNull(submitted) }
        compose.onNodeWithText("Họ và tên *").performTextReplacement("Nguyễn An")
        compose.onNodeWithText("Ngày sinh (YYYY-MM-DD) *").performScrollTo().performTextReplacement("2025-02-29")
        compose.onNodeWithText("Lưu hồ sơ").performClick()
        compose.runOnIdle { assertNull(submitted) }
    }

    @Test fun webProfileCanBeEditedAndOptionalMedicalHistoryCleared() {
        var submitted: CreatePatientProfileRequest? = null
        val profile = PatientProfile("profile-1", "owner", "Nguyễn An", dateOfBirth = "2000-02-29T00:00:00.000Z",
            gender = "FEMALE", medicalHistory = "Tiền sử cũ", relationship = "Con cái")
        compose.setContent {
            MaterialTheme { FullProfileFormDialog("Sửa hồ sơ", "Thông tin bệnh nhân", profile = profile,
                onDismiss = {}, onSubmit = { submitted = it }) }
        }
        compose.onNodeWithText("Tiền sử bệnh lý").performScrollTo().performTextReplacement("")
        compose.onNodeWithText("Lưu hồ sơ").performClick()
        compose.runOnIdle {
            assertEquals("FEMALE", submitted?.gender)
            assertEquals("2000-02-29", submitted?.dateOfBirth)
            assertEquals("Con cái", submitted?.relationship)
            assertNull(submitted?.medicalHistory)
        }
    }

    @Test fun savingDisablesResubmissionAndDismissal() {
        compose.setContent {
            MaterialTheme { FullProfileFormDialog("Tạo hồ sơ", "Thông tin bệnh nhân", isSaving = true,
                onDismiss = {}, onSubmit = {}) }
        }
        compose.onNodeWithText("Họ và tên *").assertIsNotEnabled()
        compose.onNodeWithText("Hủy").assertIsNotEnabled()
    }

    @Test fun serverErrorRemainsVisible() {
        compose.setContent {
            MaterialTheme { FullProfileFormDialog("Tạo hồ sơ", "Thông tin bệnh nhân", error = "CCCD đã tồn tại",
                onDismiss = {}, onSubmit = {}) }
        }
        compose.onNodeWithText("CCCD đã tồn tại").assertIsDisplayed()
    }
}
