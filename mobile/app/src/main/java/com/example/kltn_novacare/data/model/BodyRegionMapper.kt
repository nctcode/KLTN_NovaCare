package com.example.kltn_novacare.data.model

import android.util.Log

object BodyRegionMapper {

    val HEAD = BodyRegion(
        id = "head",
        name = "Đầu / Trán / Thái dương",
        displayName = "Đầu / Trán",
        side = "center",
        category = "head",
        modelEntityNames = listOf("head", "cranium", "skull", "face", "forehead", "head_mesh")
    )

    val EYES_NOSE = BodyRegion(
        id = "eyes_nose",
        name = "Mắt / Mũi / Tai",
        displayName = "Mắt / Mũi",
        side = "center",
        category = "head",
        modelEntityNames = listOf("eyes", "nose", "ears", "facial_organs")
    )

    val NECK = BodyRegion(
        id = "neck",
        name = "Cổ / Vùng Họng",
        displayName = "Cổ / Vùng Họng",
        side = "center",
        category = "neck",
        modelEntityNames = listOf("neck", "throat", "cervical", "neck_mesh")
    )

    val NAPE = BodyRegion(
        id = "nape",
        name = "Gáy / Cổ Sau",
        displayName = "Gáy / Cổ Sau",
        side = "center",
        category = "neck",
        modelEntityNames = listOf("nape", "posterior_neck", "nape_mesh")
    )

    val CHEST = BodyRegion(
        id = "chest",
        name = "Vùng Ngực / Tim",
        displayName = "Vùng Ngực / Tim",
        side = "center",
        category = "chest",
        modelEntityNames = listOf("chest", "pectoral", "breast", "thorax", "sternum", "chest_mesh")
    )

    val ABDOMEN_UPPER = BodyRegion(
        id = "abdomen_upper",
        name = "Bụng Trên / Thượng Vị",
        displayName = "Bụng Trên",
        side = "center",
        category = "abdomen",
        modelEntityNames = listOf("abdomen", "upper_abdomen", "epigastrium", "stomach_area", "abs_upper")
    )

    val ABDOMEN_LOWER = BodyRegion(
        id = "abdomen_lower",
        name = "Bụng Dưới / Hố Chậu",
        displayName = "Bụng Dưới",
        side = "center",
        category = "abdomen",
        modelEntityNames = listOf("lower_abdomen", "pelvis", "groin", "abs_lower", "hypogastrium")
    )

    val SHOULDER_RIGHT = BodyRegion(
        id = "right_shoulder",
        name = "Vai Phải",
        displayName = "Vai phải",
        side = "right",
        category = "shoulder",
        modelEntityNames = listOf("right_shoulder", "shoulder_r", "deltoid_r", "shoulder_right")
    )

    val SHOULDER_LEFT = BodyRegion(
        id = "left_shoulder",
        name = "Vai Trái",
        displayName = "Vai trái",
        side = "left",
        category = "shoulder",
        modelEntityNames = listOf("left_shoulder", "shoulder_l", "deltoid_l", "shoulder_left")
    )

    val ARM_RIGHT = BodyRegion(
        id = "right_arm",
        name = "Cánh Tay Phải",
        displayName = "Cánh tay phải",
        side = "right",
        category = "arm",
        modelEntityNames = listOf("right_arm", "arm_r", "biceps_r", "forearm_r", "right_biceps")
    )

    val ARM_LEFT = BodyRegion(
        id = "left_arm",
        name = "Cánh Tay Trái",
        displayName = "Cánh tay trái",
        side = "left",
        category = "arm",
        modelEntityNames = listOf("left_arm", "arm_l", "biceps_l", "forearm_l", "left_biceps")
    )

    val HAND_RIGHT = BodyRegion(
        id = "right_hand",
        name = "Bàn Tay Phải",
        displayName = "Bàn tay phải",
        side = "right",
        category = "arm",
        modelEntityNames = listOf("right_hand", "hand_r", "wrist_r", "fingers_r")
    )

    val HAND_LEFT = BodyRegion(
        id = "left_hand",
        name = "Bàn Tay Trái",
        displayName = "Bàn tay trái",
        side = "left",
        category = "arm",
        modelEntityNames = listOf("left_hand", "hand_l", "wrist_l", "fingers_l")
    )

