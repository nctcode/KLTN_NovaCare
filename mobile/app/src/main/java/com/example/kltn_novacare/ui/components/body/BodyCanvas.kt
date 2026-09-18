package com.example.kltn_novacare.ui.components.body

import android.util.Log
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.*
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.kltn_novacare.data.model.BodyRegionCode
import kotlin.math.*

private val ColorSkin        = Color(0xFFF0C8A0)
private val ColorSkinDark    = Color(0xFFD4A574)
private val ColorSkinShadow  = Color(0xFFB8865C)
private val ColorSelected    = Color(0xFF22C55E)
private val ColorGlow        = Color(0xFF4ADE80)
private val ColorHint        = Color(0xFF64748B)
private val ColorBg          = Color(0xFFF8FAFC)
private val ColorOutline     = Color(0xFF0C4B39)

/**
 * Interactive anatomical body canvas.
 *
 * - Draws a stylised human body silhouette using Compose Canvas paths.
 * - Each anatomical region maps to an elliptical HitZone (see BodyPathData).
 * - Tap → hit-test → toggle selection → glow highlight.
 * - Pinch → zoom [0.8 .. 2.5].
 * - isFrontView switch → smoothly crossfades front/back silhouette.
 * - selectedRegions state is owned externally (hoisted).
 */
@Composable
fun BodyCanvas(
    selectedRegions: Set<BodyRegionCode>,
    isFrontView: Boolean,
    onRegionToggled: (BodyRegionCode) -> Unit,
    modifier: Modifier = Modifier,
    canvasHeight: Dp = 360.dp
) {
    // Zoom state
    var scale by remember { mutableFloatStateOf(1f) }

    // Pulse animation for selected glow
    val pulseAnim = rememberInfiniteTransition(label = "pulse")
    val pulseAlpha by pulseAnim.animateFloat(
        initialValue = 0.3f, targetValue = 0.65f, label = "alpha",
        animationSpec = infiniteRepeatable(
            animation = tween(900, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        )
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(canvasHeight)
            .clip(RoundedCornerShape(20.dp))
            .background(ColorBg),
        contentAlignment = Alignment.Center
    ) {
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                // Pinch zoom
                .pointerInput(Unit) {
                    detectTransformGestures { _, _, zoom, _ ->
                        scale = (scale * zoom).coerceIn(0.75f, 2.5f)
                    }
                }
                // Tap → hit test
                .pointerInput(isFrontView, selectedRegions) {
                    detectTapGestures { offset ->
                        val nx = offset.x / size.width
                        val ny = offset.y / size.height
                        val hit = BodyPathData.hitTest(nx, ny, isFrontView)
                        Log.d("BodyCanvas", "Tap nx=${"%.2f".format(nx)} ny=${"%.2f".format(ny)} → $hit")
                        if (hit != null) onRegionToggled(hit)
                    }
                }
        ) {
            val w = size.width
            val h = size.height

            // Apply zoom centered on canvas
            withTransform({
                scale(scale, scale, Offset(w / 2f, h / 2f))
            }) {
                if (isFrontView) {
                    drawFrontSilhouette(w, h)
                } else {
                    drawBackSilhouette(w, h)
                }

                // Draw glow highlights for selected zones
                val zones = BodyPathData.zonesFor(isFrontView)
                zones.forEach { zone ->
                    if (zone.region in selectedRegions) {
                        drawGlowZone(zone, w, h, pulseAlpha)
                    }
                }

                // Draw subtle zone boundaries (dots) for discoverability
                zones.forEach { zone ->
                    if (zone.region !in selectedRegions) {
                        drawDotHint(zone, w, h)
                    }
                }
            }
        }

        // Label overlay: show count hint
        if (selectedRegions.isEmpty()) {
            Text(
                "Chạm vào vùng cơ thể để chọn",
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = ColorHint,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 10.dp)
            )
        }
    }
}

// ─────────────────────────────────────────────────────────────
// DRAW: glow ellipse over a hit zone
// ─────────────────────────────────────────────────────────────
private fun DrawScope.drawGlowZone(zone: HitZone, w: Float, h: Float, alpha: Float) {
    val cx = zone.cx * w
    val cy = zone.cy * h
    val rx = zone.rx * w
    val ry = zone.ry * h

    // Outer glow
    drawOval(
        color = ColorGlow.copy(alpha = alpha * 0.45f),
        topLeft = Offset(cx - rx * 1.45f, cy - ry * 1.45f),
        size = Size(rx * 2.9f, ry * 2.9f)
    )
    // Inner fill
    drawOval(
        color = ColorSelected.copy(alpha = 0.55f),
        topLeft = Offset(cx - rx, cy - ry),
        size = Size(rx * 2f, ry * 2f)
    )
    // Outline ring
    drawOval(
        color = ColorSelected,
        topLeft = Offset(cx - rx, cy - ry),
        size = Size(rx * 2f, ry * 2f),
        style = Stroke(width = 2.5f)
    )
}

