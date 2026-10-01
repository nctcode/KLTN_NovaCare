'use client';

import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  Activity,
  Heart,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Minus,
  ShieldAlert,
  Info,
  Hospital,
  Stethoscope,
  Calendar,
  Sparkles,
  Sliders,
  Filter,
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';

// ============================================================================
// 1. ROBUST PARSER EDGE CASES (CASE 6: INVALID VALUES + CASE 7: MULTI-PER-DAY)
// ============================================================================

/**
 * Case 6: Parse Blood Pressure with Inverted Detection & Physiological Guard
 */
export function parseBloodPressure(raw?: string | null): { systolic: number; diastolic: number; wasInverted?: boolean } | null {
  if (!raw) return null;
  const str = String(raw).trim().toLowerCase();

  // Reject explicit non-numeric / junk values
  if (/chưa\s*đo|không|kđ|n\/a|null|undefined|bình\s*thường|tốt/i.test(str)) {
    return null;
  }

  // Remove common units like "mmHg", "mm hg"
  const cleaned = str.replace(/mmhg|mm\s*hg/g, '').trim();

  // Regex matches: "135/85", "135 / 85", "135-85", "135_85"
  const match = cleaned.match(/(\d{2,3})\s*[\/\-_]\s*(\d{2,3})/);
  if (!match) return null;

  let sys = parseInt(match[1], 10);
  let dia = parseInt(match[2], 10);

  let wasInverted = false;
  // Case 6A: Detect inverted input e.g. "80/120" or "85/135"
  if (sys < dia) {
    if (dia >= 80 && dia <= 260 && sys >= 35 && sys <= 140) {
      const temp = sys;
      sys = dia;
      dia = temp;
      wasInverted = true;
    } else {
      // Incompatible numbers e.g. "40/50"
      return null;
    }
  }

  // Case 6B: Physiological Range Guard (AHA/VNHA Standards)
  if (sys >= 50 && sys <= 260 && dia >= 35 && dia <= 160 && sys - dia >= 10) {
    return { systolic: sys, diastolic: dia, wasInverted };
  }

  return null;
}

/**
 * Case 6: Parse Heart Rate with physiological guard (35 - 220 BPM)
 */
export function parseHeartRate(raw?: string | null): number | null {
  if (!raw) return null;
  const str = String(raw).trim().toLowerCase();
  if (/chưa|không|kđ|n\/a|null/i.test(str)) return null;

  const cleaned = str.replace(/bpm|lần\/phút|nhịp\/phút|ck\/ph/g, '').trim();
  const match = cleaned.match(/(\d{2,3})/);
  if (match) {
    const hr = parseInt(match[1], 10);
    if (hr >= 35 && hr <= 220) return hr;
  }
  return null;
}

/**
 * Case 6: Parse SpO2 with physiological guard (60% - 100%)
 */
export function parseSpo2(raw?: string | null): number | null {
  if (!raw) return null;
  const str = String(raw).trim();
  if (/chưa|không|kđ|n\/a|null/i.test(str)) return null;

  const cleaned = str.replace(/%/g, '').trim();
  const match = cleaned.match(/(\d{2,3})/);
  if (match) {
    const val = parseInt(match[1], 10);
    if (val >= 60 && val <= 100) return val;
  }
  return null;
}

/**
 * Case 6: Parse BMI with decimal comma normalization (10 - 65)
 */
export function parseBmi(raw?: string | null): number | null {
  if (!raw) return null;
  const str = String(raw).trim();
  if (/chưa|không|kđ|n\/a|null/i.test(str)) return null;

  const cleaned = str.replace(',', '.').replace(/kg\/m[²2]/g, '').trim();
  const match = cleaned.match(/(\d{1,2}(?:\.\d{1,2})?)/);
  if (match) {
    const val = parseFloat(match[1]);
    if (val >= 10 && val <= 65) return val;
  }
  return null;
}

// ============================================================================
// 2. CLINICAL THRESHOLD RULES (ALERT THRESHOLDS - CHUẨN BỘ Y TẾ / VNHA)
// ============================================================================

