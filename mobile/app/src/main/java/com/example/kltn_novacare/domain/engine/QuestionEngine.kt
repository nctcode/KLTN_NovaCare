package com.example.kltn_novacare.domain.engine

import com.example.kltn_novacare.data.model.BodyRegionCode
import com.example.kltn_novacare.data.model.RegionGroup

data class Question(
    val id: String,
    val text: String,
    val type: QuestionType,
    val options: List<String> = emptyList(),
    val domain: QuestionDomain,
    val priority: Int = 1,
    val isRequired: Boolean = true
)

enum class QuestionType {
    SINGLE_CHOICE,
    MULTI_CHOICE,
    SLIDER,
    TEXT
}

enum class QuestionDomain {
    GENERAL,
    MUSCULOSKELETAL,
    RESPIRATORY,
    CARDIOVASCULAR,
    NEUROLOGY,
    DERMATOLOGY,
    GASTROINTESTINAL,
    ENT,
    OPHTHALMOLOGY
}

object QuestionEngine {

    // ── 1. GENERAL QUESTIONS ──────────────────────────────────
    val GENERAL_PRIMARY_SYMPTOM = Question(
        id = "Q_GEN_PRIMARY",
        text = "Triệu chứng chính bạn đang gặp phải là gì?",
        type = QuestionType.MULTI_CHOICE,
        options = listOf("Đau", "Sưng", "Tê / Mất cảm giác", "Nóng / Rát", "Yếu cơ", "Khó vận động", "Chảy máu", "Khó thở", "Ho", "Khác"),
        domain = QuestionDomain.GENERAL,
        priority = 10
    )

    val GENERAL_DURATION = Question(
        id = "Q_GEN_DURATION",
        text = "Triệu chứng xuất hiện bao lâu rồi?",
        type = QuestionType.SINGLE_CHOICE,
        options = listOf("Hôm nay (< 24 giờ)", "2–3 ngày", "4–7 ngày", "1–4 tuần", "1–6 tháng", "Trên 6 tháng"),
        domain = QuestionDomain.GENERAL,
        priority = 9
    )

    val GENERAL_PAIN_LEVEL = Question(
        id = "Q_GEN_PAIN",
        text = "Mức độ đau hoặc khó chịu (từ 0 đến 10)?",
        type = QuestionType.SLIDER,
        domain = QuestionDomain.GENERAL,
        priority = 8
    )

    val GENERAL_PROGRESSION = Question(
        id = "Q_GEN_PROGRESSION",
        text = "Diễn tiến triệu chứng như thế nào?",
        type = QuestionType.SINGLE_CHOICE,
        options = listOf("Đang giảm dần", "Không thay đổi", "Tăng dần từ từ", "Tăng nhanh đột ngột"),
        domain = QuestionDomain.GENERAL,
        priority = 7
    )

    val GENERAL_IMPACT = Question(
        id = "Q_GEN_IMPACT",
        text = "Mức độ ảnh hưởng đến sinh hoạt hàng ngày?",
        type = QuestionType.SINGLE_CHOICE,
        options = listOf("Không ảnh hưởng", "Ảnh hưởng nhẹ", "Ảnh hưởng trung bình", "Nhiều", "Không thể sinh hoạt bình thường"),
        domain = QuestionDomain.GENERAL,
        priority = 6
    )

    // ── 2. MUSCULOSKELETAL QUESTION BANK ─────────────────────
    val MSK_QUESTIONS = listOf(
        Question("Q_MSK_TRAUMA", "Có chấn thương hoặc va đập trước đó không?", QuestionType.SINGLE_CHOICE, listOf("Không", "Có chấn thương nhẹ", "Có chấn thương mạnh / ngã"), QuestionDomain.MUSCULOSKELETAL),
        Question("Q_MSK_MOVEMENT_PAIN", "Đau xuất hiện khi nào?", QuestionType.SINGLE_CHOICE, listOf("Chỉ khi vận động", "Cả khi nghỉ ngơi", "Đau liên tục cả ngày đêm"), QuestionDomain.MUSCULOSKELETAL),
        Question("Q_MSK_RADIATION", "Cơn đau có lan sang vị trí khác không?", QuestionType.SINGLE_CHOICE, listOf("Không lan", "Lan xuống cánh tay / cẳng tay", "Lan xuống đùi / chân", "Lan lên cổ / đầu"), QuestionDomain.MUSCULOSKELETAL),
        Question("Q_MSK_DEFORMITY", "Vùng tổn thương có bị sưng, bầm hoặc biến dạng không?", QuestionType.MULTI_CHOICE, listOf("Sưng đỏ", "Bầm tím", "Có tiếng kêu rắc khi cử động", "Biến dạng / lệch khớp"), QuestionDomain.MUSCULOSKELETAL)
    )

