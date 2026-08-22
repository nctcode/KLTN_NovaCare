'use client';

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Heart,
  FileText,
  HelpCircle,
  Info,
  Mic,
  Pill,
  Building2,
  MapPin,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Thermometer,
  Upload,
  User,
  UserCheck,
  Zap,
} from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';
import { ImageUploader } from './ImageUploader';
import { HeartRatePPGScanner } from './ai/HeartRatePPGScanner';
import { preExamV2Service } from '@/services/pre-exam-v2.service';
import { useBookingStore } from '@/stores/booking.store';
import { toast } from 'sonner';

interface AIHealthAssessmentWizardProps {
  onCompleteAssessment?: (assessmentResult: any) => void;
  onCancel?: () => void;
}

const COMMON_SYMPTOMS = [
  { id: 'pain', label: 'Đau (Nhức / Tức)', icon: '⚡' },
  { id: 'fever', label: 'Sốt', icon: '🌡️' },
  { id: 'cough', label: 'Ho / Đờm', icon: '🗣️' },
  { id: 'dyspnea', label: 'Khó thở', icon: '🫁' },
  { id: 'dizziness', label: 'Chóng mặt / Hoa mắt', icon: '🌀' },
  { id: 'headache', label: 'Đau đầu', icon: '🤯' },
  { id: 'nausea', label: 'Buồn nôn / Nôn', icon: '🤢' },
  { id: 'abdominal_pain', label: 'Đau bụng', icon: '🩺' },
  { id: 'chest_pain', label: 'Đau ngực', icon: '💔' },
  { id: 'fatigue', label: 'Mệt mỏi / Uể uải', icon: '😴' },
  { id: 'palpitations', label: 'Tim đập nhanh', icon: '💓' },
  { id: 'diarrhea', label: 'Tiêu chảy / Táo bón', icon: '🚽' },
  { id: 'rash', label: 'Phát ban / Ngứa da', icon: '🩹' },
  { id: 'sore_throat', label: 'Đau họng', icon: '🧣' },
];

const MEDICAL_CONDITIONS = [
  'Tăng huyết áp',
  'Tiểu đường',
  'Tim mạch',
  'Hen suyễn / Bệnh phổi',
  'Bệnh thận',
  'Bệnh gan',
  'Dạ dày / Đại tràng',
  'Bệnh tuyến giáp',
  'Không có tiền sử bệnh lý',
];