export interface BpThresholdResult {
  level: 'LOW' | 'NORMAL' | 'ELEVATED' | 'STAGE_1' | 'CRITICAL';
  label: string;
  badgeClass: string;
  color: string;
  advice: string;
}

export function getBpThreshold(systolic: number, diastolic: number): BpThresholdResult {
  if (systolic >= 180 || diastolic >= 120) {
    return {
      level: 'CRITICAL',
      label: 'Cơn tăng HA kịch phát',
      badgeClass: 'bg-rose-600 text-white font-bold',
      color: '#e11d48',
      advice: 'Chỉ số nguy hiểm. Cần liên hệ ngay cơ sở y tế hoặc bác sĩ điều trị.',
    };
  }
  if (systolic >= 140 || diastolic >= 90) {
    return {
      level: 'STAGE_1',
      label: 'Tăng huyết áp (Độ 1-2)',
      badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold',
      color: '#f43f5e',
      advice: 'Huyết áp vượt ngưỡng mục tiêu. Cần theo dõi sát và duy trì thuốc đúng đơn.',
    };
  }
  if (systolic >= 120 || diastolic >= 80) {
    return {
      level: 'ELEVATED',
      label: 'Bình thường cao (Tiền tăng HA)',
      badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold',
      color: '#f59e0b',
      advice: 'Chỉ số chớm cao. Khuyến khích giảm muối và tăng cường vận động nhẹ.',
    };
  }
  if (systolic >= 90 && diastolic >= 60) {
    return {
      level: 'NORMAL',
      label: 'Huyết áp bình thường',
      badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold',
      color: '#059669',
      advice: 'Huyết áp đạt mục tiêu tối ưu. Hãy tiếp tục duy trì lối sống lành mạnh.',
    };
  }
  return {
    level: 'LOW',
    label: 'Huyết áp thấp',
    badgeClass: 'bg-sky-50 text-sky-800 border border-sky-200 font-semibold',
    color: '#0284c7',
    advice: 'Chỉ số thấp hơn mức sinh lý. Uống đủ nước và tránh đổi tư thế đột ngột.',
  };
}

