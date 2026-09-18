package com.example.kltn_novacare.data.model

import java.util.Date

// ─────────────────────────────────────────────────────────────
// 1. ENUM – canonical list of body regions
// ─────────────────────────────────────────────────────────────
enum class BodyRegionCode(
    val code: String,
    val displayName: String,
    val side: String,       // CENTER | LEFT | RIGHT
    val group: RegionGroup
) {
    HEAD        ("HEAD",             "Đầu / Trán",          "CENTER", RegionGroup.HEAD_NECK),
    FACE        ("FACE",             "Mặt / Mắt / Mũi",     "CENTER", RegionGroup.HEAD_NECK),
    NECK        ("NECK",             "Cổ / Vùng Họng",      "CENTER", RegionGroup.HEAD_NECK),
    NAPE        ("NAPE",             "Gáy / Cổ Sau",        "CENTER", RegionGroup.HEAD_NECK),

    LEFT_SHOULDER  ("LEFT_SHOULDER", "Vai trái",            "LEFT",   RegionGroup.TRUNK),
    RIGHT_SHOULDER ("RIGHT_SHOULDER","Vai phải",            "RIGHT",  RegionGroup.TRUNK),
    CHEST          ("CHEST",         "Ngực",                "CENTER", RegionGroup.TRUNK),
    ABDOMEN        ("ABDOMEN",       "Bụng Trên",           "CENTER", RegionGroup.TRUNK),
    LOWER_ABDOMEN  ("LOWER_ABDOMEN", "Bụng Dưới",           "CENTER", RegionGroup.TRUNK),
    PELVIS         ("PELVIS",        "Vùng Mông / Hông",    "CENTER", RegionGroup.TRUNK),
    BACK           ("BACK",          "Lưng Trên",           "CENTER", RegionGroup.TRUNK),
    LOWER_BACK     ("LOWER_BACK",    "Thắt Lưng",           "CENTER", RegionGroup.TRUNK),

    LEFT_UPPER_ARM ("LEFT_UPPER_ARM","Cánh tay trái",       "LEFT",   RegionGroup.LEFT_ARM),
    LEFT_ELBOW     ("LEFT_ELBOW",    "Khuỷu tay trái",      "LEFT",   RegionGroup.LEFT_ARM),
    LEFT_FOREARM   ("LEFT_FOREARM",  "Cẳng tay trái",       "LEFT",   RegionGroup.LEFT_ARM),
    LEFT_WRIST     ("LEFT_WRIST",    "Cổ tay trái",         "LEFT",   RegionGroup.LEFT_ARM),
    LEFT_HAND      ("LEFT_HAND",     "Bàn tay trái",        "LEFT",   RegionGroup.LEFT_ARM),

    RIGHT_UPPER_ARM("RIGHT_UPPER_ARM","Cánh tay phải",      "RIGHT",  RegionGroup.RIGHT_ARM),
    RIGHT_ELBOW    ("RIGHT_ELBOW",   "Khuỷu tay phải",      "RIGHT",  RegionGroup.RIGHT_ARM),
    RIGHT_FOREARM  ("RIGHT_FOREARM", "Cẳng tay phải",       "RIGHT",  RegionGroup.RIGHT_ARM),
    RIGHT_WRIST    ("RIGHT_WRIST",   "Cổ tay phải",         "RIGHT",  RegionGroup.RIGHT_ARM),
    RIGHT_HAND     ("RIGHT_HAND",    "Bàn tay phải",        "RIGHT",  RegionGroup.RIGHT_ARM),

    LEFT_THIGH     ("LEFT_THIGH",    "Đùi trái",            "LEFT",   RegionGroup.LEFT_LEG),
    LEFT_KNEE      ("LEFT_KNEE",     "Đầu gối trái",        "LEFT",   RegionGroup.LEFT_LEG),
    LEFT_LOWER_LEG ("LEFT_LOWER_LEG","Bắp chân trái",       "LEFT",   RegionGroup.LEFT_LEG),
    LEFT_ANKLE     ("LEFT_ANKLE",    "Mắt cá trái",         "LEFT",   RegionGroup.LEFT_LEG),
    LEFT_FOOT      ("LEFT_FOOT",     "Bàn chân trái",       "LEFT",   RegionGroup.LEFT_LEG),

    RIGHT_THIGH    ("RIGHT_THIGH",   "Đùi phải",            "RIGHT",  RegionGroup.RIGHT_LEG),
    RIGHT_KNEE     ("RIGHT_KNEE",    "Đầu gối phải",        "RIGHT",  RegionGroup.RIGHT_LEG),
    RIGHT_LOWER_LEG("RIGHT_LOWER_LEG","Bắp chân phải",      "RIGHT",  RegionGroup.RIGHT_LEG),
    RIGHT_ANKLE    ("RIGHT_ANKLE",   "Mắt cá phải",         "RIGHT",  RegionGroup.RIGHT_LEG),
    RIGHT_FOOT     ("RIGHT_FOOT",    "Bàn chân phải",       "RIGHT",  RegionGroup.RIGHT_LEG);

    companion object {
        fun fromCode(code: String): BodyRegionCode? =
            entries.firstOrNull { it.code.equals(code, ignoreCase = true) }

        /** Map old BodyRegion (data class) to new enum for backward compat */
        fun fromBodyRegion(region: BodyRegion): BodyRegionCode? =
            entries.firstOrNull {
                it.code.equals(region.id, ignoreCase = true) ||
                it.displayName.equals(region.displayName, ignoreCase = true)
            }
    }
}

enum class RegionGroup(val label: String) {
    HEAD_NECK ("Đầu & Cổ"),
    TRUNK     ("Thân Mình"),
    LEFT_ARM  ("Tay Trái"),
    RIGHT_ARM ("Tay Phải"),
    LEFT_LEG  ("Chân Trái"),
    RIGHT_LEG ("Chân Phải")
}

// ─────────────────────────────────────────────────────────────
// 2. SELECTION MODEL
// ─────────────────────────────────────────────────────────────
data class BodyRegionSelection(
    val region: BodyRegionCode,
    val selectedAt: Date = Date()
) {
    val displayName: String get() = region.displayName
    val side: String get() = region.side
}

// ─────────────────────────────────────────────────────────────
// 3. API OUTPUT MODELS
// ─────────────────────────────────────────────────────────────
data class ScreeningBodyLocation(
    val code: String,
    val name: String,
    val side: String
) {
    companion object {
        fun from(sel: BodyRegionSelection) = ScreeningBodyLocation(
            code = sel.region.code,
            name = sel.region.displayName,
            side = sel.region.side
        )
    }
}

data class ScreeningStep1Result(
    val step: Int = 1,
    val selectedRegions: List<ScreeningBodyLocation>
) {
    val isEmpty: Boolean get() = selectedRegions.isEmpty()

    companion object {
        fun from(selections: Set<BodyRegionCode>): ScreeningStep1Result =
            ScreeningStep1Result(
                selectedRegions = selections.map {
                    ScreeningBodyLocation(code = it.code, name = it.displayName, side = it.side)
                }
            )
    }
}
