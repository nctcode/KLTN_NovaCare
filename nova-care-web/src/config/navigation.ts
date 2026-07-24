export interface NavSubItem {
  title: string;
  description: string;
  href: string;
  iconName: string;
  badge?: string;
}

export interface MegaItem {
  title: string;
  href: string;
  badge?: string;
  badgeType?: 'new' | 'hot' | 'popular' | 'default';
  iconName?: string;
  description?: string;
}

export interface MegaColumn {
  categoryTitle: string;
  items: MegaItem[];
}

export interface NavParentItem {
  id: string;
  title: string;
  href?: string;
  badge?: string;
  isMega?: boolean;
  megaColumns?: MegaColumn[];
  subItems?: NavSubItem[];
}

export const MAIN_NAVIGATION: NavParentItem[] = [
  {
    id: 'co-so-y-te',
    title: 'Cơ sở y tế',
    href: '/co-so-y-te',
    subItems: [
      {
        title: 'Bệnh viện công',
        description: 'Hệ thống bệnh viện tuyến Trung ương, Thành phố và Quận huyện',
        href: '/co-so-y-te?type=benh-vien-cong',
        iconName: 'Building2',
        badge: 'Uy tín'
      },
      {
        title: 'Bệnh viện tư nhân',
        description: 'Các cơ sở y tế tư nhân, bệnh viện quốc tế tiêu chuẩn cao',
        href: '/co-so-y-te?type=benh-vien-tu',
        iconName: 'Building',
      },
      {
        title: 'Phòng khám chuyên khoa',
        description: 'Phòng khám đa khoa & chuyên khoa đạt chuẩn y tế',
        href: '/co-so-y-te?type=phong-kham',
        iconName: 'Stethoscope',
      },
      {
        title: 'Trung tâm xét nghiệm & CĐHA',
        description: 'Trung tâm xét nghiệm máu, siêu âm, X-quang, MRI hiện đại',
        href: '/co-so-y-te?type=xet-nghiem',
        iconName: 'Activity',
      },
      {
        title: 'Tất cả cơ sở y tế',
        description: 'Xem toàn bộ danh sách 100+ bệnh viện và phòng khám',
        href: '/co-so-y-te',
        iconName: 'LayoutGrid',
      }
    ]
  },
  {
    id: 'dich-vu-y-te',
    title: 'Dịch vụ y tế',
    href: '/dich-vu',
    isMega: true,
    megaColumns: [
      {
        categoryTitle: 'ĐẶT LỊCH KHÁM BỆNH',
        items: [
          {
            title: 'Đặt khám tại cơ sở',
            href: '/co-so-y-te',
            iconName: 'Building2'
          },
          {
            title: 'Đặt khám chuyên khoa',
            href: '/chuyen-khoa',
            iconName: 'Sparkles'
          },
          {
            title: 'Gọi video với bác sĩ',
            href: '/dich-vu/tu-van-tu-xa',
            iconName: 'Video'
          },
          {
            title: 'Đặt khám ngoài giờ',
            href: '/dat-lich?type=ngoai-gio',
            iconName: 'Activity'
          },
          {
            title: 'Đặt khám theo bác sĩ',
            href: '/bac-si',
            iconName: 'UserCheck',
            badge: 'HOT',
            badgeType: 'hot'
          }
        ]
      },
      {
        categoryTitle: 'XÉT NGHIỆM & CHẨN ĐOÁN',
        items: [
          {
            title: 'Đặt lịch xét nghiệm',
            href: '/dich-vu/xet-nghiem',
            iconName: 'Microscope'
          },
          {
            title: 'Đặt lịch Chụp phim & Nội soi',
            href: '/dich-vu/chan-doan-hinh-anh',
            iconName: 'Activity'
          }
        ]
      },
      {
        categoryTitle: 'KHÁM SỨC KHỎE & DỰ PHÒNG',
        items: [
          {
            title: 'Khám doanh nghiệp',
            href: '/doanh-nghiep',
            iconName: 'Building'
          },
          {
            title: 'Gói khám sức khỏe',
            href: '/dich-vu/goi-kham-suc-khoe',
            iconName: 'ShieldCheck'
          },
          {
            title: 'Đặt lịch tiêm chủng',
            href: '/dich-vu/tiem-chung',
            badge: 'MỚI',
            badgeType: 'new',
            iconName: 'Sparkles'
          },
          {
            title: 'Khám sức khỏe thông tư',
            href: '/dich-vu/kham-thong-tu',
            iconName: 'FileText'
          },
          {
            title: 'Khám Tạo Hình Thẩm Mỹ',
            href: '/dich-vu/tham-my',
            iconName: 'Award'
          }
        ]
      },
      {
        categoryTitle: 'CHĂM SÓC & TIỆN ÍCH',
        items: [
          {
            title: 'Giúp việc cá nhân',
            href: '/dich-vu/giup-viec',
            iconName: 'HeartHandshake'
          },
          {
            title: 'Y tế tại nhà',
            href: '/dich-vu/kham-tai-nha',
            iconName: 'Home'
          },
          {
            title: 'Mua thuốc tại An Khang',
            href: '/dich-vu/nha-thuoc',
            iconName: 'LayoutGrid'
          }
        ]
      }
    ]
  },
  {
    id: 'kham-doanh-nghiep',
    title: 'Khám sức khỏe doanh nghiệp',
    href: '/doanh-nghiep',
    badge: 'HOT',
  },
  {
    id: 'tin-tuc',
    title: 'Tin tức',
    href: '/tin-tuc',
    subItems: [
      {
        title: 'Tin tức y tế & Sự kiện',
        description: 'Cập nhật tin tức y học, chính sách bảo hiểm và y tế mới nhất',
        href: '/tin-tuc?category=y-te',
        iconName: 'Newspaper',
      },
      {
        title: 'Y học thường thức & Sống khỏe',
        description: 'Cẩm nang dinh dưỡng, tập luyện và phòng chống bệnh tật',
        href: '/tin-tuc?category=y-hoc-thuong-thuc',
        iconName: 'HeartHandshake',
      },
      {
        title: 'Góc chuyên gia & Bác sĩ',
        description: 'Bài viết chuyên sâu và tư vấn chuyên môn từ các bác sĩ',
        href: '/tin-tuc?category=goc-chuyen-gia',
        iconName: 'Award',
      },
      {
        title: 'Tất cả bài viết',
        description: 'Khám phá toàn bộ kho tri thức y tế và chăm sóc sức khỏe',
        href: '/tin-tuc',
        iconName: 'BookOpen',
      }
    ]
  },
  {
    id: 'huong-dan',
    title: 'Hướng dẫn',
    href: '/huong-dan',
    subItems: [
      {
        title: 'Hướng dẫn đặt lịch khám',
        description: 'Các bước đặt hẹn khám nhanh chóng trên website NovaCare',
        href: '/huong-dan/dat-lich',
        iconName: 'Compass',
      },
      {
        title: 'Quy trình khám tại bệnh viện',
        description: 'Quy trình tiếp đón, nhận sổ và khám tại cơ sở y tế',
        href: '/huong-dan/quy-trinh-kham',
        iconName: 'FileText',
      },
      {
        title: 'Hướng dẫn thanh toán & Hoàn phí',
        description: 'Thông tin phương thức thanh toán, hoàn bù và hủy lịch',
        href: '/huong-dan/thanh-toan',
        iconName: 'CreditCard',
      },
      {
        title: 'Câu hỏi thường gặp (FAQ)',
        description: 'Giải đáp các thắc mắc phổ biến của người bệnh',
        href: '/cau-hoi-thuong-gap',
        iconName: 'HelpCircle',
      }
    ]
  },
  {
    id: 'lien-he-hop-tac',
    title: 'Liên hệ hợp tác',
    href: '/lien-he-hop-tac',
    subItems: [
      {
        title: 'Đăng ký hợp tác Cơ sở y tế',
        description: 'Dành cho Bệnh viện, Phòng khám muốn tham gia hệ thống',
        href: '/lien-he-hop-tac?type=co-so-y-te',
        iconName: 'Building2',
      },
      {
        title: 'Đăng ký Bác sĩ tham gia',
        description: 'Dành cho Bác sĩ muốn mở lịch khám và tư vấn trực tuyến',
        href: '/lien-he-hop-tac?type=bac-si',
        iconName: 'UserPlus',
      },
      {
        title: 'Về chúng tôi (NovaCare)',
        description: 'Giới thiệu về sứ mệnh, giá trị cốt lõi và đội ngũ NovaCare',
        href: '/ve-chung-toi',
        iconName: 'Info',
      },
      {
        title: 'Hotline & Hỗ trợ khách hàng',
        description: 'Liên hệ với đội ngũ CSKH NovaCare 24/7',
        href: '/lien-he',
        iconName: 'PhoneCall',
      }
    ]
  }
];
