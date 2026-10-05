package com.example.kltn_novacare

import com.google.zxing.*
import com.google.zxing.common.HybridBinarizer
import com.google.zxing.qrcode.QRCodeReader
import com.google.zxing.qrcode.QRCodeWriter
import org.junit.Assert.assertEquals
import org.junit.Test

class AppointmentQrTest {
    @Test fun vietnameseBookingPayloadCanBeDecoded() {
        val data = "{\"bookingCode\":\"NOVA-20261004-0001\",\"patientName\":\"Nguyễn Thị Hà\",\"hospitalName\":\"Bệnh viện NovaCare\"}"
        val matrix = QRCodeWriter().encode(data, BarcodeFormat.QR_CODE, 512, 512,
            mapOf(EncodeHintType.CHARACTER_SET to "UTF-8", EncodeHintType.MARGIN to 4))
        val pixels = IntArray(512 * 512) { if (matrix[it % 512, it / 512]) 0xff000000.toInt() else 0xffffffff.toInt() }
        val bitmap = BinaryBitmap(HybridBinarizer(RGBLuminanceSource(512, 512, pixels)))
        assertEquals(data, QRCodeReader().decode(bitmap).text)
    }
}
