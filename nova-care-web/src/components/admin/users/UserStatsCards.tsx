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
      bgColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    },
    {
      id: 'active',
      title: 'Đang hoạt động',
      value: activeUsers.toLocaleString('vi-VN'),
      change: '+9.8%',
      isPositive: true,
      subtext: 'tổng tài khoản',
      icon: UserCheck,
      color: '#059669',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    },
    {
      id: 'locked',
      title: 'Người dùng bị khóa',
      value: lockedUsers.toLocaleString('vi-VN'),
      change: '-2.1%',
      isPositive: false,
      subtext: 'vi phạm chính sách',
      icon: UserX,
      color: '#E11D48',
      bgColor: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400',
    },
    {
      id: 'new',
      title: 'Đăng ký mới tháng này',
      value: newUsersThisMonth.toLocaleString('vi-VN'),
      change: '+22.5%',
      isPositive: true,
      subtext: 'tháng này',
      icon: UserPlus,
      color: '#D97706',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={stat.id}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {stat.title}
              </span>
              <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                <IconComponent className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-end justify-between gap-3 mt-1">
              <div>
                <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span
                    className={`inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded ${
                      stat.isPositive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {stat.isPositive ? (
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-0.5" />
                    )}
                    {stat.change}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
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
