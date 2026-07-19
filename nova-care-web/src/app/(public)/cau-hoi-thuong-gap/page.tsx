'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

const FAQ_DATA: FAQCategory[] = [
  {
    title: 'Đặt lịch khám',
    items: [
      {
        question: 'Làm thế nào để tôi đặt lịch khám với bác sĩ?',
        answer: 'Bạn chỉ cần tìm kiếm bác sĩ hoặc cơ sở y tế phù hợp trên trang chủ, chọn khung giờ khám mong muốn, điền thông tin bệnh nhân và bấm nút đặt lịch khám. Hệ thống sẽ tự động xác nhận qua email và thông báo trong tài khoản của bạn.',
      },
      {
        question: 'Tôi có phải trả thêm phí khi đặt lịch trực tuyến không?',
        answer: 'Không. NovaCare cung cấp dịch vụ đặt lịch khám hoàn toàn miễn phí cho người dùng. Bạn chỉ cần trả chi phí khám thực tế được niêm yết tại cơ sở y tế khi đến khám hoặc thanh toán trực tuyến.',
      },
      {
        question: 'Tôi có thể đặt lịch khám cho người thân không?',
        answer: 'Có. Khi điền thông tin đặt khám, bạn có thể tạo và chọn "Hồ sơ bệnh nhân" của người thân (Bố, mẹ, con,...) để đặt lịch hẹn chính xác với tên của họ.',
      },
    ],
  },
  {
    title: 'Hủy & Thay đổi lịch',
    items: [
      {
        question: 'Tôi muốn thay đổi hoặc hủy lịch khám thì phải làm thế nào?',
        answer: 'Bạn truy cập mục "Lịch khám" trong menu tài khoản cá nhân, chọn lịch khám cần đổi/hủy và làm theo hướng dẫn. Lưu ý bạn nên thay đổi hoặc hủy lịch hẹn trước giờ khám ít nhất 2 tiếng.',
      },
      {
        question: 'Số tiền thanh toán trước có được hoàn lại nếu tôi hủy lịch khám?',
        answer: 'Có. Nếu bạn hủy lịch khám đúng quy định (trước giờ khám tối thiểu 2-4 tiếng tùy quy định bệnh viện), số tiền bạn đã thanh toán trước sẽ được hoàn lại theo hình thức chuyển khoản hoặc ví điện tử trong vòng 3-5 ngày làm việc.',
      },
    ],
  },
  {
    title: 'Thanh toán & Hóa đơn',
    items: [
      {
        question: 'NovaCare hỗ trợ những phương thức thanh toán nào?',
        answer: 'Hệ thống hỗ trợ thanh toán trực tuyến qua thẻ nội địa (ATM), thẻ quốc tế (Visa/Mastercard), chuyển khoản ngân hàng qua mã QR (VietQR) hoặc thanh toán trực tiếp tại bệnh viện.',
      },
      {
        question: 'Tôi có được xuất hóa đơn đỏ (hóa đơn VAT) cho buổi khám không?',
        answer: 'Hóa đơn dịch vụ y tế và hóa đơn VAT sẽ được bệnh viện/phòng khám trực tiếp xuất cho bạn tại quầy tiếp đón sau khi bạn hoàn thành buổi khám bệnh.',
      },
    ],
  },
  {
    title: 'Tài khoản & Bảo mật',
    items: [
      {
        question: 'Tôi có cần đăng ký tài khoản để sử dụng dịch vụ không?',
        answer: 'Bạn vẫn có thể tìm kiếm thông tin bác sĩ mà không cần tài khoản. Tuy nhiên, để thực hiện đặt lịch khám và quản lý hồ sơ bệnh án trực tuyến, bạn bắt buộc phải đăng ký tài khoản.',
      },
      {
        question: 'Thông tin cá nhân của tôi được bảo mật như thế nào?',
        answer: 'NovaCare cam kết bảo vệ dữ liệu người dùng bằng các tiêu chuẩn mã hóa tiên tiến nhất (SSL/TLS). Dữ liệu bệnh án chỉ được chia sẻ với cơ sở y tế nơi bạn đặt lịch nhằm phục vụ quá trình khám chữa bệnh.',
      },
    ],
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getFilteredData = () => {
    if (!searchQuery.trim()) return FAQ_DATA;

    const query = searchQuery.toLowerCase();
    return FAQ_DATA.map((category) => {
      const filteredItems = category.items.filter(
        (item) =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query)
      );
      return {
        ...category,
        items: filteredItems,
      };
    }).filter((category) => category.items.length > 0);
  };

  const filteredData = getFilteredData();

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-16">
      {/* Banner */}
      <section className="bg-[#0c4b39] text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(102,255,51,0.05),transparent_50%)]"></div>
        <div className="container-custom relative z-10 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">
            Câu Hỏi Thường Gặp
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-sm md:text-base">
            Giải đáp mọi thắc mắc của bạn về việc đặt lịch khám, thanh toán và sử dụng dịch vụ trên NovaCare.
          </p>
        </div>
      </section>

      <div className="container-custom mt-8 max-w-3xl space-y-8">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Nhập câu hỏi bạn cần tìm kiếm..."
            className="pl-12 h-12 w-full bg-white border-gray-200 focus-visible:ring-[#4CAF50] rounded-xl shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* FAQ list */}
        {filteredData.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200/60 rounded-3xl p-8 space-y-4">
            <HelpCircle className="h-12 w-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-secondary">Không tìm thấy kết quả phù hợp</h3>
            <p className="text-gray-500 text-xs">Hãy thử tìm kiếm với các từ khóa ngắn gọn hơn như "hủy lịch", "thanh toán", "hồ sơ".</p>
          </div>
        ) : (
          filteredData.map((category, catIdx) => (
            <div key={catIdx} className="space-y-4">
              <h2 className="text-lg font-bold text-[#0c4b39] pl-1">{category.title}</h2>
              
              <div className="space-y-3">
                {category.items.map((item, itemIdx) => {
                  const key = `${catIdx}-${itemIdx}`;
                  const isOpen = !!openItems[key];

                  return (
                    <Card 
                      key={itemIdx} 
                      className="border border-gray-200/60 hover:border-gray-300 transition duration-200 rounded-xl overflow-hidden bg-white shadow-sm"
                    >
                      <button
                        onClick={() => toggleItem(catIdx, itemIdx)}
                        className="w-full text-left p-5 flex justify-between items-center gap-4 hover:bg-gray-50/50 transition cursor-pointer"
                      >
                        <span className="font-semibold text-secondary text-sm md:text-base leading-snug">
                          {item.question}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
                        )}
                      </button>
                      
                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 border-t border-gray-50 text-gray-600 text-xs md:text-sm leading-relaxed bg-[#fbfcfb]/50">
                          {item.answer}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
