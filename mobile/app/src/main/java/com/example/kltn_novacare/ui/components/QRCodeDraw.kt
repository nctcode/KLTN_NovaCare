package com.example.kltn_novacare.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter

@Composable
fun QRCodeDraw(data: String, modifier: Modifier = Modifier, color: Color = Color.Black) {
    val matrix = remember(data) { QRCodeWriter().encode(data, BarcodeFormat.QR_CODE, 0, 0,
        mapOf(EncodeHintType.CHARACTER_SET to "UTF-8", EncodeHintType.MARGIN to 4)) }
    Canvas(modifier.size(240.dp).background(Color.White)) {
        val cell = kotlin.math.floor(size.minDimension / matrix.width)
        val dx = (size.width - cell * matrix.width) / 2
        val dy = (size.height - cell * matrix.height) / 2
        for (y in 0 until matrix.height) for (x in 0 until matrix.width) {
            if (matrix[x, y]) drawRect(color, Offset(dx + x * cell, dy + y * cell), Size(cell, cell))
        }
    }
}
