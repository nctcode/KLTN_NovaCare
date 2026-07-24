'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Calendar, User, Clock, ChevronRight, Newspaper, HeartHandshake, Award, BookOpen, Loader2 } from 'lucide-react';

const ARTICLES = [
  {
    id: 'art-1',
    slug: '5-dau-hieu-canh-bao-benh-tim-mach-cho-nguoi-tre',
    title: '5 Dấu hiệu cảnh báo sớm bệnh lý tim mạch ở người trẻ tuổi',
    summary: 'Bệnh lý tim mạch đang có xu hướng trẻ hóa do thói quen sinh hoạt và áp lực công việc. Cùng bác sĩ điểm qua các dấu hiệu nhận biết quan trọng.',
    category: 'y-te',
    categoryName: 'Tin tức Y tế & Sự kiện',
    author: 'TS.BS Nguyễn Văn An',
    date: '24/07/2026',
    readTime: '5 phút đọc',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=500',
    featured: true
  },
  {
    id: 'art-2',
    slug: 'che-do-dinh-duong-phong-ngua-tieu-duong',
    title: 'Chế độ dinh dưỡng khoa học giúp ổn định chỉ số đường huyết',
    summary: 'Hướng dẫn lựa chọn thực phẩm có chỉ số đường huyết GI thấp, xây dựng thực đơn hợp lý cho người bệnh đái tháo đường tuýp 2.',
    category: 'y-hoc-thuong-thuc',
    categoryName: 'Y học thường thức',
    author: 'BS.CKI Trần Thị Dung',
    date: '22/07/2026',
    readTime: '4 phút đọc',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=500',
    featured: false
  },
  {
    id: 'art-3',
    slug: 'giai-ma-nguyen-nhan-giam-tri-nho-khi-lam-viec-qua-suc',
    title: 'Giải mã nguyên nhân suy giảm trí nhớ ở dân văn phòng',
    summary: 'Làm việc liên tục trước màn hình vi tính và thiếu ngủ làm tăng căng thẳng hệ thần kinh. Chuyên gia gợi ý phương pháp cải thiện trí nhớ.',
    category: 'goc-chuyen-gia',
    categoryName: 'Góc chuyên gia',
    author: 'PGS.TS Lê Hoàng Bình',
    date: '20/07/2026',
    readTime: '6 phút đọc',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=500',
    featured: false
  },
  {
    id: 'art-4',
    slug: 'huong-dan-cham-soc-tre-nhi-khi-thoi-tiet-giao-mùa',
    title: 'Bí quyết bảo vệ đường hô hấp cho trẻ khi thời tiết giao mùa',
    summary: 'Trẻ nhỏ rất dễ bị sốt vi rút, viêm phế quản và hen suyễn. Tham khảo lời khuyên của chuyên gia nhi khoa NovaCare.',
    category: 'y-hoc-thuong-thuc',
    categoryName: 'Y học thường thức',
    author: 'BS.CKI Trần Thị Dung',
    date: '18/07/2026',
    readTime: '4 phút đọc',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=500',
    featured: false
  },
  {
    id: 'art-5',
    slug: 'nhung-dieu-can-luu-y-truoc-khi-di-xet-nghiem-mau',
    title: 'Những điều bắt buộc cần lưu ý trước khi đi xét nghiệm máu',
    summary: 'Có cần nhịn ăn sáng trước khi xét nghiệm không? Uống thuốc huyết áp có ảnh hưởng kết quả không? Giải đáp chi tiết.',
    category: 'y-te',
    categoryName: 'Tin tức Y tế & Sự kiện',
    author: 'ThS.BS Phạm Văn Cường',
    date: '15/07/2026',
    readTime: '3 phút đọc',
    image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=500',
    featured: false
  }
];

function NewsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get('category') || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);

  const categories = [
    { id: 'all', name: 'Tất cả bài viết', icon: BookOpen },
    { id: 'y-te', name: 'Tin Y tế & Sự kiện', icon: Newspaper },
    { id: 'y-hoc-thuong-thuc', name: 'Y học thường thức', icon: HeartHandshake },
    { id: 'goc-chuyen-gia', name: 'Góc chuyên gia', icon: Award },
  ];

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    if (catId === 'all') {
      router.push('/tin-tuc');
    } else {
      router.push(`/tin-tuc?category=${catId}`);
    }
  };

  const filteredArticles = ARTICLES.filter((art) => {
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || art.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredArticle = ARTICLES.find((a) => a.featured) || ARTICLES[0];

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-20">
      {/* Banner */}
      <section className="bg-[#0c4b39] text-white py-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(102,255,51,0.1),transparent_60%)]"></div>
        <div className="container-custom relative z-10 text-center">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#66FF33] bg-white/10 px-3.5 py-1 rounded-full border border-white/10 inline-block mb-3">
            Trang tin y tế & Sức khỏe NovaCare
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
            Tin Tức & Kiến Thức Y Học
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Cập nhật tin tức y tế mới nhất, bí quyết sống khỏe và lời khuyên chuyên môn được tham vấn trực tiếp bởi các bác sĩ uy tín.
          </p>
        </div>
      </section>

      <div className="container-custom mt-8 space-y-10">
        {/* Search & Category Pills */}
        <div className="space-y-6">
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm bài viết, chủ đề y tế..."
              className="pl-12 h-12 w-full bg-white border-slate-200 focus-visible:ring-[#0c4b39] rounded-xl shadow-xs text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    isSelected
                      ? 'bg-[#0c4b39] text-white scale-105 shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isSelected ? 'text-[#66FF33]' : 'text-slate-400'}`} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Featured Article Banner (Show if no search query & 'all' or matching category) */}
        {!searchQuery && (selectedCategory === 'all' || featuredArticle.category === selectedCategory) && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-2 group">
            <div className="h-64 lg:h-auto w-full relative overflow-hidden bg-slate-100">
              <img
                src={featuredArticle.image}
                alt={featuredArticle.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-[#0c4b39] text-[#66FF33] text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
                Nổi bật
              </div>
            </div>
            <div className="p-8 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-4 text-xs text-slate-400 mb-3 font-medium">
                  <span className="text-[#0c4b39] font-bold bg-[#0c4b39]/10 px-2.5 py-0.5 rounded-md">
                    {featuredArticle.categoryName}
                  </span>
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {featuredArticle.date}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {featuredArticle.readTime}</span>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 group-hover:text-[#0c4b39] transition-colors leading-snug">
                  <Link href={`/tin-tuc/${featuredArticle.slug}`}>{featuredArticle.title}</Link>
                </h2>
                <p className="text-slate-600 text-xs mt-3 leading-relaxed line-clamp-3">
                  {featuredArticle.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#0c4b39]" /> {featuredArticle.author}
                </span>
                <Link
                  href={`/tin-tuc/${featuredArticle.slug}`}
                  className="text-xs font-bold text-[#0c4b39] hover:underline flex items-center gap-1"
                >
                  Đọc tiếp <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <Card key={article.id} className="hover:shadow-lg transition border border-slate-200 bg-white rounded-3xl overflow-hidden flex flex-col justify-between group">
              <div>
                <div className="h-48 w-full relative overflow-hidden bg-slate-100">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[#0c4b39] text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs">
                    {article.categoryName}
                  </div>
                </div>

                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {article.date}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {article.readTime}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-[#0c4b39] transition-colors line-clamp-2">
                    <Link href={`/tin-tuc/${article.slug}`}>{article.title}</Link>
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {article.summary}
                  </p>
                </CardContent>
              </div>

              <div className="p-6 pt-0 border-t border-slate-100 mt-4 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 truncate max-w-[150px]">
                  {article.author}
                </span>
                <Link
                  href={`/tin-tuc/${article.slug}`}
                  className="text-xs font-bold text-[#0c4b39] hover:underline flex items-center gap-0.5"
                >
                  Xem chi tiết <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NewsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20 min-h-screen bg-[#F8F9FA]">
        <Loader2 className="animate-spin h-10 w-10 text-[#0c4b39]" />
      </div>
    }>
      <NewsPageContent />
    </Suspense>
  );
}
