'use client';

import React from 'react';
import { Users, UserCheck, UserX, UserPlus, TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

interface UserStatsProps {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  newUsersThisMonth: number;
  isLight?: boolean;
}

const sparklineData = [
  { val: 12 },
  { val: 18 },
  { val: 15 },
  { val: 24 },
  { val: 28 },
  { val: 32 },
  { val: 40 },
];

export const UserStatsCards: React.FC<UserStatsProps> = ({
  totalUsers = 1248,
  activeUsers = 1180,
  lockedUsers = 24,
  newUsersThisMonth = 156,
}) => {
  const stats = [
    {
      id: 'total',
      title: 'TỔNG SỐ NGƯỜI DÙNG',
      value: totalUsers.toLocaleString('vi-VN'),
      change: '+14.2%',
      isPositive: true,
      subtext: 'so với tháng trước',
      icon: Users,
      color: '#0F172A',
      bgColor: 'bg-slate-100 text-slate-950 border border-slate-300',
    },
    {
      id: 'active',
      title: 'ĐANG HOẠT ĐỘNG',
      value: activeUsers.toLocaleString('vi-VN'),
      change: '+9.8%',
      isPositive: true,
      subtext: '94.5% tổng tài khoản',
      icon: UserCheck,
      color: '#059669',
      bgColor: 'bg-emerald-100 text-emerald-950 border border-emerald-300',
    },
    {
      id: 'locked',
      title: 'NGƯỜI DÙNG BỊ KHÓA',
      value: lockedUsers.toLocaleString('vi-VN'),
      change: '-2.1%',
      isPositive: false,
      subtext: 'vi phạm chính sách',
      icon: UserX,
      color: '#E11D48',
      bgColor: 'bg-rose-100 text-rose-950 border border-rose-300',
    },
    {
      id: 'new',
      title: 'ĐĂNG KÝ MỚI THÁNG NÀY',
      value: newUsersThisMonth.toLocaleString('vi-VN'),
      change: '+22.5%',
      isPositive: true,
      subtext: 'tháng này',
      icon: UserPlus,
      color: '#D97706',
      bgColor: 'bg-amber-100 text-amber-950 border border-amber-300',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={stat.id}
            className="p-5 rounded-xl border border-slate-300 bg-white text-slate-950 shadow-xs"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-950">
                {stat.title}
              </span>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <IconComponent className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-end justify-between gap-3 mt-1">
              <div>
                <div className="text-2xl font-black tracking-tight text-slate-950">
                  {stat.value}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span
                    className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded ${
                      stat.isPositive
                        ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                        : 'bg-rose-100 text-rose-950 border border-rose-300'
                    }`}
                  >
                    {stat.isPositive ? (
                      <TrendingUp className="w-3 h-3 mr-0.5 text-emerald-700" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-0.5 text-rose-700" />
                    )}
                    {stat.change}
                  </span>
                  <span className="text-xs font-semibold text-slate-900">
                    {stat.subtext}
                  </span>
                </div>
              </div>

              <div className="w-16 h-9 opacity-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData}>
                    <Area
                      type="monotone"
                      dataKey="val"
                      stroke={stat.color}
                      strokeWidth={2}
                      fillOpacity={0.15}
                      fill={stat.color}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
