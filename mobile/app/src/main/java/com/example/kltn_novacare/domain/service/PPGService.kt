package com.example.kltn_novacare.domain.service

data class PPGMeasurementResult(
    val heartRateBpm: Int,
    val signalQuality: Double, // 0.0 - 1.0
    val durationSeconds: Int,
    val isValid: Boolean,
    val statusMessage: String
)

data class BMICalculationResult(
    val heightCm: Double,
    val weightKg: Double,
    val bmiValue: Double,
    val category: String
)

interface PPGService {
    fun measureHeartRate(durationSec: Int = 15, simulatedBpm: Int = 75): PPGMeasurementResult
    fun calculateBMI(heightCm: Double, weightKg: Double): BMICalculationResult
}

object DefaultPPGService : PPGService {

    override fun measureHeartRate(durationSec: Int, simulatedBpm: Int): PPGMeasurementResult {
        // Signal quality validation (must be >= 0.70)
        val quality = if (simulatedBpm in 45..180) 0.92 else 0.45
        val isValid = quality >= 0.70

        val msg = if (isValid) {
            "Tín hiệu mạch nhịp tim tốt ($simulatedBpm BPM)."
        } else {
            "Chất lượng tín hiệu mờ / không đạt. Vui lòng giữ ngón tay cố định và thử lại."
        }

        return PPGMeasurementResult(
            heartRateBpm = if (isValid) simulatedBpm else 0,
            signalQuality = quality,
            durationSeconds = durationSec,
            isValid = isValid,
            statusMessage = msg
        )
    }

    override fun calculateBMI(heightCm: Double, weightKg: Double): BMICalculationResult {
        val hMeter = heightCm / 100.0
        val bmi = if (hMeter > 0) weightKg / (hMeter * hMeter) else 22.0
        val cat = when {
            bmi < 18.5 -> "Gầy / Thể trạng thấp"
            bmi in 18.5..22.9 -> "Bình thường / Thể trạng tốt"
            bmi in 23.0..24.9 -> "Thừa cân nhẹ"
            else -> "Béo phì / Cần tư vấn dinh dưỡng"
        }
        return BMICalculationResult(
            heightCm = heightCm,
            weightKg = weightKg,
            bmiValue = String.format("%.1f", bmi).toDoubleOrNull() ?: bmi,
            category = cat
        )
    }
}