export const AIHealthAssessmentWizard: React.FC<AIHealthAssessmentWizardProps> = ({
  onCompleteAssessment,
  onCancel,
}) => {
  const { setBookingData, setStep: setBookingStep, setPreExamResult } = useBookingStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [textInput, setTextInput] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomLocation, setSymptomLocation] = useState('');
  const [painSeverity, setPainSeverity] = useState(5);
  const [symptomDuration, setSymptomDuration] = useState('2 ngày');
  const [medicalHistory, setMedicalHistory] = useState<string[]>([]);
  const [medicationsText, setMedicationsText] = useState('');
  const [allergiesText, setAllergiesText] = useState('');

  // Vital Signs
  const [bloodPressure, setBloodPressure] = useState('');
  const [heartRate, setHeartRate] = useState<number | undefined>(undefined);
  const [temperature, setTemperature] = useState<number | undefined>(undefined);
  const [spo2, setSpo2] = useState<number | undefined>(undefined);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [vitalSource, setVitalSource] = useState('manual');
  const [showPPGScanner, setShowPPGScanner] = useState(false);

  // Media
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // Assessment Output Result & Interactive Selections
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  const toggleSymptom = (symLabel: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symLabel) ? prev.filter((s) => s !== symLabel) : [...prev, symLabel]
    );
  };

  const toggleCondition = (cond: string) => {
    if (cond === 'Không có tiền sử bệnh lý') {
      setMedicalHistory(['Không có tiền sử bệnh lý']);
      return;
    }
    setMedicalHistory((prev) => {
      const filtered = prev.filter((c) => c !== 'Không có tiền sử bệnh lý');
      return filtered.includes(cond) ? filtered.filter((c) => c !== cond) : [...filtered, cond];
    });
  };

  const handleRunAssessment = async () => {
    setLoading(true);
    setStep(9);
    try {
      const formattedSymptoms = selectedSymptoms.map((sym) => ({
        symptom: sym,
        location: symptomLocation,
        severity: painSeverity,
        duration: symptomDuration,
      }));

      const payload = {
        textInput,
        symptoms: formattedSymptoms,
        medicalHistory,
        medications: medicationsText ? [medicationsText] : [],
        allergies: allergiesText ? [allergiesText] : [],
        vitalSigns: {
          bloodPressure,
          heartRate,
          temperature,
          spo2,
          height,
          weight,
          source: vitalSource,
        },
        voiceFile,
        imageFiles,
      };

      const res = await preExamV2Service.evaluateHealthAssessment(payload);
      setAssessmentResult(res);

      // Auto select first recommended hospital & doctor
      const defaultSpec = res?.recommended_specialties?.[0];
      const defaultDoc = defaultSpec?.matched_doctors?.[0];
      const defaultHosp = res?.recommended_hospitals?.[0] || (defaultDoc ? { hospitalId: defaultDoc.hospitalId } : null);

      if (defaultHosp?.hospitalId) setSelectedHospitalId(defaultHosp.hospitalId);
      if (defaultDoc?.doctorId) setSelectedDoctorId(defaultDoc.doctorId);

      setStep(10);
      if (onCompleteAssessment) {
        onCompleteAssessment(res);
      }
      toast.success('Phân tích đánh giá sức khỏe thành công');
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra trong quá trình đánh giá AI');
      setStep(8);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAndApplyBooking = () => {
    if (!assessmentResult) return;

    const matchedSpec = assessmentResult?.recommended_specialties?.[0];
    const matchedHosp = assessmentResult?.recommended_hospitals?.find((h: any) => h.hospitalId === selectedHospitalId) || assessmentResult?.recommended_hospitals?.[0];
    const matchedDoc = matchedSpec?.matched_doctors?.find((d: any) => d.doctorId === selectedDoctorId) || matchedSpec?.matched_doctors?.[0];

    const specId = matchedSpec?.specialty_id || matchedSpec?.specialtyId;
    const specName = matchedSpec?.specialty_name || matchedSpec?.specialtyName;
    const hospId = selectedHospitalId || matchedHosp?.hospitalId || matchedDoc?.hospitalId;
    const hospName = matchedHosp?.hospitalName || matchedDoc?.hospitalName;
    const docId = selectedDoctorId || matchedDoc?.doctorId;
    const docName = matchedDoc?.doctorName;

    setBookingData({
      specialtyId: specId,
      specialtyName: specName,
      hospitalId: hospId,
      hospitalName: hospName,
      doctorId: docId,
      doctorName: docName,
      reason: `[Gợi ý AI] ${assessmentResult?.reasoning_summary || ''}`.trim(),
    });

    setPreExamResult(assessmentResult);
    toast.success(`Đã tự động cập nhật ${hospName ? `Bệnh viện ${hospName}` : ''} & Chuyên khoa ${specName || ''} vào các bước đặt khám!`);

    if (onCompleteAssessment) onCompleteAssessment(assessmentResult);
    if (onCancel) onCancel();
    setBookingStep(3); // Move to Step 3: Medical Services / Slots
  };

  const stepTitles = [
    '1. Vấn đề hiện tại',
    '2. Chọn triệu chứng',
    '3. Chi tiết triệu chứng',
    '4. Tiền sử bệnh',
    '5. Thuốc & Dị ứng',
    '6. Chỉ số sức khỏe',
    '7. Ảnh & Giọng nói',
    '8. Xem lại thông tin',
    '9. AI Đánh giá',
    '10. Kết quả & Khuyến nghị',
  ];

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden text-slate-800 transition-all">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-600 p-6 text-white relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                NovaCare AI Health Assessment
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                Sàng lọc & Đánh giá nguy cơ sức khỏe sơ bộ đa phương thức
              </p>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              Đóng
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex justify-between items-center text-xs font-medium text-blue-100 mb-2">
            <span>Bước {step} / 10</span>
            <span className="font-semibold text-white">{stepTitles[step - 1]}</span>
          </div>
          <div className="w-full bg-blue-900/40 rounded-full h-2 overflow-hidden backdrop-blur-sm">
            <div
              className="bg-gradient-to-r from-teal-300 to-amber-300 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-6 md:p-8 space-y-6">
        {/* STEP 1: Text Description */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-blue-900 font-semibold text-lg">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3>Hãy mô tả vấn đề sức khỏe bạn đang gặp phải:</h3>
            </div>
            <p className="text-sm text-slate-500">
              Bạn có thể nhập tự do bằng ngôn ngữ thông thường (Ví dụ: "Tôi bị đau râm râm vùng bụng bên phải 2 ngày nay, kèm sốt nhẹ...").
            </p>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Nhập mô tả triệu chứng hoặc lý do khám tại đây..."
              rows={5}
              className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
            />
          </div>
        )}

        {/* STEP 2: Symptom Selector */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-blue-900 font-semibold text-lg">
              <Stethoscope className="w-5 h-5 text-indigo-600" />
              <h3>Chọn các triệu chứng nổi bật (Có thể chọn nhiều):</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {COMMON_SYMPTOMS.map((sym) => {
                const active = selectedSymptoms.includes(sym.label);
                return (
                  <button
                    key={sym.id}
                    onClick={() => toggleSymptom(sym.label)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border text-sm font-medium text-left transition-all ${active
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                  >
                    <span className="text-xl">{sym.icon}</span>
                    <span>{sym.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Adaptive Symptom Details */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-blue-900 font-semibold text-lg">
              <Clock className="w-5 h-5 text-teal-600" />
              <h3>Chi tiết diễn biến & Mức độ khó chịu:</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Vị trí cụ thể (Nếu có):
                </label>
                <input
                  type="text"
                  value={symptomLocation}
                  onChange={(e) => setSymptomLocation(e.target.value)}
                  placeholder="Ví dụ: Hạ vị phải, Ngực trái, Thái dương..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Bắt đầu xuất hiện từ khi nào?
                </label>
                <input
                  type="text"
                  value={symptomDuration}
                  onChange={(e) => setSymptomDuration(e.target.value)}
                  placeholder="Ví dụ: 2 ngày, từ sáng nay, 1 tuần..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-600">
                  Mức độ đau / khó chịu (1: Rất nhẹ - 10: Dữ dội):
                </label>
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  {painSeverity} / 10
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={painSeverity}
                onChange={(e) => setPainSeverity(Number(e.target.value))}
                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Medical History */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-blue-900 font-semibold text-lg">
              <User className="w-5 h-5 text-purple-600" />
              <h3>Tiền sử bệnh lý bản thân:</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MEDICAL_CONDITIONS.map((cond) => {
                const active = medicalHistory.includes(cond);
                return (
                  <button
                    key={cond}
                    onClick={() => toggleCondition(cond)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border text-sm font-medium text-left transition-all ${active
                      ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center ${active ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300'
                        }`}
                    >
                      {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span>{cond}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Medications & Allergies */}
        {step === 5 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-blue-900 font-semibold text-lg">
              <Pill className="w-5 h-5 text-emerald-600" />
              <h3>Thuốc đang sử dụng & Dị ứng (Tùy chọn):</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Các loại thuốc đang uống (Nếu có):
              </label>
              <input
                type="text"
                value={medicationsText}
                onChange={(e) => setMedicationsText(e.target.value)}
                placeholder="Ví dụ: Panadol, Amlodipine 5mg, Glucophage..."
                className="w-full p-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tiền sử dị ứng (Thuốc, thức ăn, môi trường):
              </label>
              <input
                type="text"
                value={allergiesText}
                onChange={(e) => setAllergiesText(e.target.value)}
                placeholder="Ví dụ: Dị ứng Penicillin, Hải sản..."
                className="w-full p-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>
        )}

        {/* STEP 6: Health Metrics */}
        {step === 6 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-900 font-semibold text-lg">
                <Activity className="w-5 h-5 text-rose-600" />
                <h3>Chỉ số sức khỏe (Sinh hiệu):</h3>
              </div>
              <button
                onClick={() => setShowPPGScanner(!showPPGScanner)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 flex items-center gap-1.5 transition-all"
              >
                <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                {showPPGScanner ? 'Ẩn đo Camera' : 'Đo nhịp tim Camera PPG'}
              </button>
            </div>

            {showPPGScanner && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <HeartRatePPGScanner
                  onComplete={(bpm) => {
                    setHeartRate(bpm);
                    setVitalSource('camera_ppg');
                    toast.success(`Đã cập nhật nhịp tim PPG: ${bpm} BPM`);
                    setShowPPGScanner(false);
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nhịp tim (BPM):
                </label>
                <input
                  type="number"
                  value={heartRate || ''}
                  onChange={(e) => setHeartRate(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="75"
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Huyết áp (mmHg):
                </label>
                <input
                  type="text"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  placeholder="120/80"
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nhiệt độ (°C):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={temperature || ''}
                  onChange={(e) => setTemperature(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="37.0"
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  SpO2 (%):
                </label>
                <input
                  type="number"
                  value={spo2 || ''}
                  onChange={(e) => setSpo2(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="98"
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Chiều cao (cm):
                </label>
                <input
                  type="number"
                  value={height || ''}
                  onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="170"
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Cân nặng (kg):
                </label>
                <input
                  type="number"
                  value={weight || ''}
                  onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="65"
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: Images & Voice */}
        {step === 7 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-blue-900 font-semibold text-lg">
              <Mic className="w-5 h-5 text-amber-600" />
              <h3>Đa phương thức (Ghi âm giọng nói & Tải ảnh triệu chứng):</h3>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-700 block">1. Ghi âm âm thanh / giọng nói triệu chứng:</span>
              <VoiceRecorder onRecorded={(file) => setVoiceFile(file)} />
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-700 block">2. Tải ảnh vết thương / phát ban / xét nghiệm (Nếu có):</span>
              <ImageUploader onImagesChanged={(files) => setImageFiles(files)} />
            </div>
          </div>
        )}

        {/* STEP 8: Review Summary */}
        {step === 8 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-blue-900 font-semibold text-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3>Xác nhận lại thông tin trước khi AI phân tích:</h3>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-sm space-y-3">
              <div>
                <span className="font-semibold text-slate-500">Mô tả văn bản:</span>
                <p className="font-medium text-slate-800">{textInput || 'Chưa nhập'}</p>
              </div>

              <div>
                <span className="font-semibold text-slate-500">Triệu chứng đã chọn:</span>
                <p className="font-medium text-blue-700">
                  {selectedSymptoms.length > 0 ? selectedSymptoms.join(', ') : 'Chưa chọn'}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-500">Tiền sử bệnh lý:</span>
                <p className="font-medium text-slate-800">
                  {medicalHistory.length > 0 ? medicalHistory.join(', ') : 'Không có'}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-500">Chỉ số sinh hiệu:</span>
                <p className="font-medium text-slate-800">
                  Nhịp tim: {heartRate ? `${heartRate} BPM` : 'Chưa nhập'} | Huyết áp: {bloodPressure || 'Chưa nhập'} | Nhiệt độ: {temperature ? `${temperature}°C` : 'Chưa nhập'}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-500">Đa phương thức:</span>
                <p className="font-medium text-slate-800">
                  Ghi âm: {voiceFile ? 'Có' : 'Không'} | Ảnh tải lên: {imageFiles.length} tệp
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 9: AI Assessment Loading State */}
        {step === 9 && (
          <div className="py-12 text-center space-y-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 animate-spin">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Đang chạy AI Health Assessment...</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Hệ thống đang đối soát dữ liệu sinh hiệu, triệu chứng & quy tắc Red-Flag y tế từ backend.
            </p>
          </div>
        )}

        {/* STEP 10: Result Screen */}
        {step === 10 && assessmentResult && (
          <div className="space-y-6 animate-in fade-in duration-500 text-left">
            {/* Risk Badge */}
            <div
              className={`p-5 rounded-2xl border text-left flex items-start gap-4 shadow-sm ${assessmentResult.risk_level === 'EMERGENCY'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : assessmentResult.risk_level === 'MODERATE'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}
            >
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                {assessmentResult.risk_level === 'EMERGENCY' ? (
                  <ShieldAlert className="w-7 h-7 text-rose-600" />
                ) : assessmentResult.risk_level === 'MODERATE' ? (
                  <AlertTriangle className="w-7 h-7 text-amber-600" />
                ) : (
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                )}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    Mức độ nguy cơ sơ bộ: {assessmentResult.risk_level}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-white/80 border border-current">
                    AI Health Assessment
                  </span>
                </div>
                <h3 className="text-lg font-bold">{assessmentResult.recommendation}</h3>
                <p className="text-xs leading-relaxed opacity-90">
                  {assessmentResult.reasoning_summary}
                </p>
              </div>
            </div>

            {/* Red Flags detected */}
            {assessmentResult.red_flags_detected?.length > 0 && (
              <div className="p-4 bg-rose-100/80 rounded-2xl border border-rose-300 text-rose-900 text-xs font-semibold space-y-1">
                <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>DẤU HIỆU CẢNH BÁO NGUY CƠ Y TẾ:</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5">
                  {assessmentResult.red_flags_detected.map((rf: string, idx: number) => (
                    <li key={idx}>{rf}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Clinical Explanation & Detailed RAG Analysis */}
            <div className="p-5 bg-white rounded-2xl border border-blue-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-sm pb-2 border-b border-slate-100">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Chi Tiết Phân Tích Y Khoa & Tri Thức RAG</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="font-semibold text-slate-500 block">Triệu chứng trọng yếu:</span>
                  <p className="text-slate-800 font-medium">
                    {assessmentResult.detailed_analysis?.symptom_breakdown || assessmentResult.reasoning_summary}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="font-semibold text-slate-500 block">Diễn giải sinh hiệu:</span>
                  <p className="text-slate-800 font-medium">
                    {assessmentResult.detailed_analysis?.vital_signs_interpretation || 'Chỉ số sinh hiệu sẵn sàng.'}
                  </p>
                </div>
              </div>
              {assessmentResult.detailed_analysis?.specialty_description && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-950">
                  <span className="font-bold text-blue-900 block mb-0.5">Về chuyên khoa đề xuất:</span>
                  <p className="leading-relaxed text-slate-700">{assessmentResult.detailed_analysis.specialty_description}</p>
                </div>
              )}
            </div>


            {/* Recommended Hospitals / Facilities */}
            {assessmentResult.recommended_hospitals?.length > 0 && (
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Bệnh viện / Cơ sở y tế đề xuất (Chọn 1 cơ sở):
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">Nhấp để chọn Bệnh viện</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {assessmentResult.recommended_hospitals.map((hosp: any, hIdx: number) => {
                    const isSelected = selectedHospitalId === hosp.hospitalId;
                    const isNearest = hIdx === 0;
                    return (
                      <div
                        key={hIdx}
                        onClick={() => {
                          setSelectedHospitalId(hosp.hospitalId);
                          toast.info(`Đã chọn Bệnh viện: ${hosp.hospitalName}`);
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 relative ${isSelected
                          ? 'bg-emerald-50/80 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h6 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                            <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-rose-500'}`} />
                            <span>{hosp.hospitalName}</span>
                          </h6>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 pl-5">{hosp.address}</p>

                        {isNearest && (
                          <div className="pt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                              <Sparkles className="w-3 h-3 text-emerald-600" /> Gần nhất & Khuyên dùng
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Specialty & Doctor Recommendations */}
            {assessmentResult.recommended_specialties?.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  Bác sĩ Chuyên khoa phù hợp (Chọn 1 Bác sĩ nếu muốn chỉ định):
                </h4>

                {assessmentResult.recommended_specialties.map((spec: any, idx: number) => (
                  <div key={idx} className="space-y-3">
                    {/* Matched Doctors List */}
                    {spec.matched_doctors?.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {spec.matched_doctors.map((doc: any, dIdx: number) => {
                          const isSelectedDoc = selectedDoctorId === doc.doctorId;
                          return (
                            <div
                              key={dIdx}
                              onClick={() => {
                                setSelectedDoctorId(doc.doctorId);
                                setSelectedHospitalId(doc.hospitalId);
                                toast.info(`Đã chọn Bác sĩ: ${doc.doctorName}`);
                              }}
                              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3.5 ${isSelectedDoc
                                ? 'bg-blue-50/80 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                                : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                                }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${isSelectedDoc ? 'bg-blue-600 text-white border-blue-700' : 'bg-blue-100 text-blue-700 border-blue-200'
                                  }`}>
                                  {doc.doctorName ? doc.doctorName.charAt(0) : 'BS'}
                                </div>
                                <div className="space-y-0.5 flex-1">
                                  <div className="flex items-center justify-between">
                                    <h6 className="font-bold text-slate-900 text-xs">
                                      {doc.title ? `${doc.title} ${doc.doctorName}` : doc.doctorName}
                                    </h6>
                                    {isSelectedDoc && (
                                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{doc.hospitalName}</span>
                                  </div>
                                  <div className="flex items-center justify-between pt-1 text-[11px]">
                                    <span className="font-bold text-emerald-700">
                                      Giá khám: {doc.consultationFee ? doc.consultationFee.toLocaleString('vi-VN') : '200.000'}đ
                                    </span>
                                    {doc.hasAvailableSlots ? (
                                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-full flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-emerald-600" />
                                        Có {doc.availableSlotsCount} suất trống
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-full">
                                        Đang cập nhật lịch
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* STICKY CONFIRMATION ACTION BAR */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl shadow-xl border border-blue-900/60 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-left flex-1">
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Đã chọn cơ sở & Bác sĩ tư vấn AI</span>
                </div>
                <div className="text-xs opacity-90 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-emerald-300">
                    Bệnh viện: {assessmentResult.recommended_hospitals?.find((h: any) => h.hospitalId === selectedHospitalId)?.hospitalName || 'Bệnh viện NovaCare'}
                  </span>
                  {selectedDoctorId && (
                    <>
                      <span>•</span>
                      <span className="text-blue-300 font-semibold">
                        Bác sĩ: {assessmentResult.recommended_specialties?.[0]?.matched_doctors?.find((d: any) => d.doctorId === selectedDoctorId)?.doctorName || 'Đã chọn Bác sĩ'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={handleConfirmAndApplyBooking}
                className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer shrink-0"
              >
                <span>Xác Nhận & Cập Nhật Vào Đặt Khám</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Disclaimer */}
            <div className="p-4 bg-slate-100 rounded-2xl text-slate-600 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {assessmentResult.disclaimer}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      {step < 9 && (
        <div className="p-4 md:px-8 md:py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${step === 1
              ? 'opacity-40 cursor-not-allowed text-slate-400'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>

          {step < 8 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
            >
              <span>Tiếp theo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleRunAssessment}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Bắt Đầu Đánh Giá AI</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
