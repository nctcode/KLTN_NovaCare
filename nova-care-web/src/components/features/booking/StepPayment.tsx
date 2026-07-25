'use client';

import { useState } from 'react';
import { useBookingStore } from '@/stores/booking.store';
import { paymentService } from '@/services/payment.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  CreditCard, CheckCircle2, Loader2, Clock, QrCode, Wallet,
  ChevronRight, Lock, X, Shield, Smartphone, Check,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointment.service';
import { useRouter } from 'next/navigation';

const paymentMethods = [
  {
    id: 'vnpay',
    name: 'VNPay (Thẻ ATM, Internet Banking, QR Code)',
    description: 'Thanh toán trực tiếp qua ứng dụng ngân hàng hoặc thẻ ATM nội địa',
    icon: CreditCard,
    popular: true,
    isGateway: true,
    color: '#007bff',
    logo: '🏦',
  },
  {
    id: 'momo',
    name: 'Ví điện tử MoMo',
    description: 'Quét mã QR bằng ứng dụng MoMo trên điện thoại',
    icon: Wallet,
    popular: false,
    isGateway: false,
    color: '#ae2070',
    logo: '💜',
  },
  {
    id: 'vietqr',
    name: 'Chuyển khoản VietQR Chanh chóng',
    description: 'Chuyển khoản qua mã QR Ngân hàng (Miễn phí giao dịch)',
    icon: QrCode,
    popular: false,
    isGateway: false,
    color: '#1a73e8',
    logo: '📱',
  },
  {
    id: 'card',
    name: 'Thẻ quốc tế (Visa, Mastercard, JCB)',
    description: 'Hỗ trợ tất cả các dòng thẻ tín dụng & ghi nợ quốc tế',
    icon: CreditCard,
    popular: false,
    isGateway: false,
    color: '#1a1a2e',
    logo: '💳',
  },
];

/* ─── MoMo / VietQR / Card Simulate Modal ──────────────────────────── */
interface SimulateModalProps {
  method: typeof paymentMethods[0];
  appointment: any;
  onClose: () => void;
  onSuccess: () => void;
  appointmentId: string;
}