// ─────────────────────────────────────────────────────────────
// DRAW: tiny dot hint for un-selected zones
// ─────────────────────────────────────────────────────────────
private fun DrawScope.drawDotHint(zone: HitZone, w: Float, h: Float) {
    drawCircle(
        color = ColorOutline.copy(alpha = 0.12f),
        radius = 4f,
        center = Offset(zone.cx * w, zone.cy * h)
    )
}

// ─────────────────────────────────────────────────────────────
// SILHOUETTE: FRONT VIEW
// ─────────────────────────────────────────────────────────────
private fun DrawScope.drawFrontSilhouette(w: Float, h: Float) {
    // HEAD
    drawOval(
        brush = Brush.radialGradient(
            listOf(ColorSkin, ColorSkinDark),
            center = Offset(w * 0.50f, h * 0.06f),
            radius = w * 0.115f
        ),
        topLeft = Offset(w * 0.385f, h * 0.010f),
        size = Size(w * 0.23f, h * 0.110f)
    )
    // Head outline
    drawOval(
        color = ColorSkinShadow,
        topLeft = Offset(w * 0.385f, h * 0.010f),
        size = Size(w * 0.23f, h * 0.110f),
        style = Stroke(1.5f)
    )

    // NECK
    drawRect(
        color = ColorSkinDark,
        topLeft = Offset(w * 0.445f, h * 0.115f),
        size = Size(w * 0.11f, h * 0.040f)
    )

    // TORSO (trapezoid-like using Path)
    val torsoPath = Path().apply {
        moveTo(w * 0.300f, h * 0.155f)   // left shoulder
        lineTo(w * 0.700f, h * 0.155f)   // right shoulder
        lineTo(w * 0.660f, h * 0.460f)   // right hip
        lineTo(w * 0.340f, h * 0.460f)   // left hip
        close()
    }
    drawPath(
        path = torsoPath,
        brush = Brush.verticalGradient(
            listOf(ColorSkin, ColorSkinDark),
            startY = h * 0.155f,
            endY = h * 0.460f
        )
    )
    drawPath(torsoPath, color = ColorSkinShadow, style = Stroke(1.5f))

    // PELVIS / HIPS
    drawOval(
        color = ColorSkinDark,
        topLeft = Offset(w * 0.320f, h * 0.440f),
        size = Size(w * 0.360f, h * 0.060f)
    )

    // LEFT ARM
    drawBodySegment(
        w, h,
        x1=0.270f, y1=0.160f,
        x2=0.195f, y2=0.310f,
        widthRatio=0.085f
    )
    drawBodySegment(w,h, 0.195f,0.310f, 0.170f,0.430f, 0.070f)
    drawOval(color=ColorSkinDark,
        topLeft=Offset(w*0.105f, h*0.445f), size=Size(w*0.080f, h*0.055f)) // hand

    // RIGHT ARM
    drawBodySegment(w,h, 0.730f,0.160f, 0.805f,0.310f, 0.085f)
    drawBodySegment(w,h, 0.805f,0.310f, 0.830f,0.430f, 0.070f)
    drawOval(color=ColorSkinDark,
        topLeft=Offset(w*0.815f, h*0.445f), size=Size(w*0.080f, h*0.055f))

    // LEFT LEG — thigh + lower + foot
    drawBodySegment(w,h, 0.415f,0.460f, 0.410f,0.635f, 0.085f)
    drawBodySegment(w,h, 0.410f,0.635f, 0.415f,0.790f, 0.068f)
    drawOval(color=ColorSkinDark,
        topLeft=Offset(w*0.345f, h*0.800f), size=Size(w*0.130f, h*0.035f))

    // RIGHT LEG
    drawBodySegment(w,h, 0.585f,0.460f, 0.590f,0.635f, 0.085f)
    drawBodySegment(w,h, 0.590f,0.635f, 0.585f,0.790f, 0.068f)
    drawOval(color=ColorSkinDark,
        topLeft=Offset(w*0.525f, h*0.800f), size=Size(w*0.130f, h*0.035f))

    // FACE features
    drawCircle(Color(0xFFEAA080), radius=3.5f, center=Offset(w*0.455f, h*0.078f)) // left eye
    drawCircle(Color(0xFFEAA080), radius=3.5f, center=Offset(w*0.545f, h*0.078f)) // right eye
}

