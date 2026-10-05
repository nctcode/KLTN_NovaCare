package com.example.kltn_novacare.domain.service

import kotlin.math.sqrt
import kotlin.math.roundToInt

/** Timestamp-based estimate. No substitute BPM on short, interrupted or irregular signals. */
fun estimateCameraPpg(peaks: List<Long>, durationMs: Long): Int? {
    if (durationMs < 20_000 || peaks.size < 8) return null
    val intervals = peaks.zipWithNext { a, b -> (b - a).toDouble() }
    val valid = intervals.filter { it in 300.0..1_500.0 }
    if (valid.size < 7) return null
    val sorted = valid.sorted()
    val median = sorted[sorted.size / 2]
    val stable = valid.filter { kotlin.math.abs(it - median) <= median * .24 }
    // Reject a measurement if a material portion of detected beats disagrees.
    if (stable.size < 6 || stable.size.toDouble() / valid.size < .80) return null
    val mean = stable.average()
    val variation = sqrt(stable.map { (it - mean) * (it - mean) }.average()) / mean
    if (variation > .18) return null
    return (60000 / mean).roundToInt().takeIf { it in 30..220 }
}

data class CameraPpgProgress(
    val durationMs: Long,
    val covered: Boolean,
    val quality: Int,
)

class CameraPpgSignal {
    private val samples = ArrayDeque<Pair<Long, Double>>()
    private val peaks = mutableListOf<Long>()
    private var lastFrame = 0L
    private var lastSample = 0L
    private var start = 0L
    private var baseline = Double.NaN
    var duration: Long = 0L; private set

    fun progress(time: Long, red: Double, green: Double): CameraPpgProgress {
        val covered = red >= 72 && red > green * 1.08
        if (!covered || (lastFrame != 0L && time - lastFrame > 1_250)) reset()
        lastFrame = time
        if (covered && start == 0L) start = time
        duration = if (start == 0L) 0 else time - start
        val quality = when {
            !covered -> 0
            duration < 1_500 -> 35
            samples.size < 24 -> 60
            else -> 85
        }
        return CameraPpgProgress(duration, covered, quality)
    }

    fun add(time: Long, red: Double, green: Double): Int? {
        val state = progress(time, red, green)
        if (!state.covered || state.durationMs == 0L || (lastSample != 0L && time - lastSample < 65)) return null
        lastSample = time
        baseline = if (baseline.isNaN()) red else baseline * .96 + red * .04
        // Slow exposure changes are removed before peak detection.
        val filtered = red - baseline
        samples.addLast(time to filtered)
        while (samples.size > 90) samples.removeFirst()
        if (samples.size >= 9) {
            val list = samples.toList()
            val a = list[list.size - 3]
            val b = list[list.size - 2]
            val c = list.last()
            val values = list.map { it.second }
            val mean = values.average()
            val deviation = sqrt(values.map { (it - mean) * (it - mean) }.average())
            val threshold = mean + deviation * .12
            if (deviation > .08 && b.second > threshold && b.second > a.second && b.second >= c.second &&
                (peaks.isEmpty() || b.first - peaks.last() > 300)
            ) peaks.add(b.first)
        }
        return estimateCameraPpg(peaks, duration)
    }

    private fun reset() {
        samples.clear(); peaks.clear(); start = 0L; duration = 0L; baseline = Double.NaN; lastSample = 0L
    }
}
