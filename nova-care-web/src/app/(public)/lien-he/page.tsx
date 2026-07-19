'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Mail, MapPin, Clock, Send, Loader2, MessageSquare, ShieldCheck } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên không được để trống';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không đúng định dạng';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại không được để trống';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại phải chứa 10-11 chữ số';
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Tiêu đề không được để trống';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Nội dung tin nhắn không được để trống';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    // Simulate sending message
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Gửi tin nhắn liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất có thể.');
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    }, 1500);
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-16">
      {/* Banner */}
      <section className="bg-[#0c4b39] text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(102,255,51,0.1),transparent_50%)]"></div>
        <div className="container-custom relative z-10 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight">
            Liên hệ với <span className="text-[#66FF33]">NovaCare</span>
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Chúng tôi luôn lắng nghe ý kiến đóng góp và sẵn sàng giải đáp mọi thắc mắc của bạn.
            Hãy liên hệ với chúng tôi qua các kênh thông tin dưới đây hoặc gửi lời nhắn trực tiếp.
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="container-custom mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Contact Info (Left Column) - 5 Columns */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-2xl font-bold text-secondary tracking-tight mb-2">Thông tin liên hệ</h2>
            <p className="text-gray-500 text-sm mb-6">
              Vui lòng liên hệ trực tiếp qua số hotline hoặc gửi thư điện tử để được phản hồi nhanh nhất.
            </p>

            <Card className="border border-gray-200/60 shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-6 space-y-6">

                {/* Phone */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary text-base">Đường dây nóng</h3>
                    <p className="text-xl font-extrabold text-[#0c4b39] mt-1">1900 1234</p>
                    <p className="text-xs text-gray-400 mt-0.5">Hỗ trợ 24/7 cho các trường hợp khẩn cấp</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex gap-4 border-t border-gray-100 pt-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary text-base">Thư điện tử</h3>
                    <p className="text-base font-semibold text-gray-700 mt-1">support@novacare.vn</p>
                    <p className="text-xs text-gray-400 mt-0.5">Giải đáp thắc mắc và hỗ trợ kỹ thuật</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex gap-4 border-t border-gray-100 pt-6">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary text-base">Địa chỉ trụ sở</h3>
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                      12 Nguyễn Văn Bảo, Phường 1, Quận Gò Vấp, Thành phố Hồ Chí Minh, Việt Nam
                    </p>
                  </div>
                </div>

                {/* Working hours */}
                <div className="flex gap-4 border-t border-gray-100 pt-6">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary text-base">Giờ làm việc</h3>
                    <p className="text-sm text-gray-700 mt-1">
                      Thứ Hai - Thứ Sáu: 08:00 - 17:30 <br />
                      Thứ Bảy: 08:00 - 12:00
                    </p>
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* Support guarantee badge */}
            <div className="bg-[#0c4b39]/5 border border-[#0c4b39]/10 rounded-2xl p-5 flex gap-4 items-center">
              <ShieldCheck className="h-10 w-10 text-[#4CAF50] shrink-0" />
              <div>
                <h4 className="font-bold text-secondary text-sm">Bảo mật & an toàn</h4>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Mọi thông tin liên hệ và trao đổi của bạn đều được chúng tôi bảo mật tuyệt đối theo chính sách bảo mật của NovaCare.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form (Right Column) - 7 Columns */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-2xl font-bold text-secondary tracking-tight mb-2">Gửi tin nhắn cho chúng tôi</h2>
            <p className="text-gray-500 text-sm mb-6">
              Bạn có yêu cầu đặc biệt, thắc mắc về đặt lịch khám hoặc phản hồi về dịch vụ? Điền thông tin vào mẫu bên dưới.
            </p>

            <Card className="border border-gray-200/60 shadow-md rounded-2xl bg-white overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-gray-700 font-semibold text-sm">
                      Họ và tên <span className="text-danger">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Nguyễn Văn A"
                      className={`h-11 border-gray-200 focus-visible:ring-[#4CAF50] rounded-xl ${errors.fullName ? 'border-danger' : ''}`}
                    />
                    {errors.fullName && <p className="text-xs text-danger">{errors.fullName}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-semibold text-sm">
                        Địa chỉ Email <span className="text-danger">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="example@email.com"
                        className={`h-11 border-gray-200 focus-visible:ring-[#4CAF50] rounded-xl ${errors.email ? 'border-danger' : ''}`}
                      />
                      {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-700 font-semibold text-sm">
                        Số điện thoại <span className="text-danger">*</span>
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0912345678"
                        className={`h-11 border-gray-200 focus-visible:ring-[#4CAF50] rounded-xl ${errors.phone ? 'border-danger' : ''}`}
                      />
                      {errors.phone && <p className="text-xs text-danger">{errors.phone}</p>}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-gray-700 font-semibold text-sm">
                      Tiêu đề <span className="text-danger">*</span>
                    </Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Cần hỗ trợ về việc gì?"
                      className={`h-11 border-gray-200 focus-visible:ring-[#4CAF50] rounded-xl ${errors.subject ? 'border-danger' : ''}`}
                    />
                    {errors.subject && <p className="text-xs text-danger">{errors.subject}</p>}
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-gray-700 font-semibold text-sm">
                      Nội dung tin nhắn <span className="text-danger">*</span>
                    </Label>
                    <textarea
                      id="message"
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Nhập nội dung phản hồi hoặc câu hỏi của bạn tại đây..."
                      className={`w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent text-sm placeholder:text-gray-400 bg-white transition duration-200 ${errors.message ? 'border-danger' : ''}`}
                    />
                    {errors.message && <p className="text-xs text-danger">{errors.message}</p>}
                  </div>

                  {/* Submit button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 bg-[#4CAF50] hover:bg-[#3d9c41] active:bg-[#2e7d32] text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin h-5 w-5" />
                          Đang gửi yêu cầu...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          Gửi tin nhắn liên hệ
                        </>
                      )}
                    </Button>
                  </div>

                </form>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Google Map Section */}
        <div className="mt-16 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0c4b39]/10 text-[#0c4b39] flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-secondary tracking-tight">Vị trí của chúng tôi</h2>
              <p className="text-gray-500 text-xs mt-0.5">Xem vị trí trụ sở chính của NovaCare trên bản đồ</p>
            </div>
          </div>

          <Card className="border border-gray-200/60 shadow-md rounded-2xl overflow-hidden bg-white">
            <div className="h-[400px] w-full relative">
              <iframe
                src="https://maps.google.com/maps?q=Đại học Công nghiệp Thành phố Hồ Chí Minh, 12 Nguyễn Văn Bảo, Phường 1, Gò Vấp, Thành phố Hồ Chí Minh&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale-[20%] contrast-[110%]"
              ></iframe>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