// ─────────────────────────────────────────────────────────────
// SILHOUETTE: BACK VIEW
// ─────────────────────────────────────────────────────────────
private fun DrawScope.drawBackSilhouette(w: Float, h: Float) {
    // HEAD (back — darker)
    drawOval(
        brush = Brush.radialGradient(
            listOf(ColorSkinDark, ColorSkinShadow),
            center = Offset(w*0.50f, h*0.06f),
            radius = w*0.115f
        ),
        topLeft = Offset(w*0.385f, h*0.010f),
        size = Size(w*0.23f, h*0.110f)
    )
    drawOval(color=ColorSkinShadow,
        topLeft=Offset(w*0.385f, h*0.010f),
        size=Size(w*0.23f, h*0.110f), style=Stroke(1.5f))

    // NAPE
    drawRect(color=ColorSkinShadow,
        topLeft=Offset(w*0.445f, h*0.115f), size=Size(w*0.11f, h*0.040f))

    // BACK torso
    val backPath = Path().apply {
        moveTo(w*0.300f, h*0.155f)
        lineTo(w*0.700f, h*0.155f)
        lineTo(w*0.660f, h*0.460f)
        lineTo(w*0.340f, h*0.460f)
        close()
    }
    drawPath(backPath,
        brush=Brush.verticalGradient(listOf(ColorSkinDark, ColorSkinShadow),
            startY=h*0.155f, endY=h*0.460f))
    drawPath(backPath, color=ColorSkinShadow, style=Stroke(1.5f))

    // Spine line
    drawLine(ColorSkinShadow.copy(alpha=0.55f),
        start=Offset(w*0.50f, h*0.155f), end=Offset(w*0.50f, h*0.450f), strokeWidth=2f)

    // PELVIS
    drawOval(color=ColorSkinShadow,
        topLeft=Offset(w*0.320f, h*0.440f), size=Size(w*0.360f, h*0.060f))

    // ARMS (same as front, slightly darker)
    drawBodySegment(w,h, 0.270f,0.160f, 0.195f,0.310f, 0.085f, darker=true)
    drawBodySegment(w,h, 0.195f,0.310f, 0.170f,0.430f, 0.070f, darker=true)
    drawOval(color=ColorSkinShadow,
        topLeft=Offset(w*0.105f, h*0.445f), size=Size(w*0.080f, h*0.055f))

    drawBodySegment(w,h, 0.730f,0.160f, 0.805f,0.310f, 0.085f, darker=true)
    drawBodySegment(w,h, 0.805f,0.310f, 0.830f,0.430f, 0.070f, darker=true)
    drawOval(color=ColorSkinShadow,
        topLeft=Offset(w*0.815f, h*0.445f), size=Size(w*0.080f, h*0.055f))

    // LEGS (back)
    drawBodySegment(w,h, 0.415f,0.460f, 0.410f,0.635f, 0.085f, darker=true)
    drawBodySegment(w,h, 0.410f,0.635f, 0.415f,0.790f, 0.068f, darker=true)
    drawOval(color=ColorSkinShadow,
        topLeft=Offset(w*0.345f, h*0.800f), size=Size(w*0.130f, h*0.035f))

    drawBodySegment(w,h, 0.585f,0.460f, 0.590f,0.635f, 0.085f, darker=true)
    drawBodySegment(w,h, 0.590f,0.635f, 0.585f,0.790f, 0.068f, darker=true)
    drawOval(color=ColorSkinShadow,
        topLeft=Offset(w*0.525f, h*0.800f), size=Size(w*0.130f, h*0.035f))
}

// ─────────────────────────────────────────────────────────────
// HELPER: draw a tapered body segment (limb)
// ─────────────────────────────────────────────────────────────
private fun DrawScope.drawBodySegment(
    w: Float, h: Float,
    x1: Float, y1: Float,
    x2: Float, y2: Float,
    widthRatio: Float,
    darker: Boolean = false
) {
    val px1 = Offset(x1*w, y1*h)
    val px2 = Offset(x2*w, y2*h)
    val dx = px2.x - px1.x
    val dy = px2.y - px1.y
    val len = sqrt(dx*dx + dy*dy)
    if (len == 0f) return
    val ux = -dy / len
    val uy = dx / len
    val hw = widthRatio * w * 0.5f
    val hw2 = hw * 0.75f // taper at bottom

    val p = Path().apply {
        moveTo(px1.x + ux*hw,  px1.y + uy*hw)
        lineTo(px1.x - ux*hw,  px1.y - uy*hw)
        lineTo(px2.x - ux*hw2, px2.y - uy*hw2)
        lineTo(px2.x + ux*hw2, px2.y + uy*hw2)
        close()
    }
    val fillColor = if (darker) ColorSkinDark else ColorSkin
    drawPath(p, color=fillColor)
    drawPath(p, color=ColorSkinShadow, style=Stroke(1.2f))
}
