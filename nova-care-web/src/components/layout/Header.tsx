'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  Menu,
  Bell,
  User,
  LogOut,
  ChevronDown,
  PhoneCall,
  X,
  Building2,
  Building,
  Stethoscope,
  Activity,
  LayoutGrid,
  UserCheck,
  Sparkles,
  ShieldCheck,
  Home as HomeIcon,
  Video,
  Microscope,
  Newspaper,
  HeartHandshake,
  Award,
  BookOpen,
  Compass,
  FileText,
  CreditCard,
  HelpCircle,
  UserPlus,
  Info,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState, useRef, useEffect } from 'react';
import { MAIN_NAVIGATION, MegaItem } from '@/config/navigation';

// Map icon name to Lucide component
const renderIcon = (name?: string) => {
  if (!name) return null;
  const props = { className: "h-4 w-4 text-[#0c4b39] shrink-0" };
  switch (name) {
    case 'Building2': return <Building2 {...props} />;
    case 'Building': return <Building {...props} />;
    case 'Stethoscope': return <Stethoscope {...props} />;
    case 'Activity': return <Activity {...props} />;
    case 'LayoutGrid': return <LayoutGrid {...props} />;
    case 'UserCheck': return <UserCheck {...props} />;
    case 'Sparkles': return <Sparkles {...props} />;
    case 'ShieldCheck': return <ShieldCheck {...props} />;
    case 'Home': return <HomeIcon {...props} />;
    case 'Video': return <Video {...props} />;
    case 'Microscope': return <Microscope {...props} />;
    case 'Newspaper': return <Newspaper {...props} />;
    case 'HeartHandshake': return <HeartHandshake {...props} />;
    case 'Award': return <Award {...props} />;
    case 'BookOpen': return <BookOpen {...props} />;
    case 'Compass': return <Compass {...props} />;
    case 'FileText': return <FileText {...props} />;
    case 'CreditCard': return <CreditCard {...props} />;
    case 'HelpCircle': return <HelpCircle {...props} />;
    case 'UserPlus': return <UserPlus {...props} />;
    case 'Info': return <Info {...props} />;
    case 'PhoneCall': return <PhoneCall {...props} />;
    default: return <Stethoscope {...props} />;
  }
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (id: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(id);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const toggleMobileCategory = (id: string) => {
    setExpandedMobileCategory(expandedMobileCategory === id ? null : id);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  // SPECIAL DASHBOARD HEADER MODE (When rendered inside Patient Dashboard Layout)
  if (onMenuClick) {
    return (
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs h-16 flex items-center px-4 sm:px-6">
        <div className="w-full flex items-center justify-between gap-4">
          {/* Left: Mobile Drawer Trigger & Return to Public Portal */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition"
              aria-label="Open sidebar navigation"
            >
              <Menu className="h-6 w-6" />
            </button>

            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0c4b39]/10 hover:bg-[#0c4b39]/15 text-[#0c4b39] font-extrabold text-xs transition border border-[#0c4b39]/15"
            >
              <HomeIcon className="h-4 w-4 text-[#0c4b39]" />
              <span className="hidden sm:inline">Về Trang Chủ NovaCare</span>
            </Link>

            <span className="hidden md:inline-block text-slate-300">|</span>

            <span className="hidden md:inline-block text-xs font-bold text-slate-500">
              Quản lý Tài khoản & Hồ sơ Bệnh nhân
            </span>
          </div>

          {/* Right: Hotline, Notifications & User Profile */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="tel:19001234"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0c4b39]/5 hover:bg-[#0c4b39]/10 text-xs font-bold text-[#0c4b39] transition border border-[#0c4b39]/15"
            >
              <PhoneCall className="h-3.5 w-3.5 text-[#0c4b39] animate-bounce" />
              <span>1900 1234</span>
            </a>

            {/* Notification Bell */}
            <Button variant="ghost" size="icon" className="relative text-slate-700 hover:bg-slate-100 rounded-full h-9 w-9" asChild>
              <Link href="/thong-bao">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
              </Link>
            </Button>

            {/* User Profile Avatar Dropdown */}
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 rounded-full pl-2 pr-3 bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200">
                    <Avatar className="h-6 w-6 mr-1.5">
                      <AvatarFallback className="bg-[#0c4b39] text-[#66FF33] font-black text-xs">
                        {user?.fullName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-bold truncate max-w-[100px]">{user?.fullName || 'Tài khoản'}</span>
                    <ChevronDown className="h-3.5 w-3.5 ml-1 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-1 rounded-xl shadow-xl border border-slate-100">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold text-slate-800">{user?.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email || user?.username}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/tai-khoan" className="cursor-pointer font-medium text-xs py-2">
                      <User className="mr-2 h-4 w-4 text-[#0c4b39]" />
                      Quản lý Tài khoản
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/ho-so" className="cursor-pointer font-medium text-xs py-2">
                      <FileText className="mr-2 h-4 w-4 text-[#0c4b39]" />
                      Hồ sơ Bệnh nhân
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/lich-kham" className="cursor-pointer font-medium text-xs py-2">
                      <Activity className="mr-2 h-4 w-4 text-[#0c4b39]" />
                      Lịch hẹn khám của tôi
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-rose-600 font-bold text-xs py-2 focus:bg-rose-50 focus:text-rose-700">
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>
    );
  }

  // STANDARD PUBLIC PORTAL HEADER
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 h-16 flex items-center justify-between gap-3 lg:gap-5">
        {/* Left Section: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 bg-[#0c4b39] rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
              <span className="text-[#66FF33] font-black text-lg">N</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-[#1A2B3C] tracking-tight leading-none">
                NovaCare
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide mt-0.5 hidden sm:block">
                Hệ thống y tế & Đặt khám
              </span>
            </div>
          </Link>
        </div>

        {/* Center Section: Main Categories Navigation Menu */}
        <nav className="hidden lg:flex flex-1 items-center justify-center min-w-0 px-2 relative">
          <ul className="flex items-center justify-center gap-1 xl:gap-2 font-semibold text-sm">
            {MAIN_NAVIGATION.map((item, index) => {
              const hasSub = (item.subItems && item.subItems.length > 0) || (item.isMega && item.megaColumns && item.megaColumns.length > 0);
              const isOpen = activeDropdown === item.id;
              const isActiveRoute = pathname === item.href ||
                (item.subItems?.some(s => pathname === s.href.split('?')[0])) ||
                (item.megaColumns?.some(col => col.items.some(m => pathname === m.href.split('?')[0])));

              const isLastTwoItems = index >= MAIN_NAVIGATION.length - 2;

              return (
                <li
                  key={item.id}
                  className={`shrink-0 ${item.isMega ? '' : 'relative'}`}
                  onMouseEnter={() => handleMouseEnter(item.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    href={item.href || '#'}
                    className={`flex items-center gap-1 px-2.5 xl:px-3 py-2 rounded-lg transition-colors text-[13px] xl:text-[14px] font-bold tracking-tight whitespace-nowrap ${
                      isActiveRoute || isOpen
                        ? 'text-[#0c4b39] bg-[#0c4b39]/8'
                        : 'text-[#1A2B3C] hover:text-[#0c4b39] hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-rose-500 text-white font-extrabold rounded-full leading-none shadow-xs">
                        {item.badge}
                      </span>
                    )}
                    {hasSub && (
                      <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#0c4b39]' : ''}`} />
                    )}
                  </Link>

                  {/* Mega Menu Dropdown Container */}
                  {item.isMega && item.megaColumns && isOpen && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 z-50 pt-2 w-[960px] max-w-[92vw] animate-in fade-in slide-in-from-top-1 duration-150"
                      onMouseEnter={() => handleMouseEnter(item.id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-5 grid grid-cols-4 gap-0 divide-x divide-slate-100">
                        {item.megaColumns.map((col, cIdx) => (
                          <div key={cIdx} className="px-4 first:pl-2 last:pr-2 flex flex-col">
                            <div className="text-[12px] font-extrabold text-[#1A2B3C]/80 uppercase tracking-wider pb-2 mb-3 border-b border-slate-100 flex items-center justify-between">
                              <span>{col.categoryTitle}</span>
                            </div>
                            <div className="space-y-1 flex-1">
                              {col.items.map((sub, sIdx) => (
                                <Link
                                  key={sIdx}
                                  href={sub.href}
                                  className="group flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-[#0c4b39]/6 text-[#1A2B3C] hover:text-[#0c4b39] transition-all duration-150"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {renderIcon(sub.iconName)}
                                    <span className="font-bold text-[13px] truncate group-hover:translate-x-0.5 transition-transform duration-150">
                                      {sub.title}
                                    </span>
                                  </div>
                                  {sub.badge && (
                                    <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md uppercase shrink-0 ${
                                      sub.badgeType === 'new'
                                        ? 'bg-[#00C9A7] text-white shadow-xs'
                                        : sub.badgeType === 'hot'
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-[#66FF33]/20 text-[#0c4b39]'
                                    }`}>
                                      {sub.badge}
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Standard Single Column Dropdown Menu Container */}
                  {!item.isMega && item.subItems && isOpen && (
                    <div
                      className={`absolute top-full z-50 pt-2 w-[380px] animate-in fade-in slide-in-from-top-1 duration-150 ${
                        isLastTwoItems ? 'right-0' : 'left-0'
                      }`}
                      onMouseEnter={() => handleMouseEnter(item.id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-3.5 grid grid-cols-1 gap-1">
                        <div className="px-2 py-1 mb-1 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Danh mục {item.title}
                          </span>
                          <Link href={item.href || '#'} className="text-[11px] font-bold text-[#0c4b39] hover:underline flex items-center">
                            Xem tất cả <ChevronRight className="h-3 w-3 ml-0.5" />
                          </Link>
                        </div>
                        {item.subItems?.map((sub, idx) => (
                          <Link
                            key={idx}
                            href={sub.href}
                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#0c4b39]/5 group transition duration-150"
                          >
                            <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-white group-hover:shadow-xs transition">
                              {renderIcon(sub.iconName)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-xs group-hover:text-[#0c4b39] transition">
                                  {sub.title}
                                </span>
                                {sub.badge && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-[#66FF33]/20 text-[#0c4b39] font-bold rounded-md">
                                    {sub.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-snug">
                                {sub.description}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right Section: Hotline & Auth Menu */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Hotline Badge */}
          <a
            href="tel:19001234"
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0c4b39]/5 hover:bg-[#0c4b39]/10 text-xs font-bold text-[#0c4b39] transition border border-[#0c4b39]/15"
          >
            <PhoneCall className="h-3.5 w-3.5 text-[#0c4b39] animate-bounce" />
            <span>1900 1234</span>
          </a>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* Notification */}
              <Button variant="ghost" size="icon" className="relative text-slate-700 hover:bg-slate-100 rounded-full h-9 w-9" asChild>
                <Link href="/thong-bao">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
                </Link>
              </Button>

              {/* User Menu Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 rounded-full pl-2 pr-3 bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200">
                    <Avatar className="h-6 w-6 mr-1.5">
                      <AvatarFallback className="bg-[#0c4b39] text-[#66FF33] font-black text-xs">
                        {user?.fullName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-bold truncate max-w-[90px]">{user?.fullName || 'Tài khoản'}</span>
                    <ChevronDown className="h-3.5 w-3.5 ml-1 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-1 rounded-xl shadow-xl border border-slate-100">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold text-slate-800">{user?.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email || user?.username}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/tai-khoan" className="cursor-pointer font-medium text-xs py-2">
                      <User className="mr-2 h-4 w-4 text-[#0c4b39]" />
                      Quản lý Tài khoản
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/ho-so" className="cursor-pointer font-medium text-xs py-2">
                      <FileText className="mr-2 h-4 w-4 text-[#0c4b39]" />
                      Hồ sơ Bệnh nhân
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/lich-kham" className="cursor-pointer font-medium text-xs py-2">
                      <Activity className="mr-2 h-4 w-4 text-[#0c4b39]" />
                      Lịch hẹn khám của tôi
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-rose-600 font-bold text-xs py-2 focus:bg-rose-50 focus:text-rose-700">
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-slate-700 hover:bg-slate-100 font-bold text-xs h-8 px-3 rounded-full" asChild>
                <Link href="/dang-nhap">Đăng nhập</Link>
              </Button>
              <Button size="sm" className="bg-[#0c4b39] hover:bg-[#083327] text-white font-bold text-xs h-8 px-4 rounded-full shadow-sm" asChild>
                <Link href="/dang-ky">Đăng ký</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Accordion Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white max-h-[85vh] overflow-y-auto px-4 py-4 space-y-4 shadow-xl">
          {MAIN_NAVIGATION.map((item) => {
            const hasSub = (item.subItems && item.subItems.length > 0) || (item.isMega && item.megaColumns && item.megaColumns.length > 0);
            const isExpanded = expandedMobileCategory === item.id;

            return (
              <div key={item.id} className="border-b border-slate-100 pb-3 last:border-none">
                <div className="flex items-center justify-between">
                  <Link
                    href={item.href || '#'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-bold text-slate-800 text-sm hover:text-[#0c4b39] flex items-center gap-2"
                  >
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-rose-500 text-white font-black rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                  {hasSub && (
                    <button
                      onClick={() => toggleMobileCategory(item.id)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180 text-[#0c4b39]' : ''}`} />
                    </button>
                  )}
                </div>

                {/* Sub items in mobile menu */}
                {hasSub && isExpanded && (
                  <div className="mt-2 pl-3 space-y-2 border-l-2 border-[#0c4b39]/20">
                    {item.isMega && item.megaColumns ? (
                      item.megaColumns.map((col, cIdx) => (
                        <div key={cIdx} className="space-y-1.5 py-1">
                          <span className="text-[11px] font-extrabold text-[#0c4b39] uppercase tracking-wider block">
                            {col.categoryTitle}
                          </span>
                          {col.items.map((sub, sIdx) => (
                            <Link
                              key={sIdx}
                              href={sub.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-2 text-xs font-semibold text-slate-600 py-1 hover:text-[#0c4b39]"
                            >
                              {renderIcon(sub.iconName)}
                              <span>{sub.title}</span>
                            </Link>
                          ))}
                        </div>
                      ))
                    ) : (
                      item.subItems?.map((sub, sIdx) => (
                        <Link
                          key={sIdx}
                          href={sub.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 text-xs font-semibold text-slate-600 py-1 hover:text-[#0c4b39]"
                        >
                          {renderIcon(sub.iconName)}
                          <span>{sub.title}</span>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </header>
  );
}
