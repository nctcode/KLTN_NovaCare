package com.example.kltn_novacare.ui.screens.profile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.listSaver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.example.kltn_novacare.data.model.PatientProfile
import com.example.kltn_novacare.data.model.PatientProfileFormData
import com.example.kltn_novacare.data.remote.CreatePatientProfileRequest
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

private val FormSaver = listSaver<PatientProfileFormData, String>(
    save = { listOf(it.fullName, it.phone, it.dateOfBirth, it.gender, it.identityNumber,
        it.healthInsurance, it.address, it.relation, it.medicalHistory, it.allergies,
        it.emergencyContact, it.emergencyPhone, it.isDefault.toString()) },
    restore = { PatientProfileFormData(it[0], it[1], it[2], it[3], it[4], it[5], it[6],
        it[7], it[8], it[9], it[10], it[11], it[12].toBoolean()) }
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FullProfileFormDialog(
    title: String,
    subtitle: String,
    profile: PatientProfile? = null,
    isSaving: Boolean = false,
    error: String? = null,
    onDismiss: () -> Unit,
    onSubmit: (CreatePatientProfileRequest) -> Unit
) {
    var form by rememberSaveable(profile?.id, stateSaver = FormSaver) {
        mutableStateOf(PatientProfileFormData.from(profile))
    }
    var submitted by rememberSaveable { mutableStateOf(false) }
    var showDatePicker by rememberSaveable { mutableStateOf(false) }
    var relationExpanded by remember { mutableStateOf(false) }
    val errors = if (submitted) form.validationErrors() else emptyMap()

    AlertDialog(
        onDismissRequest = { if (!isSaving) onDismiss() },
        title = { Text(title) },
        text = {
            Column(
                Modifier.fillMaxWidth().verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(subtitle, style = MaterialTheme.typography.bodySmall)
                Text("Thông tin cá nhân", fontWeight = FontWeight.Bold)
                ProfileTextField("Họ và tên *", form.fullName, isSaving, errors["fullName"]) { form = form.copy(fullName = it) }
                ProfileTextField("Số điện thoại liên hệ", form.phone, isSaving, keyboard = KeyboardType.Phone) { form = form.copy(phone = it) }
                OutlinedTextField(
                    value = form.dateOfBirth,
                    onValueChange = { form = form.copy(dateOfBirth = it) },
                    enabled = !isSaving,
                    label = { Text("Ngày sinh (YYYY-MM-DD) *") },
                    placeholder = { Text("1995-10-25") },
                    isError = errors["dateOfBirth"] != null,
                    supportingText = errors["dateOfBirth"]?.let { { Text(it) } },
                    trailingIcon = {
                        IconButton(onClick = { showDatePicker = true }, enabled = !isSaving) {
                            Icon(Icons.Default.DateRange, contentDescription = "Chọn ngày sinh")
                        }
                    },
                    singleLine = true, modifier = Modifier.fillMaxWidth()
                )
                Text("Giới tính", fontWeight = FontWeight.SemiBold)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("MALE" to "Nam", "FEMALE" to "Nữ", "OTHER" to "Khác").forEach { (value, label) ->
                        FilterChip(selected = form.gender == value, enabled = !isSaving,
                            onClick = { form = form.copy(gender = value) }, label = { Text(label) })
                    }
                }
                Box {
                    OutlinedButton(onClick = { relationExpanded = true }, enabled = !isSaving, modifier = Modifier.fillMaxWidth()) {
                        Text("Quan hệ: ${form.relation}")
                    }
                    DropdownMenu(expanded = relationExpanded, onDismissRequest = { relationExpanded = false }) {
                        listOf("Bản thân", "Bố mẹ", "Vợ/Chồng", "Con cái", "Họ hàng", "Khác").forEach { relation ->
                            DropdownMenuItem(text = { Text(relation) }, onClick = {
                                form = form.copy(relation = relation)
                                relationExpanded = false
                            })
                        }
                    }
                }
                HorizontalDivider()
                Text("Định danh & bảo hiểm", fontWeight = FontWeight.Bold)
                ProfileTextField("Số CCCD / CMND", form.identityNumber, isSaving, keyboard = KeyboardType.Number) { form = form.copy(identityNumber = it) }
                ProfileTextField("Mã số thẻ BHYT", form.healthInsurance, isSaving) { form = form.copy(healthInsurance = it) }
                ProfileTextField("Địa chỉ", form.address, isSaving, multiline = true) { form = form.copy(address = it) }
                HorizontalDivider()
                Text("Tiền sử & liên hệ khẩn cấp", fontWeight = FontWeight.Bold)
                ProfileTextField("Tiền sử bệnh lý", form.medicalHistory, isSaving, multiline = true) { form = form.copy(medicalHistory = it) }
                ProfileTextField("Dị ứng", form.allergies, isSaving, multiline = true) { form = form.copy(allergies = it) }
                ProfileTextField("Người liên hệ khẩn cấp", form.emergencyContact, isSaving) { form = form.copy(emergencyContact = it) }
                ProfileTextField("Số điện thoại khẩn cấp", form.emergencyPhone, isSaving, keyboard = KeyboardType.Phone) { form = form.copy(emergencyPhone = it) }
                Row {
                    Checkbox(checked = form.isDefault, enabled = !isSaving && profile?.isDefault != true,
                        onCheckedChange = { form = form.copy(isDefault = it) })
                    Text("Đặt làm hồ sơ khám chính", modifier = Modifier.padding(top = 12.dp))
                }
                if (profile?.isDefault == true) Text("Để đổi hồ sơ chính, hãy đặt hồ sơ khác làm mặc định.", style = MaterialTheme.typography.bodySmall)
            }
        },
        confirmButton = {
            Column {
                // Keep server/validation errors visible even when the form is scrolled.
                val message = error ?: errors.values.firstOrNull()
                if (message != null) Text(message, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                Button(enabled = !isSaving, onClick = {
                    submitted = true
                    if (form.validationErrors().isEmpty()) onSubmit(form.toRequest(profile != null))
                }) {
                    if (isSaving) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                    else Text("Lưu hồ sơ")
                }
            }
        },
        dismissButton = { TextButton(enabled = !isSaving, onClick = onDismiss) { Text("Hủy") } }
    )

    if (showDatePicker) {
        val initialMillis = runCatching { LocalDate.parse(form.dateOfBirth).atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli() }.getOrNull()
        val pickerState = rememberDatePickerState(initialSelectedDateMillis = initialMillis,
            selectableDates = object : SelectableDates {
                override fun isSelectableDate(utcTimeMillis: Long) =
                    !Instant.ofEpochMilli(utcTimeMillis).atZone(ZoneOffset.UTC).toLocalDate().isAfter(LocalDate.now())
            })
        DatePickerDialog(onDismissRequest = { showDatePicker = false }, confirmButton = {
            TextButton(enabled = pickerState.selectedDateMillis != null, onClick = {
                pickerState.selectedDateMillis?.let {
                    form = form.copy(dateOfBirth = Instant.ofEpochMilli(it).atZone(ZoneOffset.UTC).toLocalDate().toString())
                }
                showDatePicker = false
            }) { Text("Chọn") }
        }, dismissButton = { TextButton(onClick = { showDatePicker = false }) { Text("Hủy") } }) {
            DatePicker(state = pickerState)
        }
    }
}

@Composable
private fun ProfileTextField(
    label: String, value: String, isSaving: Boolean, error: String? = null,
    keyboard: KeyboardType = KeyboardType.Text, multiline: Boolean = false,
    onValueChange: (String) -> Unit
) {
    OutlinedTextField(value = value, onValueChange = onValueChange, label = { Text(label) },
        enabled = !isSaving, singleLine = !multiline, minLines = if (multiline) 2 else 1,
        isError = error != null, supportingText = error?.let { { Text(it) } },
        keyboardOptions = KeyboardOptions(keyboardType = keyboard), modifier = Modifier.fillMaxWidth())
}
