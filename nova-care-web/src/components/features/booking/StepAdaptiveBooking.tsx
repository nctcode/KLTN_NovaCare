'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { doctorService } from '@/services/doctor.service';
import { hospitalService } from '@/services/hospital.service';
import { specialtyService } from '@/services/specialty.service';
import { useBookingStore } from '@/stores/booking.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PreExamScreening } from './PreExamScreening';
import { AIHealthAssessmentWizard } from './AIHealthAssessmentWizard';
import { toast } from 'sonner';
import {
  Stethoscope,
  Building2,
  Activity,
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Star,
  MapPin,
  Loader2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Users,
  X,
  RotateCcw,
  Zap,
  Navigation,
  Bot,
  BrainCircuit,
  Compass,
  UserCheck,
  UserPlus,
  ArrowRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { formatPrice, getDoctorSpecialtyName } from '@/lib/utils';
import { Doctor, Hospital, Specialty } from '@/types';

interface StepAdaptiveBookingProps {
  onNext: () => void;
}

// Popular symptoms & specialty recommendations mapping
const POPULAR_SYMPTOMS = [
  { id: 'tieu-hoa', label: 'Đau bụng, tiêu hóa', icon: '🩺', keywords: ['đau bụng', 'tiêu hóa', 'dạ dày', 'trào ngược', 'đầy hơi', 'nôn'], specialtyName: 'Nội tiêu hóa' },
  { id: 'da-lieu', label: 'Da liễu, mẩn ngứa, mụn', icon: '🧴', keywords: ['da', 'ngứa', 'mụn', 'dị ứng', 'mẩn đỏ', 'nấm'], specialtyName: 'Da liễu' },
  { id: 'tim-mach', label: 'Tim mạch, huyết áp', icon: '🫀', keywords: ['tim', 'huyết áp', 'tăng xông', 'táo bón', 'đau ngực', 'khó thở'], specialtyName: 'Tim mạch' },
  { id: 'tai-mui-hong', label: 'Tai mũi họng, ho, sốt', icon: '👂', keywords: ['ho', 'sốt', 'họng', 'tai', 'mũi', 'amidan', 'viêm họng'], specialtyName: 'Tai Mũi Họng' },
  { id: 'xuong-khop', label: 'Cơ xương khớp, đau lưng', icon: '🦴', keywords: ['xương', 'khớp', 'đau lưng', 'gối', 'cột sống', 'vai gáy'], specialtyName: 'Cơ Xương Khớp' },
  { id: 'mat', label: 'Mắt, cận thị, cận kém', icon: '👁️', keywords: ['mắt', 'cận thị', 'đau mắt', 'mờ', 'viêm mắt'], specialtyName: 'Mắt' },
  { id: 'than-kinh', label: 'Đau đầu, mất ngủ', icon: '🧠', keywords: ['đau đầu', 'chóng mặt', 'mất ngủ', 'thần kinh', 'tê tay'], specialtyName: 'Thần kinh' },
  { id: 'tong-quat', label: 'Khám sức khỏe tổng quát', icon: '📋', keywords: ['tổng quát', 'tầm soát', 'định kỳ', 'sức khỏe'], specialtyName: 'Nội tổng quát' },
];

// Helper to calculate Haversine distance in km
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Custom Searchable Select Modal Component (Full Dialog Modal Display)
 */
interface SearchableSelectModalProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  options: { id: string; name: string; subtext?: string; icon?: string }[];
  placeholder: string;
  isKnown: boolean;
  clearLabel?: string;
}

