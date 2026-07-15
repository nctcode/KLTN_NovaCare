'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { paymentService } from '@/services/payment.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { Suspense } from 'react';

function PaymentReturnPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');
  const appointmentId = searchParams.get('appointmentId');
  const vnpResponseCode = searchParams.get('vnp_ResponseCode');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!appointmentId) {
        setStatus('failed');
        setMessage('Không tìm thấy thông tin thanh toán lịch khám');
        return;
      }
      try {
        const result = await paymentService.getPaymentStatus(appointmentId);
        // Backend returns status 'PAID' or updates directly
        if (result && (result.status === 'PAID' || result.paymentStatus === 'PAID')) {
          setStatus('success');
          setMessage('Thanh toán thành công! Lịch khám của bạn đã được xác nhận.');
        } else {
          setStatus('failed');
          setMessage(result.message || 'Thanh toán không thành công hoặc đang chờ xử lý.');
        }
      } catch (error) {
        setStatus('failed');
        setMessage('Có lỗi xảy ra khi xác thực kết quả thanh toán với máy chủ.');
      }
    };

    if (vnpResponseCode === '00') {
      verifyPayment();
    } else {
      setStatus('failed');
      setMessage('Thanh toán không thành công hoặc giao dịch bị hủy bỏ.');
    }
  }, [appointmentId, vnpResponseCode]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-gray-650 font-medium">Đang xác thực kết quả thanh toán...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            {status === 'success' ? (
              <CheckCircle className="h-16 w-16 text-success" />
            ) : (
              <XCircle className="h-16 w-16 text-danger" />
            )}
          </div>
          <CardTitle className="text-2xl text-secondary">
            {status === 'success' ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-sm text-gray-600 leading-relaxed">{message}</p>
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="w-full">
              <Link href="/lich-kham">
                {status === 'success' ? 'Xem lịch khám của tôi' : 'Thử thanh toán lại'}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">Quay về trang chủ</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-gray-650 font-medium">Đang xác thực kết quả thanh toán...</p>
        </div>
      </div>
    }>
      <PaymentReturnPageContent />
    </Suspense>
  );
}
