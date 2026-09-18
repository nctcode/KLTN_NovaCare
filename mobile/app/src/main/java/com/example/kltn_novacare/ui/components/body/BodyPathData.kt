package com.example.kltn_novacare.ui.components.body

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import com.example.kltn_novacare.data.model.BodyRegionCode

/**
 * Defines tappable hit zones for each body region as an ellipse/rect in
 * NORMALISED coordinates [0..1, 0..1] relative to the canvas width/height.
 *
 * The coordinate system follows the visual layout:
 *   - origin (0,0) = top-left of the body canvas
 *   - (1,1)        = bottom-right
 *
 * Each HitZone is an axis-aligned ellipse defined by center + radii.
 * hit-testing: (dx/rx)^2 + (dy/ry)^2 <= 1
 */
data class HitZone(
    val region: BodyRegionCode,
    val cx: Float,   // normalized center X
    val cy: Float,   // normalized center Y
    val rx: Float,   // normalized half-width
    val ry: Float    // normalized half-height
) {
    fun contains(nx: Float, ny: Float): Boolean {
        val dx = (nx - cx) / rx
        val dy = (ny - cy) / ry
        return dx * dx + dy * dy <= 1f
    }

    /** Convert to pixel rect for drawing glow overlay */
    fun toRect(canvasW: Float, canvasH: Float): Rect = Rect(
        left   = (cx - rx) * canvasW,
        top    = (cy - ry) * canvasH,
        right  = (cx + rx) * canvasW,
        bottom = (cy + ry) * canvasH
    )

    fun centerPx(canvasW: Float, canvasH: Float) =
        Offset(cx * canvasW, cy * canvasH)
}

object BodyPathData {

    // ──────────────────────────────────────────────────────────
    // FRONT VIEW hit zones
    // Body silhouette occupies roughly x∈[0.25, 0.75], y∈[0.03, 0.97]
    // ──────────────────────────────────────────────────────────
    val frontZones: List<HitZone> = listOf(
        // HEAD
        HitZone(BodyRegionCode.HEAD,            cx=0.50f, cy=0.065f, rx=0.10f, ry=0.055f),
        HitZone(BodyRegionCode.FACE,            cx=0.50f, cy=0.100f, rx=0.08f, ry=0.040f),
        // NECK
        HitZone(BodyRegionCode.NECK,            cx=0.50f, cy=0.145f, rx=0.055f,ry=0.030f),
        // SHOULDERS
        HitZone(BodyRegionCode.LEFT_SHOULDER,   cx=0.29f, cy=0.190f, rx=0.075f,ry=0.040f),
        HitZone(BodyRegionCode.RIGHT_SHOULDER,  cx=0.71f, cy=0.190f, rx=0.075f,ry=0.040f),
        // CHEST
        HitZone(BodyRegionCode.CHEST,           cx=0.50f, cy=0.230f, rx=0.125f,ry=0.055f),
        // ABDOMEN
        HitZone(BodyRegionCode.ABDOMEN,         cx=0.50f, cy=0.305f, rx=0.115f,ry=0.050f),
        HitZone(BodyRegionCode.LOWER_ABDOMEN,   cx=0.50f, cy=0.370f, rx=0.110f,ry=0.045f),
        // PELVIS (hips) — only visible front
        HitZone(BodyRegionCode.PELVIS,          cx=0.50f, cy=0.425f, rx=0.130f,ry=0.040f),
        // LEFT ARM
        HitZone(BodyRegionCode.LEFT_UPPER_ARM,  cx=0.19f, cy=0.255f, rx=0.060f,ry=0.060f),
        HitZone(BodyRegionCode.LEFT_ELBOW,      cx=0.17f, cy=0.330f, rx=0.045f,ry=0.030f),
        HitZone(BodyRegionCode.LEFT_FOREARM,    cx=0.155f,cy=0.390f, rx=0.045f,ry=0.050f),
        HitZone(BodyRegionCode.LEFT_WRIST,      cx=0.145f,cy=0.445f, rx=0.035f,ry=0.022f),
        HitZone(BodyRegionCode.LEFT_HAND,       cx=0.140f,cy=0.490f, rx=0.045f,ry=0.035f),
        // RIGHT ARM
        HitZone(BodyRegionCode.RIGHT_UPPER_ARM, cx=0.81f, cy=0.255f, rx=0.060f,ry=0.060f),
        HitZone(BodyRegionCode.RIGHT_ELBOW,     cx=0.83f, cy=0.330f, rx=0.045f,ry=0.030f),
        HitZone(BodyRegionCode.RIGHT_FOREARM,   cx=0.845f,cy=0.390f, rx=0.045f,ry=0.050f),
        HitZone(BodyRegionCode.RIGHT_WRIST,     cx=0.855f,cy=0.445f, rx=0.035f,ry=0.022f),
        HitZone(BodyRegionCode.RIGHT_HAND,      cx=0.860f,cy=0.490f, rx=0.045f,ry=0.035f),
        // LEFT LEG
        HitZone(BodyRegionCode.LEFT_THIGH,      cx=0.415f,cy=0.545f, rx=0.075f,ry=0.068f),
        HitZone(BodyRegionCode.LEFT_KNEE,       cx=0.415f,cy=0.630f, rx=0.055f,ry=0.030f),
        HitZone(BodyRegionCode.LEFT_LOWER_LEG,  cx=0.415f,cy=0.705f, rx=0.052f,ry=0.058f),
        HitZone(BodyRegionCode.LEFT_ANKLE,      cx=0.415f,cy=0.780f, rx=0.040f,ry=0.022f),
        HitZone(BodyRegionCode.LEFT_FOOT,       cx=0.400f,cy=0.820f, rx=0.065f,ry=0.025f),
        // RIGHT LEG
        HitZone(BodyRegionCode.RIGHT_THIGH,     cx=0.585f,cy=0.545f, rx=0.075f,ry=0.068f),
        HitZone(BodyRegionCode.RIGHT_KNEE,      cx=0.585f,cy=0.630f, rx=0.055f,ry=0.030f),
        HitZone(BodyRegionCode.RIGHT_LOWER_LEG, cx=0.585f,cy=0.705f, rx=0.052f,ry=0.058f),
        HitZone(BodyRegionCode.RIGHT_ANKLE,     cx=0.585f,cy=0.780f, rx=0.040f,ry=0.022f),
        HitZone(BodyRegionCode.RIGHT_FOOT,      cx=0.600f,cy=0.820f, rx=0.065f,ry=0.025f),
    )

