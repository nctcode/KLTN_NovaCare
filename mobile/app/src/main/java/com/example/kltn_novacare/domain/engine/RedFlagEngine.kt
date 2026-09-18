package com.example.kltn_novacare.domain.engine

import com.example.kltn_novacare.data.model.RedFlagItem

object RedFlagEngine {

    val RULE_CHEST_PAIN = RedFlagItem(
        id = "RF_CHEST_PAIN",
        title = "Đau Ngực Cấp / Cơn Đau Thắt Ngực Nghi Nặng",
        description = "Đau ngực đè ép, bóp nghẹt lan ra tay trái/hàm kèm vã mồ hôi lạnh.",
        isEmergency = true
    )

    val RULE_DYSPNEA = RedFlagItem(
        id = "RF_DYSPNEA",
        title = "Suy Hô Hấp / Khó Thở Dữ Dội",
        description = "Khó thở ngay khi nghỉ ngơi, không thể nói thành câu hoàn chỉnh.",
        isEmergency = true
    )

    val RULE_STROKE = RedFlagItem(
        id = "RF_STROKE",
        title = "Nghi Ngờ Đột Khụy / Liệt Cấp Tính (FAST)",
        description = "Yếu liệt một bên cơ thể, méo miệng, hoặc nói ngọng đột ngột.",
        isEmergency = true
    )

    val RULE_SYNCOPE = RedFlagItem(
        id = "RF_SYNCOPE",
        title = "Ngất Xỉu / Rối Loạn Tri Giác",
        description = "Mất ý thức đột ngột, choáng váng nặng, nghi ngờ choáng ngợp tuần hoàn.",
        isEmergency = true
    )

    val RULE_HEMORRHAGE = RedFlagItem(
        id = "RF_HEMORRHAGE",
        title = "Chảy Máu Cấp / Ho Nôn Ra Máu",
        description = "Ho ra máu, nôn ra máu hoặc chảy máu vết thương không cầm được.",
        isEmergency = true
    )

    val RULE_SEVERE_HEADACHE = RedFlagItem(
        id = "RF_HEADACHE",
        title = "Đau Đầu Sét Đánh Đột Ngột Dữ Dội",
        description = "Đau đầu dữ dội chưa từng có khởi phát đột ngột trong vài phút.",
        isEmergency = true
    )

    val RULE_EXTREME_PAIN = RedFlagItem(
        id = "RF_EXTREME_PAIN",
        title = "Mức Đồ Đau Dữ Dội (9-10/10)",
        description = "Bệnh nhân báo cáo mức độ đau vượt ngưỡng chịu đựng.",
        isEmergency = true
    )

    /**
     * Evaluates all red flag rules against user inputs.
     * Returns list of triggered RedFlags.
     */
    fun evaluateRedFlags(
        answers: Map<String, String>,
        warnings: Set<String>,
        painLevel: Int,
        heartRateBpm: Int
    ): List<RedFlagItem> {
        val triggered = mutableListOf<RedFlagItem>()

        // 1. Check Pain level
        if (painLevel >= 9) {
            triggered.add(RULE_EXTREME_PAIN)
        }

        // 2. Check Warnings UI
        if (warnings.contains("Tức ngực, khó thở")) {
            triggered.add(RULE_DYSPNEA)
        }

        // 3. Check Q_CARD_PAIN_TYPE & Radiation
        val chestPainAns = answers["Q_CARD_PAIN_TYPE"]
        val cardRadAns = answers["Q_CARD_RADIATION"]
        val cardAssoc = answers["Q_CARD_ASSOCIATED"]

        if (chestPainAns == "Đau đè ép / bóp nghẹt sau xương ức" ||
            cardRadAns?.contains("Lan ra vai / tay trái") == true ||
            cardAssoc?.contains("Ngất xỉu") == true ||
            cardAssoc?.contains("Vã mồ hôi lạnh") == true) {
            triggered.add(RULE_CHEST_PAIN)
        }

        // 4. Check Q_RESP_DYSPNEA
        val dyspneaAns = answers["Q_RESP_DYSPNEA"]
        if (dyspneaAns == "Khó thở dữ dội, không thể nói thành câu") {
            triggered.add(RULE_DYSPNEA)
        }

        // 5. Check Q_NEURO_DEFICIT (Stroke signs)
        val neuroAns = answers["Q_NEURO_DEFICIT"]
        if (neuroAns?.contains("Yếu / liệt một bên tay hoặc chân") == true ||
            neuroAns?.contains("Tê bì mặt / méo miệng") == true ||
            neuroAns?.contains("Nói ngọng / khó nói") == true) {
            triggered.add(RULE_STROKE)
        }

        // 6. Check Hemorrhage
        val coughAns = answers["Q_RESP_COUGH"]
        val giAns = answers["Q_GI_SYMPTOMS"]
        if (coughAns == "Ho ra máu" || giAns?.contains("Nôn ra máu / chất đen") == true) {
            triggered.add(RULE_HEMORRHAGE)
        }

        // 7. Check Vitals heart rate extremum
        if (heartRateBpm > 140 || (heartRateBpm in 1..40)) {
            triggered.add(RedFlagItem(
                id = "RF_VITALS_EXTREME",
                title = "Nhịp Tim Bất Thường Nguy Hiểm ($heartRateBpm BPM)",
                description = "Nhịp tim đo được quá nhanh hoặc quá chậm nguy hiểm.",
                isEmergency = true
            ))
        }

        return triggered.distinctBy { it.id }
    }
}