    // ── 3. RESPIRATORY QUESTION BANK ──────────────────────────
    val RESP_QUESTIONS = listOf(
        Question("Q_RESP_DYSPNEA", "Mức độ khó thở như thế nào?", QuestionType.SINGLE_CHOICE, listOf("Không khó thở", "Khó thở khi vận động mạnh", "Khó thở ngay cả khi nghỉ ngơi", "Khó thở dữ dội, không thể nói thành câu"), QuestionDomain.RESPIRATORY),
        Question("Q_RESP_COUGH", "Tính chất cơn ho như thế nào?", QuestionType.SINGLE_CHOICE, listOf("Không ho", "Ho khan", "Ho có đờm trong", "Ho đờm vàng / xanh", "Ho ra máu"), QuestionDomain.RESPIRATORY),
        Question("Q_RESP_FEVER", "Có sốt kèm theo không?", QuestionType.SINGLE_CHOICE, listOf("Không sốt", "Sốt nhẹ (< 38°C)", "Sốt cao liên tục (>= 38.5°C)"), QuestionDomain.RESPIRATORY)
    )

    // ── 4. CARDIOVASCULAR QUESTION BANK ───────────────────────
    val CARDIO_QUESTIONS = listOf(
        Question("Q_CARD_PAIN_TYPE", "Tính chất cơn đau ngực như thế nào?", QuestionType.SINGLE_CHOICE, listOf("Đau nhói khi hít sâu", "Đau đè ép / bóp nghẹt sau xương ức", "Đau âm ỉ kéo dài", "Không đau ngực"), QuestionDomain.CARDIOVASCULAR),
        Question("Q_CARD_RADIATION", "Đau ngực có lan đi đâu không?", QuestionType.MULTI_CHOICE, listOf("Lan ra vai / tay trái", "Lan lên hàm / cổ", "Lan sau lưng", "Không lan"), QuestionDomain.CARDIOVASCULAR),
        Question("Q_CARD_ASSOCIATED", "Các triệu chứng đi kèm khác?", QuestionType.MULTI_CHOICE, listOf("Vã mồ hôi lạnh", "Chóng mặt / Choáng váng", "Vật vã / Lo âu", "Ngất xỉu"), QuestionDomain.CARDIOVASCULAR)
    )

    // ── 5. NEUROLOGY QUESTION BANK ────────────────────────────
    val NEURO_QUESTIONS = listOf(
        Question("Q_NEURO_ONSET", "Khởi phát triệu chứng thần kinh thế nào?", QuestionType.SINGLE_CHOICE, listOf("Từ từ trong nhiều ngày", "Đột ngột trong vài phút / vài giờ"), QuestionDomain.NEUROLOGY),
        Question("Q_NEURO_DEFICIT", "Có dấu hiệu yếu / tê bất thường không?", QuestionType.MULTI_CHOICE, listOf("Yếu / liệt một bên tay hoặc chân", "Tê bì mặt / méo miệng", "Nói ngọng / khó nói", "Nhìn đôi / mờ mắt đột ngột", "Không có"), QuestionDomain.NEUROLOGY)
    )

    // ── 6. DERMATOLOGY QUESTION BANK ──────────────────────────
    val DERM_QUESTIONS = listOf(
        Question("Q_DERM_FEATURES", "Đặc điểm tổn thương da?", QuestionType.MULTI_CHOICE, listOf("Phát ban đỏ", "Có mụn nước / mủ", "Ngứa nhiều", "Bong tróc da", "Chảy dịch / lở loét", "Biến đổi màu sắc / kích thước nốt ruồi"), QuestionDomain.DERMATOLOGY)
    )