    // ──────────────────────────────────────────────────────────
    // BACK VIEW hit zones  (mirror L/R semantics)
    // ──────────────────────────────────────────────────────────
    val backZones: List<HitZone> = listOf(
        HitZone(BodyRegionCode.HEAD,            cx=0.50f, cy=0.065f, rx=0.10f, ry=0.055f),
        HitZone(BodyRegionCode.NAPE,            cx=0.50f, cy=0.145f, rx=0.055f,ry=0.030f),
        HitZone(BodyRegionCode.LEFT_SHOULDER,   cx=0.29f, cy=0.190f, rx=0.075f,ry=0.040f),
        HitZone(BodyRegionCode.RIGHT_SHOULDER,  cx=0.71f, cy=0.190f, rx=0.075f,ry=0.040f),
        HitZone(BodyRegionCode.BACK,            cx=0.50f, cy=0.245f, rx=0.125f,ry=0.060f),
        HitZone(BodyRegionCode.LOWER_BACK,      cx=0.50f, cy=0.345f, rx=0.115f,ry=0.060f),
        HitZone(BodyRegionCode.PELVIS,          cx=0.50f, cy=0.425f, rx=0.130f,ry=0.040f),
        // LEFT ARM (back)
        HitZone(BodyRegionCode.LEFT_UPPER_ARM,  cx=0.19f, cy=0.255f, rx=0.060f,ry=0.060f),
        HitZone(BodyRegionCode.LEFT_ELBOW,      cx=0.17f, cy=0.330f, rx=0.045f,ry=0.030f),
        HitZone(BodyRegionCode.LEFT_FOREARM,    cx=0.155f,cy=0.390f, rx=0.045f,ry=0.050f),
        HitZone(BodyRegionCode.LEFT_WRIST,      cx=0.145f,cy=0.445f, rx=0.035f,ry=0.022f),
        HitZone(BodyRegionCode.LEFT_HAND,       cx=0.140f,cy=0.490f, rx=0.045f,ry=0.035f),
        // RIGHT ARM (back)
        HitZone(BodyRegionCode.RIGHT_UPPER_ARM, cx=0.81f, cy=0.255f, rx=0.060f,ry=0.060f),
        HitZone(BodyRegionCode.RIGHT_ELBOW,     cx=0.83f, cy=0.330f, rx=0.045f,ry=0.030f),
        HitZone(BodyRegionCode.RIGHT_FOREARM,   cx=0.845f,cy=0.390f, rx=0.045f,ry=0.050f),
        HitZone(BodyRegionCode.RIGHT_WRIST,     cx=0.855f,cy=0.445f, rx=0.035f,ry=0.022f),
        HitZone(BodyRegionCode.RIGHT_HAND,      cx=0.860f,cy=0.490f, rx=0.045f,ry=0.035f),
        // LEFT LEG (back)
        HitZone(BodyRegionCode.LEFT_THIGH,      cx=0.415f,cy=0.545f, rx=0.075f,ry=0.068f),
        HitZone(BodyRegionCode.LEFT_KNEE,       cx=0.415f,cy=0.630f, rx=0.055f,ry=0.030f),
        HitZone(BodyRegionCode.LEFT_LOWER_LEG,  cx=0.415f,cy=0.705f, rx=0.052f,ry=0.058f),
        HitZone(BodyRegionCode.LEFT_ANKLE,      cx=0.415f,cy=0.780f, rx=0.040f,ry=0.022f),
        HitZone(BodyRegionCode.LEFT_FOOT,       cx=0.400f,cy=0.820f, rx=0.065f,ry=0.025f),
        // RIGHT LEG (back)
        HitZone(BodyRegionCode.RIGHT_THIGH,     cx=0.585f,cy=0.545f, rx=0.075f,ry=0.068f),
        HitZone(BodyRegionCode.RIGHT_KNEE,      cx=0.585f,cy=0.630f, rx=0.055f,ry=0.030f),
        HitZone(BodyRegionCode.RIGHT_LOWER_LEG, cx=0.585f,cy=0.705f, rx=0.052f,ry=0.058f),
        HitZone(BodyRegionCode.RIGHT_ANKLE,     cx=0.585f,cy=0.780f, rx=0.040f,ry=0.022f),
        HitZone(BodyRegionCode.RIGHT_FOOT,      cx=0.600f,cy=0.820f, rx=0.065f,ry=0.025f),
    )

    fun zonesFor(isFront: Boolean) = if (isFront) frontZones else backZones

    /** Find which region the user tapped (normalised coords). Returns first match. */
    fun hitTest(nx: Float, ny: Float, isFront: Boolean): BodyRegionCode? =
        zonesFor(isFront).firstOrNull { it.contains(nx, ny) }?.region
}