function SearchableSelectModal({
  label,
  icon,
  value,
  onChange,
  options,
  placeholder,
  isKnown,
  clearLabel = 'Tôi chưa biết / Bỏ chọn',
}: SearchableSelectModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  const selectedItem = options.find((o) => o.id === value);

  const filteredOptions = useMemo(() => {
    if (!filterQuery.trim()) return options;
    const q = filterQuery.toLowerCase();
    return options.filter(
      (o) => o.name.toLowerCase().includes(q) || (o.subtext && o.subtext.toLowerCase().includes(q))
    );
  }, [options, filterQuery]);

  return (
    <>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            {icon}
            {label}
          </span>
          {isKnown && <CheckCircle2 className="w-3.5 h-3.5 text-[#4caf50]" />}
        </label>

        <button
          type="button"
          onClick={() => {
            setFilterQuery('');
            setIsOpen(true);
          }}
          className={`w-full flex items-center justify-between px-3.5 h-12 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-left ${isKnown
              ? 'border-2 border-[#4caf50] bg-emerald-50/50 text-secondary shadow-2xs'
              : 'border border-gray-200 bg-gray-50/60 text-gray-600 hover:border-emerald-300 hover:bg-white'
            }`}
        >
          <div className="flex items-center gap-2 truncate pr-2">
            {selectedItem?.icon && <span>{selectedItem.icon}</span>}
            <span className={`truncate ${isKnown ? 'font-extrabold text-[#0c4b39]' : 'text-gray-500 font-medium'}`}>
              {selectedItem ? selectedItem.name : placeholder}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isKnown && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('all');
                }}
                className="p-1 hover:bg-emerald-200/50 rounded-full text-emerald-700"
                title="Xóa lựa chọn"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </button>
      </div>

      {/* MODAL SELECTION DIALOG */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg w-[92vw] sm:w-full rounded-3xl p-5 md:p-6 bg-white shadow-2xl border-none space-y-4">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-base font-extrabold text-secondary flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-[#0c4b39]">{icon}</div>
              <span>{label}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Chọn từ danh sách bên dưới hoặc gõ để tìm kiếm nhanh
            </DialogDescription>
          </DialogHeader>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              autoFocus
              placeholder="Gõ từ khóa để tìm nhanh..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="pl-10 pr-9 text-sm h-11 rounded-2xl border-gray-200 bg-gray-50 focus-visible:ring-0 focus-visible:border-[#4caf50]"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Options Count */}
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
            <span>Danh sách lựa chọn</span>
            <Badge variant="outline" className="text-[10px] font-bold">
              {filteredOptions.length} / {options.length}
            </Badge>
          </div>

          {/* Scrollable Options List */}
          <div className="overflow-y-auto max-h-[50vh] pr-1 space-y-2">
            {/* Clear option */}
            <button
              type="button"
              onClick={() => {
                onChange('all');
                setIsOpen(false);
              }}
              className={`w-full text-left p-3 rounded-2xl text-xs font-semibold flex items-center justify-between transition-all border cursor-pointer ${value === 'all'
                  ? 'border-[#4caf50] bg-emerald-50 text-[#0c4b39]'
                  : 'border-dashed border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
            >
              <span>-- {clearLabel} --</span>
              {value === 'all' && <CheckCircle2 className="w-4 h-4 text-[#4caf50]" />}
            </button>

            {filteredOptions.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs text-gray-400">Không tìm thấy dữ liệu phù hợp với từ khóa</p>
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl text-xs transition-all flex items-center justify-between gap-3 border cursor-pointer ${isSelected
                        ? 'border-2 border-[#4caf50] bg-emerald-50/70 text-secondary shadow-xs font-black'
                        : 'border-gray-100 bg-white hover:bg-emerald-50/30 hover:border-emerald-200'
                      }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {opt.icon && <span className="text-base">{opt.icon}</span>}
                        <p className="font-extrabold text-xs text-secondary truncate">{opt.name}</p>
                      </div>
                      {opt.subtext && (
                        <p className="text-[11px] text-gray-500 truncate font-medium">{opt.subtext}</p>
                      )}
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-[#4caf50] shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-gray-300 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function StepAdaptiveBooking({ onNext }: StepAdaptiveBookingProps) {
  const { bookingData, setBookingData } = useBookingStore();

  // Welcome modal state: Open on first load if no info prefilled
  const hasPrefilledData = Boolean(bookingData.hospitalId || bookingData.specialtyId || bookingData.doctorId);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(!hasPrefilledData);

  // Active Tab Mode: 'ai-beginner' vs 'search-filter'
  const [activeTabMode, setActiveTabMode] = useState<'ai-beginner' | 'search-filter'>(
    hasPrefilledData ? 'search-filter' : 'ai-beginner'
  );
  const [showFullWizard, setShowFullWizard] = useState<boolean>(false);

  // Real GPS Geolocation State
  const [patientLocation, setPatientLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState<boolean>(false);
  const [locationStatusMsg, setLocationStatusMsg] = useState<string | null>(null);

  // Symptom AI state for beginner mode (Starts EMPTY until user interacts!)
  const [symptomInput, setSymptomInput] = useState<string>(bookingData.symptoms || bookingData.reason || '');
  const [selectedSymptomTag, setSelectedSymptomTag] = useState<string | null>(null);

  // Local state for 3 combobox values
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(bookingData.hospitalId || 'all');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>(bookingData.specialtyId || 'all');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(bookingData.doctorId || 'all');

  // Omni Search Bar State
  const [omniQuery, setOmniQuery] = useState<string>('');
  const [isOmniOpen, setIsOmniOpen] = useState<boolean>(false);
  const omniRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (omniRef.current && !omniRef.current.contains(event.target as Node)) {
        setIsOmniOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // REAL GEOLOCATION HANDLER
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatusMsg('Trình duyệt không hỗ trợ vị trí GPS.');
      return;
    }
    setLocating(true);
    setLocationStatusMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPatientLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
        setLocationStatusMsg('📍 Đã định vị thành công vị trí GPS của bạn!');
      },
      () => {
        setLocating(false);
        // Fallback center of HCMC
        setPatientLocation({ lat: 10.7769, lng: 106.7009 });
        setLocationStatusMsg('Đã dùng tọa độ trung tâm TP.HCM làm mốc đo khoảng cách.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // REAL MASTER DATA FROM BACKEND DB VIA REACT QUERY
  const { data: rawHospitals } = useQuery({
    queryKey: ['hospitals-adaptive'],
    queryFn: hospitalService.getAll,
  });

  const { data: rawSpecialties } = useQuery({
    queryKey: ['specialties-adaptive'],
    queryFn: specialtyService.getAll,
  });

  const { data: rawDoctors, isLoading: loadingDoctors } = useQuery({
    queryKey: ['doctors-adaptive'],
    queryFn: () => doctorService.search({}),
  });

  const hospitals: Hospital[] = useMemo(() => {
    if (Array.isArray(rawHospitals)) return rawHospitals;
    return (rawHospitals as any)?.data || [];
  }, [rawHospitals]);

  const specialties: Specialty[] = useMemo(() => {
    if (Array.isArray(rawSpecialties)) return rawSpecialties;
    return (rawSpecialties as any)?.data || [];
  }, [rawSpecialties]);

  const doctors: Doctor[] = useMemo(() => {
    if (Array.isArray(rawDoctors)) return rawDoctors;
    return (rawDoctors as any)?.data || [];
  }, [rawDoctors]);

  // Sync Zustand store
  useEffect(() => {
    setBookingData({
      hospitalId: selectedHospitalId === 'all' ? null : selectedHospitalId,
      specialtyId: selectedSpecialtyId === 'all' ? null : selectedSpecialtyId,
      doctorId: selectedDoctorId === 'all' ? null : selectedDoctorId,
    });
  }, [selectedHospitalId, selectedSpecialtyId, selectedDoctorId, setBookingData]);

  // Sync back if store changes externally
  useEffect(() => {
    if (bookingData.hospitalId && bookingData.hospitalId !== selectedHospitalId) {
      setSelectedHospitalId(bookingData.hospitalId);
    }
    if (bookingData.specialtyId && bookingData.specialtyId !== selectedSpecialtyId) {
      setSelectedSpecialtyId(bookingData.specialtyId);
    }
    if (bookingData.doctorId && bookingData.doctorId !== selectedDoctorId) {
      setSelectedDoctorId(bookingData.doctorId);
    }
  }, [bookingData.hospitalId, bookingData.specialtyId, bookingData.doctorId]);

  // --- REAL AI RECOMMENDATION COMPUTATION (ONLY RUNS WHEN USER HAS ENTERED SYMPTOMS!) ---
  const userHasEnteredSymptom = Boolean(selectedSymptomTag || symptomInput.trim());

  const aiRecommendation = useMemo(() => {
    // DO NOT compute or display results if user hasn't entered anything yet!
    if (!userHasEnteredSymptom || !doctors.length || !hospitals.length || !specialties.length) {
      return null;
    }

    // 1. Determine target specialty from real database specialties
    let matchedSpec = specialties[0];
    if (selectedSymptomTag) {
      const symObj = POPULAR_SYMPTOMS.find((s) => s.id === selectedSymptomTag);
      if (symObj) {
        const found = specialties.find((s) =>
          s.name.toLowerCase().includes(symObj.specialtyName.toLowerCase())
        );
        if (found) matchedSpec = found;
      }
    } else if (symptomInput.trim()) {
      const lower = symptomInput.toLowerCase();
      const symObj = POPULAR_SYMPTOMS.find((s) => s.keywords.some((kw) => lower.includes(kw)));
      if (symObj) {
        const found = specialties.find((s) =>
          s.name.toLowerCase().includes(symObj.specialtyName.toLowerCase())
        );
        if (found) matchedSpec = found;
      }
    }

    // 2. Filter real doctors from backend DB matching specialty & calculate distance to real hospitals
    const scoredDoctors = doctors.map((doc) => {
      const wp = doc.workPlaces?.[0];
      const hosp = hospitals.find((h) => h.id === wp?.hospitalId) || hospitals[0];

      let distance = 3.5;
      if (patientLocation && hosp?.latitude && hosp?.longitude) {
        distance = calculateHaversineDistance(
          patientLocation.lat,
          patientLocation.lng,
          hosp.latitude,
          hosp.longitude
        );
      }

      const distanceScore = Math.max(0, 30 - distance * 2);
      const ratingScore = (doc.rating || 4.8) * 6;
      const isSpecMatch = doc.workPlaces?.some((w) => w.specialtyId === matchedSpec.id);
      const specScore = isSpecMatch ? 40 : 10;
      const totalScore = Math.round(distanceScore + ratingScore + specScore);

      return {
        doctor: doc,
        hospital: hosp,
        specialty: matchedSpec,
        workplace: wp,
        distance,
        score: totalScore,
      };
    });

    scoredDoctors.sort((a, b) => b.score - a.score);

    return {
      suggestedSpecialty: matchedSpec,
      bestMatch: scoredDoctors[0],
      runnerUp: scoredDoctors[1] || scoredDoctors[0],
    };
  }, [userHasEnteredSymptom, doctors, hospitals, specialties, selectedSymptomTag, symptomInput, patientLocation]);

  // --- Dynamic Options Filtering for Filter Tab ---
  const hospitalOptions = useMemo(() => {
    let list = hospitals;
    if (selectedSpecialtyId !== 'all') {
      const hospIds = new Set<string>();
      doctors.forEach((doc) => {
        doc.workPlaces?.forEach((wp) => {
          if (wp.specialtyId === selectedSpecialtyId) hospIds.add(wp.hospitalId);
        });
      });
      if (hospIds.size > 0) {
        const filtered = list.filter((h) => hospIds.has(h.id));
        if (filtered.length > 0) list = filtered;
      }
    }
    if (selectedDoctorId !== 'all') {
      const doc = doctors.find((d) => d.id === selectedDoctorId);
      if (doc?.workPlaces?.length) {
        const hospIds = new Set(doc.workPlaces.map((wp) => wp.hospitalId));
        const filtered = list.filter((h) => hospIds.has(h.id));
        if (filtered.length > 0) list = filtered;
      }
    }
    if (!list || list.length === 0) list = hospitals;

    return list.map((h) => ({
      id: h.id,
      name: h.name,
      subtext: h.address,
    }));
  }, [hospitals, doctors, selectedSpecialtyId, selectedDoctorId]);

  const specialtyOptions = useMemo(() => {
    let list = specialties;
    if (selectedHospitalId !== 'all') {
      const specIds = new Set<string>();
      doctors.forEach((doc) => {
        doc.workPlaces?.forEach((wp) => {
          if (wp.hospitalId === selectedHospitalId) specIds.add(wp.specialtyId);
        });
      });
      if (specIds.size > 0) {
        const filtered = list.filter((s) => specIds.has(s.id));
        if (filtered.length > 0) list = filtered;
      }
    }
    if (selectedDoctorId !== 'all') {
      const doc = doctors.find((d) => d.id === selectedDoctorId);
      if (doc?.workPlaces?.length) {
        const specIds = new Set(doc.workPlaces.map((wp) => wp.specialtyId));
        const filtered = list.filter((s) => specIds.has(s.id));
        if (filtered.length > 0) list = filtered;
      }
    }
    if (!list || list.length === 0) list = specialties;

    return list.map((s) => ({
      id: s.id,
      name: s.name,
      icon: s.icon || '🩺',
      subtext: s.description || 'Chuyên khoa uy tín',
    }));
  }, [specialties, doctors, selectedHospitalId, selectedDoctorId]);

  const doctorOptions = useMemo(() => {
    let list = doctors.filter((doc) => {
      if (!doc.workPlaces || doc.workPlaces.length === 0) return true;
      const matchHosp =
        selectedHospitalId === 'all' ||
        doc.workPlaces.some((wp) => wp.hospitalId === selectedHospitalId);
      const matchSpec =
        selectedSpecialtyId === 'all' ||
        doc.workPlaces.some((wp) => wp.specialtyId === selectedSpecialtyId);
      return matchHosp && matchSpec;
    });

    if (!list || list.length === 0) list = doctors;

    return list.map((d) => {
      const specName = getDoctorSpecialtyName(d);
      return {
        id: d.id,
        name: d.fullName,
        subtext: `${d.qualification || 'Bác sĩ'} ${specName ? '• ' + specName : ''}`,
      };
    });
  }, [doctors, selectedHospitalId, selectedSpecialtyId]);

  // Selected Entities
  const selectedHospital = useMemo(
    () => hospitals.find((h) => h.id === selectedHospitalId),
    [hospitals, selectedHospitalId]
  );
  const selectedSpecialty = useMemo(
    () => specialties.find((s) => s.id === selectedSpecialtyId),
    [specialties, selectedSpecialtyId]
  );
  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === selectedDoctorId),
    [doctors, selectedDoctorId]
  );

  const resolvedWorkplace = useMemo(() => {
    if (!selectedDoctor || !selectedDoctor.workPlaces?.length) return null;
    if (selectedHospitalId !== 'all' && selectedSpecialtyId !== 'all') {
      return (
        selectedDoctor.workPlaces.find(
          (wp) => wp.hospitalId === selectedHospitalId && wp.specialtyId === selectedSpecialtyId
        ) || selectedDoctor.workPlaces[0]
      );
    }
    if (selectedHospitalId !== 'all') {
      return (
        selectedDoctor.workPlaces.find((wp) => wp.hospitalId === selectedHospitalId) ||
        selectedDoctor.workPlaces[0]
      );
    }
    if (selectedSpecialtyId !== 'all') {
      return (
        selectedDoctor.workPlaces.find((wp) => wp.specialtyId === selectedSpecialtyId) ||
        selectedDoctor.workPlaces[0]
      );
    }
    return selectedDoctor.workPlaces[0];
  }, [selectedDoctor, selectedHospitalId, selectedSpecialtyId]);

  const isCombinationValid = useMemo(() => {
    if (selectedDoctorId === 'all' || !selectedDoctor) return true;
    if (selectedHospitalId === 'all') return true;
    return selectedDoctor.workPlaces?.some((wp) => wp.hospitalId === selectedHospitalId);
  }, [selectedDoctor, selectedDoctorId, selectedHospitalId]);

  const isHospitalKnown = selectedHospitalId !== 'all';
  const isSpecialtyKnown = selectedSpecialtyId !== 'all';
  const isDoctorKnown = selectedDoctorId !== 'all';
  const knownCount = (isHospitalKnown ? 1 : 0) + (isSpecialtyKnown ? 1 : 0) + (isDoctorKnown ? 1 : 0);

  // --- Handlers ---
  const handleSelectDoctor = (docId: string) => {
    setSelectedDoctorId(docId);
    if (docId === 'all') return;
    const doc = doctors.find((d) => d.id === docId);
    if (doc?.workPlaces?.length) {
      const primaryWp = doc.workPlaces[0];
      if (selectedHospitalId === 'all') setSelectedHospitalId(primaryWp.hospitalId);
      if (selectedSpecialtyId === 'all') setSelectedSpecialtyId(primaryWp.specialtyId);
      setBookingData({
        doctorId: doc.id,
        doctorName: doc.fullName,
        hospitalId: primaryWp.hospitalId,
        specialtyId: primaryWp.specialtyId,
        workplaceId: primaryWp.id,
      });
    }
  };

  const handleSelectHospital = (hospId: string) => {
    setSelectedHospitalId(hospId);
    if (hospId === 'all') {
      setBookingData({ hospitalId: null });
      return;
    }
    if (selectedDoctorId !== 'all' && selectedDoctor) {
      const worksHere = selectedDoctor.workPlaces?.some((wp) => wp.hospitalId === hospId);
      if (!worksHere) {
        setSelectedDoctorId('all');
        setBookingData({ doctorId: null, doctorName: undefined });
      }
    }
  };

  const handleSelectSpecialty = (specId: string) => {
    setSelectedSpecialtyId(specId);
    if (specId === 'all') {
      setBookingData({ specialtyId: null });
      return;
    }
    if (selectedDoctorId !== 'all' && selectedDoctor) {
      const hasSpecialty = selectedDoctor.workPlaces?.some((wp) => wp.specialtyId === specId);
      if (!hasSpecialty) {
        setSelectedDoctorId('all');
        setBookingData({ doctorId: null, doctorName: undefined });
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedHospitalId('all');
    setSelectedSpecialtyId('all');
    setSelectedDoctorId('all');
    setOmniQuery('');
    setSelectedSymptomTag(null);
    setSymptomInput('');
    setBookingData({
      hospitalId: null,
      specialtyId: null,
      doctorId: null,
      workplaceId: null,
      doctorName: undefined,
      symptoms: '',
    });
  };

  const handleSelectAiRecommendation = (rec: any) => {
    if (!rec) return;
    setSelectedDoctorId(rec.doctor.id);
    setSelectedHospitalId(rec.hospital.id);
    setSelectedSpecialtyId(rec.specialty.id);
    setBookingData({
      doctorId: rec.doctor.id,
      doctorName: rec.doctor.fullName,
      hospitalId: rec.hospital.id,
      specialtyId: rec.specialty.id,
      workplaceId: rec.workplace?.id,
      reason: symptomInput || `AI Gợi ý theo chuyên khoa ${rec.specialty.name}`,
    });
    onNext();
  };

  // Omni Search Live Results
  const omniResults = useMemo(() => {
    if (!omniQuery.trim()) return null;
    const q = omniQuery.toLowerCase();

    const matchedDoctors = doctors.filter(
      (d) => d.fullName.toLowerCase().includes(q) || (d.qualification && d.qualification.toLowerCase().includes(q))
    ).slice(0, 4);

    const matchedSpecialties = specialties.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q))
    ).slice(0, 4);

    const matchedHospitals = hospitals.filter(
      (h) => h.name.toLowerCase().includes(q) || (h.address && h.address.toLowerCase().includes(q))
    ).slice(0, 4);

    return {
      doctors: matchedDoctors,
      specialties: matchedSpecialties,
      hospitals: matchedHospitals,
      totalCount: matchedDoctors.length + matchedSpecialties.length + matchedHospitals.length,
    };
  }, [omniQuery, doctors, specialties, hospitals]);

  const handleProceedToSchedule = () => {
    if (!selectedDoctorId || selectedDoctorId === 'all') return;
    if (!isCombinationValid) return;
    if (resolvedWorkplace) {
      setBookingData({
        doctorId: selectedDoctorId,
        doctorName: selectedDoctor?.fullName,
        hospitalId: resolvedWorkplace.hospitalId,
        specialtyId: resolvedWorkplace.specialtyId,
        workplaceId: resolvedWorkplace.id,
      });
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. INITIAL WELCOME SELECTION MODAL FOR BEGINNERS VS EXPERTS */}
      <Dialog open={isWelcomeModalOpen} onOpenChange={setIsWelcomeModalOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-6 border-0 shadow-2xl bg-white space-y-5">
          <DialogHeader className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#0c4b39] mx-auto flex items-center justify-center font-bold text-2xl shadow-inner">
              🏥
            </div>
            <DialogTitle className="text-xl md:text-2xl font-black text-secondary">
              Chào Mừng Bạn Đến Với NovaCare
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-gray-500 font-medium max-w-md mx-auto">
              Hãy chọn phương thức đặt khám phù hợp nhất với nhu cầu hiện tại của bạn
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* OPTION A: I AM A BEGINNER */}
            <div
              onClick={() => {
                setActiveTabMode('ai-beginner');
                setIsWelcomeModalOpen(false);
              }}
              className="group cursor-pointer p-5 rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 hover:border-[#4caf50] hover:shadow-xl transition-all duration-300 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-[#0c4b39] text-[#66FF33] flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <Badge className="bg-[#4caf50] text-white text-[10px] font-extrabold uppercase">
                    Khuyên Dùng
                  </Badge>
                </div>
                <h3 className="font-black text-secondary text-base group-hover:text-[#0c4b39] transition-colors">
                  Tôi là người mới — Chưa biết khám ở đâu
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  Sử dụng AI sàng lọc triệu chứng (nhịp tim PPG, giọng nói, hình ảnh, triệu chứng & vị trí GPS) để tự động đề xuất Bệnh viện & Bác sĩ phù hợp nhất.
                </p>
              </div>

              <Button className="w-full bg-[#0c4b39] group-hover:bg-[#083629] text-white font-extrabold rounded-2xl text-xs h-10 flex items-center justify-center gap-1.5 shadow-md">
                <span>✨ Nhờ AI Sàng Lọc & Gợi Ý</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* OPTION B: I KNOW WHAT I WANT */}
            <div
              onClick={() => {
                setActiveTabMode('search-filter');
                setIsWelcomeModalOpen(false);
              }}
              className="group cursor-pointer p-5 rounded-3xl border-2 border-gray-200 bg-white hover:border-gray-400 hover:shadow-xl transition-all duration-300 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="text-gray-500 border-gray-300 text-[10px] font-bold">
                    Tự Chọn
                  </Badge>
                </div>
                <h3 className="font-black text-secondary text-base group-hover:text-gray-900 transition-colors">
                  Tôi đã biết thông tin đặt khám
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                  Tôi đã biết Bệnh viện, Chuyên khoa hoặc Bác sĩ mong muốn. Cho tôi tự chọn và lọc thông tin theo 3 combobox.
                </p>
              </div>

              <Button variant="outline" className="w-full border-gray-300 text-gray-700 font-extrabold rounded-2xl text-xs h-10 flex items-center justify-center gap-1.5 hover:bg-gray-50">
                <span>🔍 Tự Lọc & Chọn Thông Tin</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. TOP TAB MODE SWITCHER */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTabMode('ai-beginner')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTabMode === 'ai-beginner'
              ? 'bg-[#0c4b39] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
        >
          <Bot className="w-4 h-4 text-emerald-400" />
          <span>🌟 Dành cho Người mới (AI Gợi ý Lịch & Cơ sở)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabMode('search-filter')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTabMode === 'search-filter'
              ? 'bg-[#0c4b39] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
        >
          <Search className="w-4 h-4 text-emerald-400" />
          <span>⚡ Tôi đã biết thông tin (Bộ lọc 3 Combobox)</span>
        </button>
      </div>

      {/* --- MODE 1: REAL AI SCREENING & SYMPTOM TRIAGE (DÀNH CHO NGƯỜI MỚI) --- */}
      {activeTabMode === 'ai-beginner' && (
        <div className="space-y-6">
          {/* Header Banner for AI Screening */}
          <div className="bg-gradient-to-r from-[#0c4b39] via-[#0f5440] to-emerald-900 text-white p-5 md:p-6 rounded-3xl shadow-xl space-y-3 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <Badge className="bg-[#66FF33] text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full mb-1">
                  100% Smartphone AI Triage
                </Badge>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  Chưa Biết Chọn Chuyên Khoa Nào Phù Hợp?
                </h2>
                <p className="text-xs text-emerald-100 font-medium max-w-xl">
                  Sử dụng AI đo Nhịp tim PPG bằng Camera, phân tích ảnh tổn thương/xét nghiệm, giọng nói & định vị GPS để gợi ý chính xác nhất.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => setShowFullWizard(!showFullWizard)}
                  size="sm"
                  className="bg-[#66FF33] text-slate-950 hover:bg-[#52e624] font-black rounded-2xl text-xs h-10 px-4 shrink-0 flex items-center gap-1.5 shadow-md"
                >
                  <Sparkles className="w-4 h-4 text-slate-900" />
                  <span>{showFullWizard ? 'Thu gọn Wizard' : '✨ Đánh Giá Sức Khỏe AI (10 Bước)'}</span>
                </Button>

                {/* Real Geolocation Button */}
                <Button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locating}
                  size="sm"
                  className="bg-white/10 text-emerald-100 hover:bg-white hover:text-[#0c4b39] border border-white/20 font-bold rounded-2xl text-xs h-10 px-4 shrink-0 flex items-center gap-1.5"
                >
                  {locating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : patientLocation ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#66FF33]" />
                      <span>Vị trí GPS đã bật</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-4 h-4" />
                      <span>Lấy vị trí của tôi</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {locationStatusMsg && (
              <p className="text-[11px] text-[#66FF33] font-bold">{locationStatusMsg}</p>
            )}
          </div>

          {showFullWizard ? (
            <div className="py-2 animate-in fade-in duration-300">
              <AIHealthAssessmentWizard
                onCancel={() => setShowFullWizard(false)}
                onCompleteAssessment={(res) => {
                  if (res?.recommended_specialties?.length > 0) {
                    const firstSpec = res.recommended_specialties[0];
                    if (firstSpec.specialty_id) {
                      setSelectedSpecialtyId(firstSpec.specialty_id);
                      setBookingData({ specialtyId: firstSpec.specialty_id });
                    }
                  }
                }}
              />
            </div>
          ) : null}

          {/* HÌNH THỨC KHÁM SELECTION CARD */}
          <div className="bg-white border border-gray-200 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#0c4b39] text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                    BƯỚC 1: HÌNH THỨC KHÁM
                  </Badge>
                  <h3 className="font-extrabold text-secondary text-base flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#0c4b39]" />
                    <span>Chọn Hình Thức Khám Bệnh</span>
                  </h3>
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  Vui lòng chọn 1 trong 3 hình thức khám để hệ thống áp dụng đúng ưu đãi và quyền lợi y tế.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {[
                {
                  id: 'REGULAR',
                  name: 'Khám thường',
                  badge: 'Tiêu chuẩn',
                  desc: 'Khám bệnh tiêu chuẩn lấy số thứ tự theo quy định của bệnh viện.',
                  icon: <Stethoscope className="w-5 h-5 text-emerald-600" />,
                  activeBorder: 'border-emerald-500 bg-emerald-50/40 text-emerald-900',
                  badgeBg: 'bg-emerald-100 text-emerald-800',
                },
                {
                  id: 'BHYT',
                  name: 'Khám BHYT',
                  badge: 'Bảo hiểm y tế',
                  desc: 'Áp dụng thẻ BHYT để được hưởng chế độ miễn giảm chi phí y tế.',
                  icon: <ShieldCheck className="w-5 h-5 text-blue-600" />,
                  activeBorder: 'border-blue-500 bg-blue-50/40 text-blue-900',
                  badgeBg: 'bg-blue-100 text-blue-800',
                },
                {
                  id: 'SERVICE',
                  name: 'Khám dịch vụ',
                  badge: 'Ưu tiên',
                  desc: 'Khám nhanh ưu tiên không chờ đợi, chọn Bác sĩ Chuyên gia.',
                  icon: <Zap className="w-5 h-5 text-amber-600" />,
                  activeBorder: 'border-amber-500 bg-amber-50/40 text-amber-900',
                  badgeBg: 'bg-amber-100 text-amber-800',
                },
              ].map((item) => {
                const isSelected = (bookingData.examinationType || 'REGULAR') === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBookingData({ examinationType: item.id as any })}
                    className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer relative flex flex-col justify-between space-y-2.5 ${
                      isSelected
                        ? `${item.activeBorder} shadow-sm ring-2 ring-emerald-500/20`
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-white shadow-2xs border border-gray-100 shrink-0">
                          {item.icon}
                        </div>
                        <span className="font-extrabold text-sm text-secondary">{item.name}</span>
                      </div>
                      <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border-none ${item.badgeBg}`}>
                        {item.badge}
                      </Badge>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed font-normal">{item.desc}</p>

                    <div className="flex items-center gap-1.5 pt-1 text-xs font-bold">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-[#0c4b39] bg-[#0c4b39]' : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={isSelected ? 'text-[#0c4b39]' : 'text-gray-400'}>
                        {isSelected ? 'Đã chọn hình thức này' : 'Bấm để chọn'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* THE 3 COMBOBOXES FOR NORMAL SELECTION */}
          <div className="bg-white border border-gray-200 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-extrabold text-secondary text-base flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-[#0c4b39]" />
                  <span>Bộ Lọc Chọn Bệnh Viện - Chuyên Khoa - Bác Sĩ</span>
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Bạn có thể tự chọn thông tin bất kỳ lúc nào hoặc nhờ AI gợi ý điền tự động bên dưới.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SearchableSelectModal
                label="Bệnh viện / Cơ sở"
                icon={<Building2 className="w-4 h-4 text-[#0c4b39]" />}
                value={selectedHospitalId}
                onChange={handleSelectHospital}
                options={hospitalOptions}
                placeholder="Tôi chưa biết / chọn bệnh viện"
                isKnown={isHospitalKnown}
                clearLabel="Tôi chưa biết bệnh viện"
              />

              <SearchableSelectModal
                label="Chuyên khoa khám"
                icon={<Stethoscope className="w-4 h-4 text-[#0c4b39]" />}
                value={selectedSpecialtyId}
                onChange={handleSelectSpecialty}
                options={specialtyOptions}
                placeholder="Tôi chưa biết / chọn chuyên khoa"
                isKnown={isSpecialtyKnown}
                clearLabel="Tôi chưa biết chuyên khoa"
              />

              <SearchableSelectModal
                label="Bác sĩ chỉ định"
                icon={<Users className="w-4 h-4 text-[#0c4b39]" />}
                value={selectedDoctorId}
                onChange={handleSelectDoctor}
                options={doctorOptions}
                placeholder="Tôi chưa biết / chọn bác sĩ"
                isKnown={isDoctorKnown}
                clearLabel="Tôi chưa biết bác sĩ"
              />
            </div>
          </div>



          {/* AI MATCHED RESULTS CARD AT THE BOTTOM */}
          {userHasEnteredSymptom && aiRecommendation?.bestMatch && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <Badge className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs px-3 py-1 rounded-xl flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>KẾT QUẢ PHÂN TÍCH AI TỐI ƯU NHẤT</span>
                </Badge>
              </div>

              <Card className="border-2 border-[#4caf50] rounded-3xl bg-gradient-to-br from-emerald-50/60 via-white to-white p-6 shadow-md space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#0c4b39] text-white flex items-center justify-center font-bold text-2xl shrink-0 shadow-md">
                      {aiRecommendation.bestMatch.doctor.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-[#0c4b39] text-[10px] font-extrabold uppercase">
                          {aiRecommendation.bestMatch.specialty.name}
                        </Badge>
                        <span className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {aiRecommendation.bestMatch.doctor.rating || 4.9}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-secondary text-lg sm:text-xl">
                        {aiRecommendation.bestMatch.doctor.fullName}
                      </h3>
                      <p className="text-xs text-gray-500 font-semibold">
                        {aiRecommendation.bestMatch.doctor.qualification || 'Bác sĩ chuyên khoa'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedHospitalId(aiRecommendation.bestMatch.hospital.id);
                        setSelectedSpecialtyId(aiRecommendation.bestMatch.specialty.id);
                        setSelectedDoctorId(aiRecommendation.bestMatch.doctor.id);
                        toast.success('Đã tự động điền kết quả gợi ý AI vào bộ lọc!');
                      }}
                      className="border-[#4caf50] text-[#0c4b39] hover:bg-emerald-50 font-extrabold rounded-2xl px-4 h-11 text-xs"
                    >
                      <span>✅ Chấp Nhận & Tự Điền</span>
                    </Button>

                    <Button
                      type="button"
                      onClick={() => handleSelectAiRecommendation(aiRecommendation.bestMatch)}
                      className="bg-[#4caf50] hover:bg-[#439e47] text-white font-extrabold rounded-2xl px-5 h-11 shadow-lg shadow-emerald-200 cursor-pointer flex items-center justify-center gap-2 text-xs shrink-0"
                    >
                      <span>👉 Xác Nhận Kết Quả & Đặt Lịch Ngay</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-white p-4 rounded-2xl border border-emerald-100">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      📍 Bệnh viện & Khoảng cách
                    </span>
                    <p className="font-extrabold text-secondary flex items-center gap-1 text-sm">
                      <MapPin className="w-4 h-4 text-[#0c4b39]" />
                      <span>Cách bạn {aiRecommendation.bestMatch.distance} km</span>
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {aiRecommendation.bestMatch.hospital.name}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      ⚡ Lịch khám khả dụng
                    </span>
                    <p className="font-extrabold text-[#0c4b39] flex items-center gap-1 text-sm">
                      <Clock className="w-4 h-4 text-[#0c4b39]" />
                      <span>Sẵn sàng đặt lịch trực tuyến</span>
                    </p>
                    <p className="text-[11px] text-gray-500">Đặt hẹn không cần chờ đợi</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      💵 Giá khám niêm yết
                    </span>
                    <p className="font-extrabold text-secondary text-sm">
                      {aiRecommendation.bestMatch.workplace?.consultationFee
                        ? `${formatPrice(aiRecommendation.bestMatch.workplace.consultationFee)}đ`
                        : '350.000đ'}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-bold">Thanh toán minh bạch</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* --- MODE 2: SEARCH / FILTER MODE (DÀNH CHO NGƯỜI ĐÃ BIẾT THÔNG TIN) --- */}
      {activeTabMode === 'search-filter' && (
        <div className="space-y-6">
          {/* 1. OMNI-SEARCH SMART BAR */}
          <div className="bg-gradient-to-r from-[#0c4b39] to-[#125c47] p-5 md:p-6 rounded-3xl text-white space-y-4 shadow-lg relative overflow-hidden" ref={omniRef}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-[#4caf50] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                    <Zap className="w-3 h-3 mr-1" />
                    Tìm Kiếm Nhanh 1-Click
                  </Badge>
                  {knownCount > 0 && (
                    <Badge className="bg-white/10 text-emerald-100 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      Đã chọn {knownCount}/3 thông tin
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  Gõ Để Tìm Bác Sĩ, Chuyên Khoa, Bệnh Viện Hoặc Triệu Chứng
                </h2>
              </div>

              {knownCount > 0 && (
                <Button
                  onClick={handleResetFilters}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 text-white border-white/20 hover:bg-red-500/80 hover:text-white rounded-xl text-xs font-bold shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Đặt lại
                </Button>
              )}
            </div>

            {/* Global Search Input */}
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Ví dụ: Nhập 'Nguyễn Văn A', 'Chợ Rẫy', 'Da liễu', 'Đau bụng'..."
                value={omniQuery}
                onChange={(e) => {
                  setOmniQuery(e.target.value);
                  setIsOmniOpen(true);
                }}
                onFocus={() => setIsOmniOpen(true)}
                className="pl-12 pr-10 h-13 rounded-2xl bg-white text-secondary font-semibold text-sm shadow-md border-0 focus-visible:ring-2 focus-visible:ring-[#4caf50]"
              />
              {omniQuery && (
                <button
                  type="button"
                  onClick={() => setOmniQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Instant Search Results Dropdown */}
              {isOmniOpen && omniResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white text-secondary rounded-2xl shadow-2xl border border-gray-200 z-50 p-4 space-y-4 max-h-[70vh] overflow-y-auto animate-in fade-in duration-150">
                  {omniResults.totalCount === 0 ? (
                    <div className="py-6 text-center text-gray-500 space-y-1">
                      <p className="font-bold text-sm">Không tìm thấy kết quả cho từ khóa "{omniQuery}"</p>
                      <p className="text-xs text-gray-400">Thử gõ tên bác sĩ, bệnh viện hoặc chuyên khoa khác</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {omniResults.doctors.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[11px] font-extrabold text-[#0c4b39] uppercase tracking-wider block">
                            👨‍⚕️ Bác sĩ phù hợp ({omniResults.doctors.length})
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {omniResults.doctors.map((d) => (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => {
                                  handleSelectDoctor(d.id);
                                  setIsOmniOpen(false);
                                  setOmniQuery('');
                                }}
                                className="text-left p-2.5 rounded-xl border border-gray-100 bg-emerald-50/30 hover:bg-emerald-100/60 hover:border-emerald-300 transition-all flex items-center gap-3 group"
                              >
                                <div className="w-10 h-10 rounded-xl bg-[#0c4b39] text-white flex items-center justify-center font-bold shrink-0">
                                  {d.fullName.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-xs text-secondary group-hover:text-[#0c4b39] truncate">
                                    {d.fullName}
                                  </p>
                                  <p className="text-[10px] text-gray-500 truncate">
                                    {d.qualification || 'Bác sĩ chuyên khoa'}
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#4caf50]" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {omniResults.specialties.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                          <span className="text-[11px] font-extrabold text-[#0c4b39] uppercase tracking-wider block">
                            🩺 Chuyên khoa ({omniResults.specialties.length})
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {omniResults.specialties.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  handleSelectSpecialty(s.id);
                                  setIsOmniOpen(false);
                                  setOmniQuery('');
                                }}
                                className="text-left p-2 rounded-xl bg-gray-50 hover:bg-emerald-50 border border-gray-200 text-xs font-bold text-gray-800 transition-all flex items-center gap-2 truncate"
                              >
                                <span>{s.icon || '🩺'}</span>
                                <span className="truncate">{s.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {omniResults.hospitals.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                          <span className="text-[11px] font-extrabold text-[#0c4b39] uppercase tracking-wider block">
                            🏥 Bệnh viện / Cơ sở ({omniResults.hospitals.length})
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {omniResults.hospitals.map((h) => (
                              <button
                                key={h.id}
                                type="button"
                                onClick={() => {
                                  handleSelectHospital(h.id);
                                  setIsOmniOpen(false);
                                  setOmniQuery('');
                                }}
                                className="text-left p-2.5 rounded-xl bg-gray-50 hover:bg-emerald-50 border border-gray-200 text-xs font-bold text-gray-800 transition-all flex items-center gap-2 truncate"
                              >
                                <Building2 className="w-4 h-4 text-[#0c4b39] shrink-0" />
                                <div className="truncate">
                                  <p className="font-bold truncate">{h.name}</p>
                                  <p className="text-[10px] text-gray-400 truncate">{h.address}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. THE 3 SEARCHABLE COMBOBOXES CONTROL PANEL */}
          <div className="bg-white border border-gray-200 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#0c4b39] flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-extrabold text-secondary text-base">
                    Bộ lọc tìm kiếm 3 yếu tố
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Gõ tên vào bất kỳ ô nào bên dưới để tìm và lọc ngay tức thì
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SearchableSelectModal
                label="1. Bệnh viện / Cơ sở"
                icon={<Building2 className="w-4 h-4 text-[#0c4b39]" />}
                value={selectedHospitalId}
                onChange={handleSelectHospital}
                options={hospitalOptions}
                placeholder="Tôi chưa biết / chọn bệnh viện"
                isKnown={isHospitalKnown}
                clearLabel="Tôi chưa biết bệnh viện"
              />

              <SearchableSelectModal
                label="2. Chuyên khoa khám"
                icon={<Stethoscope className="w-4 h-4 text-[#0c4b39]" />}
                value={selectedSpecialtyId}
                onChange={handleSelectSpecialty}
                options={specialtyOptions}
                placeholder="Tôi chưa biết / chọn chuyên khoa"
                isKnown={isSpecialtyKnown}
                clearLabel="Tôi chưa biết chuyên khoa"
              />

              <SearchableSelectModal
                label="3. Bác sĩ chỉ định"
                icon={<Users className="w-4 h-4 text-[#0c4b39]" />}
                value={selectedDoctorId}
                onChange={handleSelectDoctor}
                options={doctorOptions}
                placeholder="Tôi chưa biết / chọn bác sĩ"
                isKnown={isDoctorKnown}
                clearLabel="Tôi chưa biết bác sĩ"
              />
            </div>

            {!isCombinationValid && (
              <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-semibold">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                <div>
                  <p className="font-bold">Tổ hợp thông tin chưa hợp lệ!</p>
                  <p className="text-[11px] text-red-600/90 font-normal">
                    Bác sĩ <strong>{selectedDoctor?.fullName}</strong> không làm việc tại{' '}
                    <strong>{selectedHospital?.name}</strong>. Vui lòng điều chỉnh lại Bệnh viện hoặc chọn Bác sĩ khác.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 3. INSTANT ACTION BANNER */}
          {isDoctorKnown && isCombinationValid && selectedDoctor && (
            <Card className="border-2 border-[#4caf50] rounded-3xl bg-gradient-to-r from-emerald-500/10 via-white to-emerald-50/40 p-5 shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#4caf50] text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-md">
                    ✓
                  </div>
                  <div>
                    <Badge className="bg-[#4caf50] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full mb-1">
                      Đã xác định bác sĩ & cơ sở
                    </Badge>
                    <h4 className="font-extrabold text-secondary text-base sm:text-lg leading-tight">
                      {selectedDoctor.fullName} ({selectedDoctor.qualification || 'Bác sĩ chuyên khoa'})
                    </h4>
                    <p className="text-xs text-gray-600 font-medium">
                      {resolvedWorkplace?.hospital?.name || selectedHospital?.name || 'Cơ sở NovaCare'} •{' '}
                      <span className="font-bold text-[#0c4b39]">
                        {resolvedWorkplace?.consultationFee ? `${formatPrice(resolvedWorkplace.consultationFee)}đ` : '350.000đ'}
                      </span>
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleProceedToSchedule}
                  className="bg-[#4caf50] hover:bg-[#439e47] text-white font-black rounded-2xl px-6 h-12 shadow-lg shadow-emerald-200 cursor-pointer flex items-center justify-center gap-2 shrink-0 text-sm"
                >
                  <span>Tiếp tục chọn lịch khám</span>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
