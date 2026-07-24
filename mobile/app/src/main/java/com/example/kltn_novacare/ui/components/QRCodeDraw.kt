package com.example.kltn_novacare.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import kotlin.random.Random

@Composable
fun QRCodeDraw(
    data: String,
    modifier: Modifier = Modifier,
    color: Color = Color.Black
) {
    // We will draw a deterministic QR code grid using the hash of data
    val hash = data.hashCode()
    val random = Random(hash.toLong())
    val sizeInBlocks = 21 // Version 1 QR code size

    // Build the grid
    val grid = Array(sizeInBlocks) { BooleanArray(sizeInBlocks) }

    // Place random data in the grid
    for (i in 0 until sizeInBlocks) {
        for (j in 0 until sizeInBlocks) {
            grid[i][j] = random.nextBoolean()
        }
    }

    // Place the 3 QR position detection patterns at the corners (7x7 blocks)
    fun drawFinderPattern(grid: Array<BooleanArray>, startRow: Int, startCol: Int) {
        for (r in 0..6) {
            for (c in 0..6) {
                val row = startRow + r
                val col = startCol + c
                // Inner solid block (3x3), outer ring (7x7 border)
                val isBorder = r == 0 || r == 6 || c == 0 || c == 6
                val isCenter = r in 2..4 && c in 2..4
                grid[row][col] = isBorder || isCenter
            }
        }
    }

    // Top-left
    drawFinderPattern(grid, 0, 0)
    // Top-right
    drawFinderPattern(grid, 0, sizeInBlocks - 7)
    // Bottom-left
    drawFinderPattern(grid, sizeInBlocks - 7, 0)

    // Draw grid on Canvas
    Canvas(
        modifier = modifier
            .size(200.dp)
            .background(Color.White)
            .border(1.dp, Color(0xFFE2E8F0))
            .padding(16.dp)
    ) {
        val blockWidth = size.width / sizeInBlocks
        val blockHeight = size.height / sizeInBlocks

        for (row in 0 until sizeInBlocks) {
            for (col in 0 until sizeInBlocks) {
                if (grid[row][col]) {
                    drawRect(
                        color = color,
                        topLeft = Offset(col * blockWidth, row * blockHeight),
                        size = Size(blockWidth + 0.5f, blockHeight + 0.5f) // overlapping slightly to avoid gaps
                    )
                }
            }
        }
    }
}