    // ── 7. GASTROINTESTINAL QUESTION BANK ─────────────────────
    val GI_QUESTIONS = listOf(
        Question("Q_GI_SYMPTOMS", "Triệu chứng tiêu hóa kèm theo?", QuestionType.MULTI_CHOICE, listOf("Buồn nôn / Nôn", "Nôn ra máu / chất đen", "Tiêu chảy nhiều lần", "Đi ngoài phân đen / có máu", "Đau quặn bụng từng cơn"), QuestionDomain.GASTROINTESTINAL)
    )

    /**
     * Dynamically selects the adaptive list of questions based on selected body regions.
     */
    fun selectAdaptiveQuestions(regions: Set<BodyRegionCode>, primarySymptoms: Set<String> = emptySet()): List<Question> {
        val questions = mutableListOf<Question>()

        // 1. General core questions
        questions.add(GENERAL_PRIMARY_SYMPTOM)
        questions.add(GENERAL_DURATION)
        questions.add(GENERAL_PAIN_LEVEL)
        questions.add(GENERAL_PROGRESSION)
        questions.add(GENERAL_IMPACT)

        // Determine relevant domains from body regions
        val domains = mutableSetOf<QuestionDomain>()

        regions.forEach { reg ->
            when (reg.group) {
                RegionGroup.LEFT_ARM, RegionGroup.RIGHT_ARM,
                RegionGroup.LEFT_LEG, RegionGroup.RIGHT_LEG -> domains.add(QuestionDomain.MUSCULOSKELETAL)
                RegionGroup.TRUNK -> {
                    when (reg) {
                        BodyRegionCode.CHEST -> {
                            domains.add(QuestionDomain.CARDIOVASCULAR)
                            domains.add(QuestionDomain.RESPIRATORY)
                        }
                        BodyRegionCode.ABDOMEN, BodyRegionCode.LOWER_ABDOMEN -> domains.add(QuestionDomain.GASTROINTESTINAL)
                        BodyRegionCode.BACK, BodyRegionCode.LOWER_BACK,
                        BodyRegionCode.LEFT_SHOULDER, BodyRegionCode.RIGHT_SHOULDER -> domains.add(QuestionDomain.MUSCULOSKELETAL)
                        else -> domains.add(QuestionDomain.MUSCULOSKELETAL)
                    }
                }
                RegionGroup.HEAD_NECK -> {
                    when (reg) {
                        BodyRegionCode.HEAD -> domains.add(QuestionDomain.NEUROLOGY)
                        BodyRegionCode.FACE -> {
                            domains.add(QuestionDomain.ENT)
                            domains.add(QuestionDomain.OPHTHALMOLOGY)
                        }
                        BodyRegionCode.NECK, BodyRegionCode.NAPE -> {
                            domains.add(QuestionDomain.ENT)
                            domains.add(QuestionDomain.MUSCULOSKELETAL)
                        }
                        else -> domains.add(QuestionDomain.MUSCULOSKELETAL)
                    }
                }
            }
        }

        // Add domain specific questions
        if (domains.contains(QuestionDomain.MUSCULOSKELETAL)) questions.addAll(MSK_QUESTIONS)
        if (domains.contains(QuestionDomain.RESPIRATORY)) questions.addAll(RESP_QUESTIONS)
        if (domains.contains(QuestionDomain.CARDIOVASCULAR)) questions.addAll(CARDIO_QUESTIONS)
        if (domains.contains(QuestionDomain.NEUROLOGY)) questions.addAll(NEURO_QUESTIONS)
        if (domains.contains(QuestionDomain.DERMATOLOGY)) questions.addAll(DERM_QUESTIONS)
        if (domains.contains(QuestionDomain.GASTROINTESTINAL)) questions.addAll(GI_QUESTIONS)

        return questions.sortedByDescending { it.priority }
    }
}
