'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Users, Heart, Sparkles, Target, Eye, Award, CheckCircle } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-16">
      {/* Banner */}
      <section className="bg-[#0c4b39] text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(102,255,51,0.05),transparent_50%)]"></div>
        <div className="container-custom relative z-10 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight">
            Về <span className="text-[#66FF33]">NovaCare</span>
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Nền tảng kết nối y tế thông minh, đồng hành cùng bạn trên hành trình chăm sóc sức khỏe toàn diện, nhanh chóng và tin cậy.
          </p>
        </div>
      </section>

      <div className="container-custom mt-12 space-y-16">
        {/* Intro Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block bg-[#0c4b39]/10 text-[#0c4b39] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              Giới thiệu chung
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-secondary tracking-tight">
              Giải pháp đặt lịch khám bệnh thời đại số
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Được thành lập với mục tiêu đơn giản hóa quy trình tiếp cận dịch vụ y tế, <strong>NovaCare</strong> kết nối trực tiếp bệnh nhân với các bệnh viện, phòng khám và bác sĩ chuyên khoa hàng đầu tại Việt Nam.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Chúng tôi hiểu rằng thời gian và sức khỏe là vô giá. Do đó, NovaCare không ngừng tối ưu hóa công nghệ để mang lại trải nghiệm đặt lịch hẹn khám tối giản, rút ngắn thời gian chờ đợi và nâng cao chất lượng phục vụ y tế cho mọi gia đình.
            </p>
          </div>
          <div className="bg-[#0c4b39]/5 border border-[#0c4b39]/10 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-center h-[300px]">
            <div className="absolute top-6 right-6 text-[#0c4b39]/10">
              <Award className="h-40 w-40" />
            </div>
            <p className="text-lg font-semibold text-[#0c4b39] italic relative z-10 leading-relaxed">
              "Sức khỏe của bạn là sứ mệnh hàng đầu của chúng tôi. NovaCare nỗ lực từng ngày để trở thành cầu nối vững chắc, mang y tế chất lượng cao đến gần hơn với mỗi người dân Việt."
            </p>
            <div className="mt-4 relative z-10">
              <p className="font-bold text-secondary text-sm">Ban điều hành NovaCare</p>
              <p className="text-xs text-gray-500">Đội ngũ sáng lập & phát triển hệ thống</p>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sứ mệnh */}
          <Card className="border border-gray-200/60 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardContent className="p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0c4b39]/10 text-[#0c4b39] flex items-center justify-center">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-secondary">Sứ mệnh</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Cung cấp giải pháp công nghệ y tế tiên tiến giúp bệnh nhân chủ động chăm sóc sức khỏe, dễ dàng tiếp cận với đội ngũ y bác sĩ giỏi, giảm thiểu thủ tục rườm rà tại bệnh viện.
              </p>
            </CardContent>
          </Card>

          {/* Tầm nhìn */}
          <Card className="border border-gray-200/60 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardContent className="p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0c4b39]/10 text-[#0c4b39] flex items-center justify-center">
                <Eye className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-secondary">Tầm nhìn</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Trở thành hệ sinh thái hỗ trợ và chăm sóc y tế số 1 Việt Nam, là người bạn đồng hành không thể thiếu của hàng triệu người dùng cũng như các cơ sở y tế trên cả nước.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Stats Section */}
        <section className="bg-white border border-gray-200/60 rounded-3xl p-8 md:p-10 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="pt-4 md:pt-0">
              <div className="text-3xl md:text-4xl font-extrabold text-[#0c4b39]">500+</div>
              <p className="text-gray-500 text-xs mt-2 font-medium">Bác sĩ chuyên khoa</p>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl md:text-4xl font-extrabold text-[#0c4b39]">100+</div>
              <p className="text-gray-500 text-xs mt-2 font-medium">Cơ sở y tế liên kết</p>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl md:text-4xl font-extrabold text-[#0c4b39]">10K+</div>
              <p className="text-gray-500 text-xs mt-2 font-medium">Lượt khám đặt thành công</p>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl md:text-4xl font-extrabold text-[#0c4b39]">98%</div>
              <p className="text-gray-500 text-xs mt-2 font-medium">Bệnh nhân hài lòng</p>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-block bg-[#0c4b39]/10 text-[#0c4b39] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              Giá trị cốt lõi
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-secondary tracking-tight">
              Nguyên tắc hoạt động của chúng tôi
            </h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              Tại NovaCare, chúng tôi luôn tuân thủ các chuẩn mực đạo đức y tế song song với việc áp dụng công nghệ mới.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tin cậy */}
            <div className="bg-white border border-gray-100 p-6 rounded-2xl space-y-3 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-secondary text-base">Tin cậy & Bảo mật</h4>
              <p className="text-gray-500 text-xs leading-relaxed">
                Cam kết bảo mật thông tin hồ sơ bệnh án và lịch trình cá nhân của người bệnh tuyệt đối theo tiêu chuẩn y khoa.
              </p>
            </div>

            {/* Chuyên nghiệp */}
            <div className="bg-white border border-gray-100 p-6 rounded-2xl space-y-3 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-secondary text-base">Chuyên nghiệp</h4>
              <p className="text-gray-500 text-xs leading-relaxed">
                Đồng bộ hóa lịch khám của bác sĩ thực tế, quy trình nhanh gọn, phản hồi nhanh chóng và chính xác.
              </p>
            </div>

            {/* Tận tâm */}
            <div className="bg-white border border-gray-100 p-6 rounded-2xl space-y-3 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <Heart className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-secondary text-base">Tận tâm phục vụ</h4>
              <p className="text-gray-500 text-xs leading-relaxed">
                Luôn lấy bệnh nhân làm trung tâm, lắng nghe và hỗ trợ chu đáo từ lúc đặt lịch tới khi hoàn thành khám.
              </p>
            </div>

            {/* Đổi mới */}
            <div className="bg-white border border-gray-100 p-6 rounded-2xl space-y-3 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-secondary text-base">Đổi mới sáng tạo</h4>
              <p className="text-gray-500 text-xs leading-relaxed">
                Không ngừng cập nhật và ứng dụng công nghệ hiện đại giúp tối ưu hóa thời gian và quy trình khám chữa bệnh.
              </p>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#0c4b39]/5 rounded-3xl p-8 md:p-12 border border-[#0c4b39]/10">
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-secondary tracking-tight">
              Trải nghiệm y tế tiện lợi cùng NovaCare
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Chúng tôi không chỉ là ứng dụng đặt lịch, mà còn là giải pháp tối ưu hóa vận hành cho các phòng khám, giúp nâng cao năng suất phục vụ cộng đồng.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-[#4CAF50] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-secondary text-sm">Hẹn giờ chính xác</h4>
                <p className="text-gray-500 text-xs mt-1">Chọn khung giờ cụ thể, hạn chế việc phải xếp hàng chờ đợi lâu ở sảnh bệnh viện.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-[#4CAF50] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-secondary text-sm">Thông tin rõ ràng</h4>
                <p className="text-gray-500 text-xs mt-1">Hồ sơ bác sĩ, chuyên môn, bảng giá dịch vụ công khai minh bạch trước khi đặt lịch.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-[#4CAF50] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-secondary text-sm">Quản lý lịch sử bệnh án</h4>
                <p className="text-gray-500 text-xs mt-1">Dễ dàng lưu trữ và tra cứu lịch sử khám bệnh, đơn thuốc trực tuyến ngay trên nền tảng.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-[#4CAF50] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-secondary text-sm">Nhắc hẹn tự động</h4>
                <p className="text-gray-500 text-xs mt-1">Hệ thống gửi thông báo nhắc lịch khám tự động qua hòm thư và ứng dụng tiện lợi.</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