    val BACK_UPPER = BodyRegion(
        id = "upper_back",
        name = "Lưng Trên / Vai Sau",
        displayName = "Lưng trên",
        side = "center",
        category = "back",
        modelEntityNames = listOf("upper_back", "scapula", "trapezius", "back_upper")
    )

    val BACK_LOWER = BodyRegion(
        id = "lower_back",
        name = "Thắt Lưng / Cột Sống",
        displayName = "Thắt lưng",
        side = "center",
        category = "back",
        modelEntityNames = listOf("lower_back", "lumbar", "spine", "back_lower", "waist")
    )

    val GLUTES = BodyRegion(
        id = "glutes",
        name = "Vùng Mông / Hông",
        displayName = "Vùng Mông / Hông",
        side = "center",
        category = "back",
        modelEntityNames = listOf("glutes", "gluteus", "hips", "buttocks", "pelvis_back")
    )

    val THIGH_RIGHT = BodyRegion(
        id = "right_thigh",
        name = "Đùi Phải",
        displayName = "Đùi phải",
        side = "right",
        category = "leg",
        modelEntityNames = listOf("right_thigh", "thigh_r", "quadriceps_r", "femur_r")
    )

    val THIGH_LEFT = BodyRegion(
        id = "left_thigh",
        name = "Đùi Trái",
        displayName = "Đùi trái",
        side = "left",
        category = "leg",
        modelEntityNames = listOf("left_thigh", "thigh_l", "quadriceps_l", "femur_l")
    )

    val KNEE_RIGHT = BodyRegion(
        id = "right_knee",
        name = "Đầu Gối Phải",
        displayName = "Đầu gối phải",
        side = "right",
        category = "leg",
        modelEntityNames = listOf("right_knee", "knee_r", "patella_r")
    )

    val KNEE_LEFT = BodyRegion(
        id = "left_knee",
        name = "Đầu Gối Trái",
        displayName = "Đầu gối trái",
        side = "left",
        category = "leg",
        modelEntityNames = listOf("left_knee", "knee_l", "patella_l")
    )

    val CALF_RIGHT = BodyRegion(
        id = "right_calf",
        name = "Bắp Chân Phải",
        displayName = "Bắp chân phải",
        side = "right",
        category = "leg",
        modelEntityNames = listOf("right_calf", "calf_r", "gastrocnemius_r", "shin_r")
    )

    val CALF_LEFT = BodyRegion(
        id = "left_calf",
        name = "Bắp Chân Trái",
        displayName = "Bắp chân trái",
        side = "left",
        category = "leg",
        modelEntityNames = listOf("left_calf", "calf_l", "gastrocnemius_l", "shin_l")
    )

    val FOOT_RIGHT = BodyRegion(
        id = "right_foot",
        name = "Bàn Chân Phải",
        displayName = "Bàn chân phải",
        side = "right",
        category = "leg",
        modelEntityNames = listOf("right_foot", "foot_r", "ankle_r", "toes_r")
    )

    val FOOT_LEFT = BodyRegion(
        id = "left_foot",
        name = "Bàn Chân Trái",
        displayName = "Bàn chân trái",
        side = "left",
        category = "leg",
        modelEntityNames = listOf("left_foot", "foot_l", "ankle_l", "toes_l")
    )

    val allRegions = listOf(
        HEAD, EYES_NOSE, NECK, NAPE, CHEST, ABDOMEN_UPPER, ABDOMEN_LOWER,
        SHOULDER_RIGHT, SHOULDER_LEFT, ARM_RIGHT, ARM_LEFT, HAND_RIGHT, HAND_LEFT,
        BACK_UPPER, BACK_LOWER, GLUTES, THIGH_RIGHT, THIGH_LEFT, KNEE_RIGHT, KNEE_LEFT,
        CALF_RIGHT, CALF_LEFT, FOOT_RIGHT, FOOT_LEFT
    )

    fun findRegionByEntityName(entityName: String): BodyRegion? {
        val cleanName = entityName.lowercase().trim()
        val found = allRegions.firstOrNull { region ->
            region.id.equals(cleanName, ignoreCase = true) ||
            region.modelEntityNames.any { cleanName.contains(it.lowercase()) }
        }
        Log.d("Body3DMapper", "Tapped entity: '$entityName' -> Mapped to: '${found?.displayName ?: "None"}'")
        return found
    }

    fun findRegionById(id: String): BodyRegion? {
        return allRegions.firstOrNull { it.id.equals(id, ignoreCase = true) }
    }
}