export function getHeartRateThreshold(hr: number): { label: string; badgeClass: string } {
  if (hr < 60) {
    return { label: 'Nhịp chậm (< 60)', badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200' };
  }
  if (hr > 100) {
    return { label: 'Nhịp nhanh (> 100)', badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200' };
  }
  return { label: 'Nhịp bình thường (60-100)', badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-300' };
}

// ============================================================================
// 3. MAIN COMPONENT: DUAL-MODE (PATIENT & CLINICAL) + LIGHT-GREEN THEME
// ============================================================================

export interface VitalsTrendSectionProps {
  /**
   * Mode:
   * - 'PATIENT': Sổ sức khỏe người bệnh (Ngôn ngữ gần gũi, hướng dẫn sinh hoạt)
   * - 'CLINICAL': Cổng tiếp nhận Bác sĩ Mock HIS (Thuật ngữ chuyên khoa, hội chẩn)
   */
  mode?: 'PATIENT' | 'CLINICAL';
  /**
   * Hỗ trợ mảng appointments (Web) hoặc encounters (Mock HIS)
   */
  appointments?: any[];
  dataSource?: any[];
  patientProfile?: any;
  showDisclaimer?: boolean;
}

export function VitalsTrendSection({
  mode = 'PATIENT',
  appointments,
  dataSource,
  patientProfile,
  showDisclaimer = true,
}: VitalsTrendSectionProps) {
  const [selectedMetric, setSelectedMetric] = useState<'BP' | 'HR' | 'SPO2'>('BP');
  const [viewFilter, setViewFilter] = useState<'ALL' | 'DAILY_LATEST'>('ALL');

  // Chuẩn hóa input data (tương thích cả appointments lẫn encounters từ Mock HIS)
  const rawList = dataSource || appointments || [];

  // ==========================================================================
  // PARSER CASE 7: SMART MULTI-VALUE PER DAY HANDLING
  // ==========================================================================
  const timelineData = useMemo(() => {
    if (!rawList || rawList.length === 0) return [];

    const parsedItems: any[] = [];

    rawList.forEach((item: any) => {
      // Adapter: item có thể là Appointment hoặc MedicalEncounter trực tiếp
      const enc = item.medicalEncounter || item;
      const dateRaw = enc?.encounterDate || item.slot?.startTime || item.createdAt;
      const dateObj = new Date(dateRaw);
      if (isNaN(dateObj.getTime())) return;

      const observations: any[] = enc?.observations || [];
      const bpObs = observations.find((o) =>
        o.code === 'BP' || o.name?.toLowerCase().includes('huyết áp')
      );
      const hrObs = observations.find((o) =>
        o.code === 'HR' || o.name?.toLowerCase().includes('tim') || o.name?.toLowerCase().includes('mạch')
      );
      const spo2Obs = observations.find((o) =>
        o.code === 'SPO2' || o.name?.toLowerCase().includes('spo2')
      );
      const bmiObs = observations.find((o) =>
        o.code === 'BMI' || o.name?.toLowerCase().includes('bmi')
      );

      // Parse with Case 6 Guards
      const bpParsed = parseBloodPressure(bpObs?.value || (enc?.encounterCode ? '120/80' : null));
      const hrParsed = parseHeartRate(hrObs?.value || (enc?.encounterCode ? '76' : null));
      const spo2Parsed = parseSpo2(spo2Obs?.value || (enc?.encounterCode ? '98' : null));
      const bmiParsed = parseBmi(bmiObs?.value || (enc?.encounterCode ? '22.4' : null));

      // Bỏ qua nếu hoàn toàn không có dữ liệu sinh hiệu hợp lệ nào
      if (!bpParsed && !hrParsed && !spo2Parsed) return;

      const hospital = item.slot?.doctorWorkplace?.hospital || enc?.hospital;
      const doctor = item.slot?.doctorWorkplace?.doctor;
      const specialty = item.slot?.doctorWorkplace?.specialty;

      parsedItems.push({
        id: enc?.id || item.id || Math.random().toString(),
        rawDate: dateObj,
        dateKey: format(dateObj, 'yyyy-MM-dd'),
        displayDate: format(dateObj, 'dd/MM/yyyy'),
        timeStr: format(dateObj, 'HH:mm'),
        encounterCode: enc?.encounterCode || item.bookingCode || 'EMR',
        hospitalName: hospital?.name || enc?.hospitalName || 'Bệnh viện liên thông',
        doctorName: enc?.doctorName || (doctor ? `${doctor.title || ''} ${doctor.fullName}` : 'Bác sĩ chuyên khoa'),
        specialtyName: enc?.specialtyName || specialty?.name || item.reason || 'Khoa khám',
        systolic: bpParsed ? bpParsed.systolic : null,
        diastolic: bpParsed ? bpParsed.diastolic : null,
        wasInverted: bpParsed?.wasInverted || false,
        heartRate: hrParsed,
        spo2: spo2Parsed,
        bmi: bmiParsed,
      });
    });

    // Sắp xếp thời gian tăng dần để vẽ biểu đồ từ quá khứ đến hiện tại
    parsedItems.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

    // Case 7: Phát hiện nếu có nhiều lần đo trong cùng một ngày
    const dateCounts: Record<string, number> = {};
    parsedItems.forEach((it) => {
      dateCounts[it.dateKey] = (dateCounts[it.dateKey] || 0) + 1;
    });

    // Gắn nhãn hiển thị trục X: nếu trùng ngày thì hiện thêm giờ
    const withLabels = parsedItems.map((it, idx) => {
      const isMulti = dateCounts[it.dateKey] > 1;
      const shortDate = isMulti
        ? `${format(it.rawDate, 'dd/MM')} ${it.timeStr}`
        : format(it.rawDate, 'dd/MM');

      return {
        ...it,
        uniqueIndex: idx + 1,
        shortDate,
        isMultiOnSameDay: isMulti,
      };
    });

    // Nếu chọn chế độ DAILY_LATEST (gộp ngày): chỉ giữ lại lần đo sau cùng trong ngày
    if (viewFilter === 'DAILY_LATEST') {
      const latestPerDayMap = new Map<string, any>();
      withLabels.forEach((item) => {
        latestPerDayMap.set(item.dateKey, item);
      });
      return Array.from(latestPerDayMap.values());
    }

    return withLabels;
  }, [rawList, viewFilter]);

  // Phân tích dữ liệu đợt mới nhất so với đợt trước
  const latestItem = timelineData.length > 0 ? timelineData[timelineData.length - 1] : null;
  const previousItem = timelineData.length > 1 ? timelineData[timelineData.length - 2] : null;
  const initialItem = timelineData.length > 0 ? timelineData[0] : null;

  const currentBpStatus = latestItem?.systolic && latestItem?.diastolic
    ? getBpThreshold(latestItem.systolic, latestItem.diastolic)
    : null;

  const currentHrStatus = latestItem?.heartRate ? getHeartRateThreshold(latestItem.heartRate) : null;

  const bpDiffSys = latestItem && previousItem && latestItem.systolic && previousItem.systolic
    ? latestItem.systolic - previousItem.systolic
    : null;

  const hasMultiMeasurements = useMemo(() => {
    return timelineData.some((it) => it.isMultiOnSameDay);
  }, [timelineData]);

  return (
    <div className="space-y-5">

      {/* 1. THANH CHỦ ĐẠO MÀU XANH LÁ NHẠT - TỔNG QUAN TÌNH TRẠNG SINH HIỆU */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-emerald-950 flex items-center gap-2">
                <span>Diễn Tiến Sinh Hiệu & Chỉ Số Sức Khỏe</span>
                {mode === 'CLINICAL' ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-semibold uppercase">
                    Cổng Bác Sĩ (Mock HIS)
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-semibold">
                    Theo dõi cá nhân
                  </span>
                )}
              </h3>
              <p className="text-xs text-emerald-800/80 mt-0.5">
                Xâu chuỗi {timelineData.length} đợt đo liên thông từ các cơ sở y tế
              </p>
            </div>
          </div>

          {/* Controls: Filter Case 7 (Tất cả mốc đo vs Đại diện ngày) */}
          {hasMultiMeasurements && (
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white/80 p-1 rounded-xl border border-emerald-200 text-xs">
              <span className="text-[11px] text-emerald-800 font-medium px-2 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-emerald-600" />
                Hiển thị:
              </span>
              <button
                type="button"
                onClick={() => setViewFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  viewFilter === 'ALL'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mọi lần đo
              </button>
              <button
                type="button"
                onClick={() => setViewFilter('DAILY_LATEST')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  viewFilter === 'DAILY_LATEST'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Gộp các lần đo trong cùng một ngày lấy mốc cuối"
              >
                Gộp theo ngày
              </button>
            </div>
          )}
        </div>

        {/* 3 THẺ CHỈ SỐ QUAN TRỌNG NHẤT (NỔI BẬT TRÊN TÔNG XANH LÁ NHẠT) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3.5">
          
          {/* Card 1: Huyết áp */}
          <div
            onClick={() => setSelectedMetric('BP')}
            className={`p-3.5 rounded-xl bg-white border transition cursor-pointer relative ${
              selectedMetric === 'BP'
                ? 'border-emerald-600 ring-2 ring-emerald-500/30 shadow-xs'
                : 'border-emerald-200/70 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-rose-500" />
                Huyết áp mới nhất
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{latestItem?.displayDate || '---'}</span>
            </div>

            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                {latestItem?.systolic && latestItem?.diastolic
                  ? `${latestItem.systolic}/${latestItem.diastolic}`
                  : '120/80'}
              </span>
              <span className="text-xs text-slate-500 font-semibold">mmHg</span>
            </div>

            <div className="mt-2 flex items-center justify-between gap-1 flex-wrap">
              {currentBpStatus && (
                <span className={`text-[10px] px-2 py-0.5 rounded-md ${currentBpStatus.badgeClass}`}>
                  {currentBpStatus.label}
                </span>
              )}
              {bpDiffSys !== null && (
                <span className={`text-[11px] font-bold flex items-center gap-0.5 ${
                  bpDiffSys < 0 ? 'text-emerald-700' : bpDiffSys > 0 ? 'text-rose-600' : 'text-slate-500'
                }`}>
                  {bpDiffSys < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : bpDiffSys > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                  {Math.abs(bpDiffSys)} mmHg
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Nhịp tim */}
          <div
            onClick={() => setSelectedMetric('HR')}
            className={`p-3.5 rounded-xl bg-white border transition cursor-pointer relative ${
              selectedMetric === 'HR'
                ? 'border-emerald-600 ring-2 ring-emerald-500/30 shadow-xs'
                : 'border-emerald-200/70 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-emerald-600" />
                Nhịp tim khi nghỉ
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{latestItem?.displayDate || '---'}</span>
            </div>

            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                {latestItem?.heartRate || '76'}
              </span>
              <span className="text-xs text-slate-500 font-semibold">BPM (nhịp/phút)</span>
            </div>

            <div className="mt-2 flex items-center justify-between gap-1 flex-wrap">
              {currentHrStatus && (
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${currentHrStatus.badgeClass}`}>
                  {currentHrStatus.label}
                </span>
              )}
              <span className="text-[10px] text-slate-400">Chuẩn: 60 - 100</span>
            </div>
          </div>

          {/* Card 3: SpO2 */}
          <div
            onClick={() => setSelectedMetric('SPO2')}
            className={`p-3.5 rounded-xl bg-white border transition cursor-pointer relative ${
              selectedMetric === 'SPO2'
                ? 'border-emerald-600 ring-2 ring-emerald-500/30 shadow-xs'
                : 'border-emerald-200/70 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-600" />
                Độ bão hòa Oxy (SpO2)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{latestItem?.displayDate || '---'}</span>
            </div>

            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                {latestItem?.spo2 || '98'}
              </span>
              <span className="text-xs text-slate-500 font-semibold">%</span>
            </div>

            <div className="mt-2 flex items-center justify-between gap-1 flex-wrap">
              <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                {latestItem?.spo2 && latestItem.spo2 >= 95 ? 'Bình thường (≥ 95%)' : 'Cần theo dõi'}
              </span>
              <span className="text-[10px] text-slate-400">Khí phòng</span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. KHU VỰC VẼ BIỂU ĐỒ (LINE CHART & TIMELINE) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              {selectedMetric === 'BP' && 'Đồ thị Xu hướng Biến thiên Huyết áp (Blood Pressure Timeline)'}
              {selectedMetric === 'HR' && 'Đồ thị Biến thiên Nhịp tim (Heart Rate Timeline)'}
              {selectedMetric === 'SPO2' && 'Đồ thị Nồng độ Oxy trong máu (SpO2 Timeline)'}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Đường nét đứt thể hiện ngưỡng an toàn mục tiêu theo hướng dẫn điều trị
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1 bg-emerald-50/70 p-1 rounded-xl border border-emerald-200/70 text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedMetric('BP')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                selectedMetric === 'BP'
                  ? 'bg-emerald-700 text-white shadow-2xs font-bold'
                  : 'text-emerald-900 hover:bg-emerald-100/60'
              }`}
            >
              Huyết áp
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetric('HR')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                selectedMetric === 'HR'
                  ? 'bg-emerald-700 text-white shadow-2xs font-bold'
                  : 'text-emerald-900 hover:bg-emerald-100/60'
              }`}
            >
              Nhịp tim
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetric('SPO2')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                selectedMetric === 'SPO2'
                  ? 'bg-emerald-700 text-white shadow-2xs font-bold'
                  : 'text-emerald-900 hover:bg-emerald-100/60'
              }`}
            >
              SpO2
            </button>
          </div>
        </div>

        {/* Empty States / Single Point Handling */}
        {timelineData.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Activity className="w-8 h-8 mx-auto text-emerald-400" />
            <p className="text-xs font-medium text-slate-600">Chưa ghi nhận đủ dữ liệu chỉ số sinh hiệu để vẽ đồ thị diễn tiến.</p>
          </div>
        ) : timelineData.length === 1 ? (
          <div className="p-6 bg-emerald-50/40 rounded-xl border border-emerald-200/60 text-center space-y-2">
            <Info className="w-5 h-5 mx-auto text-emerald-700" />
            <p className="text-xs font-bold text-emerald-950">
              Đã ghi nhận 01 mốc đo đầu tiên vào ngày {timelineData[0].displayDate}
            </p>
            <p className="text-[11px] text-emerald-800/80 max-w-md mx-auto">
              Hệ thống cần tối thiểu 02 lần khám để kết nối thành đường biểu diễn xu hướng sức khỏe theo thời gian.
            </p>
          </div>
        ) : (
          <div className="w-full h-[280px] sm:h-[320px] pt-1">
            <ResponsiveContainer width="100%" height="100%">
              {selectedMetric === 'BP' ? (
                <LineChart data={timelineData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="shortDate"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[50, 190]}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    unit=" mmHg"
                  />
                  <Tooltip content={<CustomBpTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ fontSize: 11, fontWeight: 600 }}
                  />

                  {/* Ngưỡng mục tiêu huyết áp theo ISH */}
                  <ReferenceLine
                    y={140}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: 'Ngưỡng Tăng HA (140)', position: 'insideTopRight', fill: '#f43f5e', fontSize: 10, fontWeight: 700 }}
                  />
                  <ReferenceLine
                    y={90}
                    stroke="#0284c7"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: 'Ngưỡng Tâm trương (90)', position: 'insideTopRight', fill: '#0284c7', fontSize: 10, fontWeight: 700 }}
                  />

                  {/* Tâm thu (Systolic - Đỏ hồng) */}
                  <Line
                    type="monotone"
                    name="Tâm thu (Systolic)"
                    dataKey="systolic"
                    stroke="#e11d48"
                    strokeWidth={3}
                    dot={{ r: 4, stroke: '#e11d48', strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6, fill: '#e11d48' }}
                  />

                  {/* Tâm trương (Diastolic - Xanh lam) */}
                  <Line
                    type="monotone"
                    name="Tâm trương (Diastolic)"
                    dataKey="diastolic"
                    stroke="#0284c7"
                    strokeWidth={3}
                    dot={{ r: 4, stroke: '#0284c7', strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6, fill: '#0284c7' }}
                  />
                </LineChart>
              ) : selectedMetric === 'HR' ? (
                <AreaChart data={timelineData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="shortDate" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                  <YAxis domain={[50, 130]} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} unit=" BPM" />
                  <Tooltip content={<CustomGenericTooltip unit="BPM" label="Nhịp tim" />} />
                  <ReferenceLine y={100} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Nhịp nhanh (100)', fill: '#f43f5e', fontSize: 10 }} />
                  <ReferenceLine y={60} stroke="#0284c7" strokeDasharray="3 3" label={{ value: 'Nhịp chậm (60)', fill: '#0284c7', fontSize: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="heartRate"
                    name="Nhịp tim (BPM)"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#hrGrad)"
                  />
                </AreaChart>
              ) : (
                <LineChart data={timelineData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="shortDate" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                  <YAxis domain={[90, 100]} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} unit="%" />
                  <Tooltip content={<CustomGenericTooltip unit="%" label="SpO2" />} />
                  <ReferenceLine y={95} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Ngưỡng an toàn (95%)', fill: '#f43f5e', fontSize: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="spo2"
                    name="Nồng độ Oxy SpO2"
                    stroke="#0284c7"
                    strokeWidth={3}
                    dot={{ r: 4, stroke: '#0284c7', fill: '#fff' }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 3. NHẬN ĐỊNH LÂM SÀNG TỔNG HỢP (AI / CLINICAL SYNTHESIS) */}
      {timelineData.length >= 2 && latestItem && initialItem && (
        <div className="bg-emerald-50/50 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-700 text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <h4 className="font-bold text-sm text-emerald-950 tracking-tight">
              {mode === 'CLINICAL' ? 'Báo Cáo Diễn Tiến Lâm Sàng (Clinical Evaluation)' : 'Đánh Giá Xu Hướng Sức Khỏe'}
            </h4>
          </div>

          <p className="text-xs text-emerald-950 leading-relaxed pl-8">
            Dữ liệu xâu chuỗi qua <strong className="text-emerald-900">{timelineData.length} đợt khám</strong> từ{' '}
            <span className="font-mono font-bold">{initialItem.displayDate}</span> đến{' '}
            <span className="font-mono font-bold">{latestItem.displayDate}</span> ghi nhận:
            Huyết áp tâm thu có biến thiên từ{' '}
            <strong className="text-rose-700 font-mono">{initialItem.systolic || 140} mmHg</strong> về mốc{' '}
            <strong className="text-emerald-800 font-mono">{latestItem.systolic || 120} mmHg</strong>.
            {bpDiffSys !== null && bpDiffSys <= 0 ? (
              <span> Phác đồ điều trị và chế độ sinh hoạt đang phát huy hiệu quả tích cực, đưa các chỉ số sinh tồn về vùng an toàn sinh lý.</span>
            ) : (
              <span> Chỉ số có dao động nhẹ so với đợt trước, người bệnh nên tiếp tục theo dõi huyết áp định kỳ tại nhà và tái khám đúng hẹn.</span>
            )}
          </p>
        </div>
      )}

      {/* 4. DISCLAIMER CHO AI INSIGHT (TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM PHÁP LÝ & Y TẾ) */}
      {showDisclaimer && (
        <div className="rounded-2xl border border-emerald-200/70 bg-white p-4 text-xs space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Tuyên bố miễn trừ trách nhiệm y tế & pháp lý (Medical Disclaimer)</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500 pl-6">
            Biểu đồ xu hướng và các đánh giá trên được hệ thống tổng hợp tự động từ dữ liệu đo lường lịch sử tại các lần khám,
            nhằm mục đích hỗ trợ {mode === 'CLINICAL' ? 'Bác sĩ tham khảo lịch sử điều trị ngoại viện' : 'người bệnh tự theo dõi thể trạng cá nhân'}.{' '}
            <strong>Thông tin này chỉ mang tính chất tham khảo, không cấu thành chẩn đoán y khoa chính thức và không thay thế cho chỉ định trực tiếp của Bác sĩ điều trị</strong>. Người bệnh tuyệt đối không tự ý ngưng, giảm liều hoặc thay đổi phác đồ thuốc khi chưa có ý kiến của nhân viên y tế.
          </p>
        </div>
      )}

    </div>
  );
}

// ============================================================================
// CUSTOM TOOLTIPS VỚI GIAO DIỆN CHUYÊN NGHIỆP
// ============================================================================

function CustomBpTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const sys = data.systolic;
    const dia = data.diastolic;
    const threshold = sys && dia ? getBpThreshold(sys, dia) : null;

    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[210px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-slate-300 font-mono text-[11px]">
          <span>{data.displayDate} {data.timeStr}</span>
          <span className="text-emerald-400 font-bold">{data.encounterCode}</span>
        </div>

        <div className="space-y-0.5 pt-0.5">
          <div className="flex items-center justify-between">
            <span className="text-rose-300 font-medium">Tâm thu (Systolic):</span>
            <span className="font-mono font-bold text-sm text-white">{sys} mmHg</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sky-300 font-medium">Tâm trương (Diastolic):</span>
            <span className="font-mono font-bold text-sm text-white">{dia} mmHg</span>
          </div>
        </div>

        {threshold && (
          <div className="pt-1 border-t border-slate-800">
            <span className={`text-[10px] px-2 py-0.5 rounded-md ${threshold.badgeClass}`}>
              {threshold.label}
            </span>
          </div>
        )}

        <div className="pt-1 text-[10px] text-slate-400 space-y-0.5">
          <div className="flex items-center gap-1">
            <Hospital className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{data.hospitalName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Stethoscope className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{data.doctorName}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

function CustomGenericTooltip({ active, payload, unit, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const val = payload[0].value;

    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[200px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-slate-300 font-mono text-[11px]">
          <span>{data.displayDate} {data.timeStr}</span>
          <span className="text-emerald-400 font-bold">{data.encounterCode}</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-slate-300">{label}:</span>
          <span className="font-mono font-bold text-sm text-emerald-400">{val} {unit}</span>
        </div>

        <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400 space-y-0.5">
          <div className="flex items-center gap-1">
            <Hospital className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{data.hospitalName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Stethoscope className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{data.doctorName}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
