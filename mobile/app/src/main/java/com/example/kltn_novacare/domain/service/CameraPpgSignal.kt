package com.example.kltn_novacare.domain.service

import kotlin.math.sqrt
import kotlin.math.roundToInt

/** Timestamp-based estimate. No substitute BPM on short, interrupted or irregular signals. */
fun estimateCameraPpg(peaks: List<Long>, durationMs: Long): Int? {
    if (durationMs < 20000 || peaks.size < 12) return null
    val intervals = peaks.zipWithNext { a, b -> (b - a).toDouble() }
    if (intervals.any { it !in 250.0..2000.0 }) return null
    val mean = intervals.average()
    val variation = sqrt(intervals.map { (it - mean) * (it - mean) }.average()) / mean
    if (variation > .18) return null
    return (60000 / mean).roundToInt().takeIf { it in 30..220 }
}
class CameraPpgSignal {
    private val samples = ArrayDeque<Pair<Long, Double>>()
    private val peaks = mutableListOf<Long>()
    private var last = 0L
    private var start = 0L
    var duration: Long = 0L; private set
    fun add(time: Long, red: Double, green: Double): Int? {
        if (red < 70 || red < green * 1.15 || (last != 0L && time - last > 300)) { samples.clear(); peaks.clear(); start = 0L; duration = 0; last = time; return null }
        last = time
        if (start == 0L) start = time
        duration = time - start
        samples.addLast(time to red)
        while (samples.size > 45) samples.removeFirst()
        if (samples.size >= 12) {
            val list = samples.toList(); val a = list[list.size - 3]; val b = list[list.size - 2]; val c = list.last()
            val avg = list.map { it.second }.average()
            val amplitude = list.maxOf { it.second } - list.minOf { it.second }
            if (amplitude > .4 && b.second > avg && b.second > a.second && b.second >= c.second && (peaks.isEmpty() || b.first - peaks.last() > 300)) peaks.add(b.first)
        }
        return estimateCameraPpg(peaks, duration)
    }
}