function SimulateModal({ method, appointment, onClose, onSuccess, appointmentId }: SimulateModalProps) {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const amount = appointment?.totalPrice?.toLocaleString() || '0';
  const bookingCode = appointment?.bookingCode || 'NC-000000';

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await paymentService.simulateSuccess(appointmentId, method.id.toUpperCase());
      setDone(true);
      setTimeout(() => {
        onSuccess();
      }, 1800);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi xác nhận thanh toán');
      setConfirming(false);
    }
  };

  /* ─── Done state ─── */
  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">Thanh toán thành công!</h3>
          <p className="text-sm text-gray-500">Đang chuyển đến trang xác nhận...</p>
        </div>
      </div>
    );
  }

  /* ─── MoMo modal ─── */
  if (method.id === 'momo') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#ae2070] to-[#c7336a] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-lg font-bold text-[#ae2070] shadow">M</div>
              <div>
                <p className="text-white font-bold text-sm">Ví MoMo</p>
                <p className="text-pink-200 text-xs">Quét mã để thanh toán</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Amount */}
            <div className="bg-pink-50 rounded-2xl p-3 flex justify-between items-center border border-pink-100">
              <span className="text-sm text-gray-500">Tổng thanh toán</span>
              <span className="text-lg font-bold text-[#ae2070]">{amount}đ</span>
            </div>

            {/* QR placeholder */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-48 h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-[#ae2070]/30 flex flex-col items-center justify-center gap-2 p-4">
                {/* Simple QR-like grid */}
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: 49 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-[2px]"
                      style={{
                        backgroundColor: [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48,8,15,16,17,18,19,22,25,26,31,32,37,38,39,40].includes(i)
                          ? '#ae2070' : '#f0f0f0'
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#ae2070] font-semibold">MoMo QR Code</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mở app MoMo → Quét mã QR để thanh toán</span>
              </div>
            </div>

            <div className="relative flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 whitespace-nowrap">hoặc xác nhận giả lập</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Confirm button */}
            <Button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full bg-gradient-to-r from-[#ae2070] to-[#c7336a] hover:from-[#9c1c63] hover:to-[#b52d5e] text-white font-bold py-3 rounded-2xl shadow-lg shadow-pink-100 transition-all"
            >
              {confirming ? (
                <><Loader2 className="animate-spin mr-2 h-4 w-4" />Đang xử lý...</>
              ) : (
                <><Check className="mr-2 h-4 w-4" />Xác nhận đã thanh toán MoMo</>
              )}
            </Button>

            <p className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              Mã phiếu: <strong className="text-gray-600">{bookingCode}</strong> · Mã hóa bảo mật SSL 256-bit
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── VietQR modal ─── */
  if (method.id === 'vietqr') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gradient-to-r from-[#1a73e8] to-[#4285f4] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-sm font-bold text-[#1a73e8] shadow">VQR</div>
              <div>
                <p className="text-white font-bold text-sm">VietQR</p>
                <p className="text-blue-200 text-xs">Chuyển khoản ngân hàng</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="bg-blue-50 rounded-2xl p-3 flex justify-between items-center border border-blue-100">
              <span className="text-sm text-gray-500">Số tiền cần chuyển</span>
              <span className="text-lg font-bold text-[#1a73e8]">{amount}đ</span>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-400">Ngân hàng</span>
                <span className="font-semibold">VPBank</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Số tài khoản</span>
                <span className="font-bold font-mono text-[#1a73e8]">1234567890</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Chủ tài khoản</span>
                <span className="font-semibold">NOVACARE HEALTHCARE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Nội dung CK</span>
                <span className="font-bold text-green-600">{bookingCode}</span>
              </div>
            </div>

            <Button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full bg-gradient-to-r from-[#1a73e8] to-[#4285f4] hover:opacity-90 text-white font-bold py-3 rounded-2xl shadow-lg transition-all"
            >
              {confirming ? (
                <><Loader2 className="animate-spin mr-2 h-4 w-4" />Đang xác nhận...</>
              ) : (
                <><Check className="mr-2 h-4 w-4" />Tôi đã chuyển khoản thành công</>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Card / Visa / Mastercard modal ─── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-white" />
            <div>
              <p className="text-white font-bold text-sm">Thẻ quốc tế</p>
              <p className="text-gray-300 text-xs">Visa / Mastercard / JCB</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-2xl p-3 flex justify-between items-center border border-gray-200">
            <span className="text-sm text-gray-500">Tổng thanh toán</span>
            <span className="text-lg font-bold text-gray-800">{amount}đ</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Số thẻ</label>
              <div className="border rounded-xl px-3 py-2.5 bg-white text-sm font-mono text-gray-400 tracking-widest">4111 1111 1111 1111</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Ngày hết hạn</label>
                <div className="border rounded-xl px-3 py-2.5 bg-white text-sm text-gray-400">12/28</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">CVV</label>
                <div className="border rounded-xl px-3 py-2.5 bg-white text-sm text-gray-400">***</div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:opacity-90 text-white font-bold py-3 rounded-2xl shadow-lg transition-all"
          >
            {confirming ? (
              <><Loader2 className="animate-spin mr-2 h-4 w-4" />Đang xử lý...</>
            ) : (
              <><Check className="mr-2 h-4 w-4" />Xác nhận thanh toán thẻ</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main StepPayment ──────────────────────────────────────────────── */
export function StepPayment() {
  const { bookingData } = useBookingStore();
  const { appointmentId } = bookingData;
  const [selectedMethod, setSelectedMethod] = useState('vnpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const router = useRouter();

  const { data: appointment, isLoading: loadingAppointment } = useQuery({
    queryKey: ['appointment-created', appointmentId],
    queryFn: () => appointmentService.getById(appointmentId!),
    enabled: !!appointmentId,
  });

  const selectedMethodData = paymentMethods.find((m) => m.id === selectedMethod)!;

  const handlePayment = async () => {
    if (!appointmentId) {
      toast.error('Không tìm thấy thông tin lịch hẹn để thanh toán');
      return;
    }

    /* VNPay → redirect to gateway */
    if (selectedMethod === 'vnpay') {
      setIsProcessing(true);
      try {
        const result = await paymentService.createPayment(appointmentId);
        if (result && result.paymentUrl) {
          window.location.href = result.paymentUrl;
        } else {
          toast.error('Không thể khởi tạo cổng thanh toán');
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo thanh toán');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    /* MoMo / VietQR / Card → open simulate modal */
    setShowSimulateModal(true);
  };

  const handleSimulateSuccess = () => {
    setShowSimulateModal(false);
    toast.success('Thanh toán thành công! Lịch khám đã được xác nhận.', { duration: 3000 });
    setTimeout(() => {
      router.push(`/thanh-toan/return?appointmentId=${appointmentId}&method=${selectedMethod}&status=success`);
    }, 500);
  };

  if (loadingAppointment) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Loader2 className="animate-spin h-8 w-8 text-[#4caf50] mb-2" />
        <p className="text-sm">Đang tải thông tin lịch hẹn...</p>
      </div>
    );
  }

  return (
    <>
      {showSimulateModal && appointmentId && (
        <SimulateModal
          method={selectedMethodData}
          appointment={appointment}
          appointmentId={appointmentId}
          onClose={() => setShowSimulateModal(false)}
          onSuccess={handleSimulateSuccess}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4caf50]/10 text-[#4caf50] text-xs font-bold uppercase tracking-wider mb-1">
              <CreditCard className="w-3.5 h-3.5" />
              Bước 5: Thanh toán
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-secondary">Thanh toán & Hoàn tất đặt lịch</h2>
          </div>
        </div>

        {/* Timer banner */}
        <div className="bg-[#4caf50]/10 border border-[#4caf50]/30 rounded-2xl p-4 flex gap-3 items-start">
          <Clock className="h-5 w-5 text-[#4caf50] shrink-0 mt-0.5" />
          <div className="text-xs text-gray-700 space-y-0.5">
            <p className="font-bold text-secondary text-sm">Lịch khám của bạn đã được giữ chỗ thành công!</p>
            <p className="text-gray-600">
              Vui lòng chọn phương thức và hoàn tất thanh toán trong vòng{' '}
              <strong className="text-[#4caf50]">15:00 phút</strong> để nhận mã phiếu khám.
            </p>
          </div>
        </div>

        {/* Order summary */}
        {appointment && (
          <Card className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <CardContent className="p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-gray-400">Mã phiếu đặt khám:</span>
                <span className="font-bold text-[#4caf50] bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100 font-mono text-sm">
                  {appointment.bookingCode || 'NC-884920'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700">
                <div>
                  <span className="text-gray-400">Người khám:</span>{' '}
                  <strong className="text-secondary">{appointment.patientProfile?.fullName}</strong>
                </div>
                <div>
                  <span className="text-gray-400">Bác sĩ:</span>{' '}
                  <strong className="text-secondary">{appointment.slot?.doctorWorkplace?.doctor?.fullName}</strong>
                </div>
                <div>
                  <span className="text-gray-400">Thời gian:</span>{' '}
                  <strong className="text-secondary">
                    {appointment.slot?.startTime
                      ? new Date(appointment.slot.startTime).toLocaleString('vi-VN')
                      : '---'}
                  </strong>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-gray-100 font-bold text-sm">
                <span className="text-secondary">Tổng thanh toán:</span>
                <span className="text-xl text-[#4caf50]">
                  {appointment.totalPrice?.toLocaleString() || '350.000'}đ
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment method selector */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Chọn phương thức thanh toán
          </label>
          <div className="space-y-2.5">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              return (
                <Card
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`cursor-pointer transition-all duration-200 rounded-2xl overflow-hidden bg-white ${
                    isSelected
                      ? 'border-2 border-[#4caf50] bg-[#4caf50]/[0.02] shadow-sm ring-2 ring-[#4caf50]/20'
                      : 'border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CardContent className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'text-white' : 'bg-gray-100 text-gray-500'
                        }`}
                        style={isSelected ? { backgroundColor: method.color } : {}}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-secondary text-sm truncate">{method.name}</p>
                          {method.popular && (
                            <span className="text-[9px] font-bold bg-[#4caf50] text-white px-1.5 py-0.5 rounded shrink-0">
                              Khuyên dùng
                            </span>
                          )}
                          {!method.isGateway && (
                            <span className="text-[9px] font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded shrink-0">
                              Demo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{method.description}</p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-[#4caf50] bg-[#4caf50]' : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-2 text-xs text-gray-400 justify-center py-1">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Giao dịch an toàn & mã hóa SSL 256-bit chuẩn ngân hàng</span>
        </div>

        {/* Action button */}
        <div className="pt-2">
          <Button
            size="lg"
            className="w-full bg-[#4caf50] hover:bg-[#439e47] text-white font-bold py-3 rounded-xl shadow-md shadow-emerald-100 transition-all cursor-pointer disabled:opacity-50 text-base"
            onClick={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                Đang chuyển hướng thanh toán...
              </>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>
                  {selectedMethod === 'vnpay'
                    ? 'Thanh toán qua VNPay'
                    : selectedMethod === 'momo'
                    ? 'Thanh toán qua MoMo'
                    : selectedMethod === 'vietqr'
                    ? 'Chuyển khoản VietQR'
                    : 'Thanh toán thẻ quốc tế'}
                </span>
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
