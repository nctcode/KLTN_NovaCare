'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingStore } from '@/stores/booking.store';
import { preExamV2Service } from '@/services/pre-exam-v2.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BodyDiagram } from './BodyDiagram';
import { VoiceRecorder } from './VoiceRecorder';
import { ImageUploader } from './ImageUploader';
import { RiskBadge } from './RiskBadge';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  CalendarCheck,
  Stethoscope,
  Building2,
  FastForward,
} from 'lucide-react';

interface PreExamScreeningProps {
  onSkip?: () => void;
  onCompleted?: (result: any) => void;
}

export function PreExamScreening({ onSkip, onCompleted }: PreExamScreeningProps) {
  const router = useRouter();
  const { setPreExamResult } = useBookingStore();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form State
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Step 1 State
  const [basicInfo, setBasicInfo] = useState({
    age: 35,
    gender: 'MALE',
    medicalHistory: '',
    medications: '',
    allergies: '',
  });

  // Step 2 State
  const [symptomText, setSymptomText] = useState('');
  const [selectedBodyAreas, setSelectedBodyAreas] = useState<string[]>([]);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // Step 3 State
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Step 4 State
  const [finalResult, setFinalResult] = useState<any>(null);

  // Step 1 Handler: Start Session
  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await preExamV2Service.start({
        age: Number(basicInfo.age) || 30,
        gender: basicInfo.gender,
        medicalHistory: basicInfo.medicalHistory ? [basicInfo.medicalHistory] : [],
        medications: basicInfo.medications,
        allergies: basicInfo.allergies,
      });
      const id = res?.sessionId || res?.id || res;
      setSessionId(id);
      setStep(1);
    } catch {
      alert('Đã xảy ra lỗi khởi tạo phiên sàng lọc. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Handler: Submit Symptoms & Get AI Questions
  const handleSubmitSymptoms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await preExamV2Service.submitSymptoms(sessionId, {
        text: symptomText,
        bodyDiagram: selectedBodyAreas.map((area) => ({ area })),
        voiceFile,
        imageFiles,
      });
      if (res?.questions) {
        setQuestions(res.questions);
      }
      setStep(2);
    } catch {
      alert('Đã xảy ra lỗi khi gửi triệu chứng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 Handler: Submit Answer
  const handleAnswerQuestion = async (qId: string, answerText: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: answerText }));
    if (sessionId) {
      preExamV2Service.answerQuestion(sessionId, qId, answerText);
    }
  };

  // Step 3 -> Complete Session
  const handleCompleteScreening = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await preExamV2Service.complete(sessionId);
      setFinalResult(res);
      setStep(3);

      // Save to Zustand Store
      setPreExamResult(res);
      if (onCompleted) onCompleted(res);
    } catch {
      alert('Lỗi hoàn thành phiên sàng lọc. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToBooking = (doc?: any) => {
    if (doc) {
      useBookingStore.getState().setSelection({
        doctorId: doc.doctorId,
        hospitalId: doc.hospitalId,
        specialtyId: doc.specialtyId,
        reason: symptomText || 'Sàng lọc AI gợi ý',
      });
    }
    if (onSkip) {
      onSkip();
    } else {
      router.push('/dat-lich?mode=pre-filled');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header & Skip Option */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-3xl bg-gradient-to-r from-[#0c4b39] to-emerald-900 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#66FF33] text-slate-950 flex items-center justify-center font-black">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight">Sàng Lọc Sức Khỏe Tiền Khám AI</h2>
            <p className="text-xs text-emerald-200">Đánh giá nguy cơ & gợi ý Chuyên khoa / Bác sĩ phù hợp</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onSkip || (() => router.push('/dat-lich?mode=traditional'))}
          className="border-emerald-400/40 bg-emerald-950/40 text-emerald-200 hover:text-white hover:bg-emerald-800 text-xs font-extrabold rounded-2xl flex items-center gap-1.5 shrink-0"
        >
          <FastForward className="w-3.5 h-3.5" /> Bỏ qua sàng lọc
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-2">
          {['Thông tin', 'Triệu chứng', 'Hỏi đáp AI', 'Kết quả'].map((label, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                step >= idx ? 'bg-[#0c4b39] dark:bg-[#66FF33]' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[11px] font-bold text-slate-500">
          <span>Bước 1: Thông tin</span>
          <span>Bước 2: Triệu chứng</span>
          <span>Bước 3: Hỏi đáp AI</span>
          <span>Bước 4: Kết quả</span>
        </div>
      </div>

      {/* STEP 0: Thông tin cơ bản */}
      {step === 0 && (
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b pb-3 border-slate-200 dark:border-slate-800">
              1. Thông Tin Người Khám Ban Đầu
            </h3>

            <form onSubmit={handleStartSession} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Tuổi của người khám *</label>
                  <Input
                    type="number"
                    required
                    min={0}
                    max={120}
                    value={basicInfo.age}
                    onChange={(e) => setBasicInfo({ ...basicInfo, age: parseInt(e.target.value, 10) || 0 })}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Giới tính *</label>
                  <select
                    value={basicInfo.gender}
                    onChange={(e) => setBasicInfo({ ...basicInfo, gender: e.target.value })}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Tiền sử bệnh lý nền (nếu có)</label>
                <Input
                  type="text"
                  placeholder="Ví dụ: Tăng huyết áp, Đái tháo đường, Hen suyễn..."
                  value={basicInfo.medicalHistory}
                  onChange={(e) => setBasicInfo({ ...basicInfo, medicalHistory: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Thuốc đang sử dụng</label>
                  <Input
                    type="text"
                    placeholder="Ví dụ: Amlodipine 5mg"
                    value={basicInfo.medications}
                    onChange={(e) => setBasicInfo({ ...basicInfo, medications: e.target.value })}
                    className="rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Dị ứng (Thuốc / Phấn hoa / Hải sản)</label>
                  <Input
                    type="text"
                    placeholder="Ví dụ: Dị ứng Penicillin"
                    value={basicInfo.allergies}
                    onChange={(e) => setBasicInfo({ ...basicInfo, allergies: e.target.value })}
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0c4b39] hover:bg-[#083629] text-white font-extrabold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Bắt đầu nhập triệu chứng <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* STEP 1: Nhập triệu chứng đa phương thức */}
      {step === 1 && (
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-6 space-y-5">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b pb-3 border-slate-200 dark:border-slate-800">
              2. Mô Tả Triệu Chứng Đa Phương Thức
            </h3>

            <form onSubmit={handleSubmitSymptoms} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Mô tả triệu chứng bằng văn bản *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Gợi ý cấu trúc: Triệu chứng chính (đau ngực, sốt...) + thời gian bị + mức độ..."
                  value={symptomText}
                  onChange={(e) => setSymptomText(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0c4b39]"
                />
              </div>

              {/* Body Diagram */}
              <BodyDiagram selectedAreas={selectedBodyAreas} onChange={setSelectedBodyAreas} />

              {/* Voice Recorder & Image Uploader */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <VoiceRecorder onRecorded={setVoiceFile} />
                <ImageUploader onImagesChanged={setImageFiles} />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(0)}
                  className="rounded-2xl text-xs font-bold border-slate-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#0c4b39] hover:bg-[#083629] text-white font-extrabold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Tiếp tục sang bước hỏi đáp AI <ArrowRight className="w-4 h-4" /></>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: AI hỏi đáp thích ứng */}
      {step === 2 && (
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-6 space-y-5">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b pb-3 border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#0c4b39] dark:text-[#66FF33]" />
              3. AI Đặt Câu Hỏi Thích Ứng Bổ Sung
            </h3>

            <div className="space-y-4">
              {questions.map((q) => {
                const options: string[] = q.options || q.context?.options || [];
                const currentAns = answers[q.id] || '';

                return (
                  <div key={q.id} className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Câu {q.order}: {q.question}
                    </p>

                    {options.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {options.map((opt, optIdx) => {
                          const isSelected = currentAns === opt;
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleAnswerQuestion(q.id, opt)}
                              className={`p-2.5 rounded-xl border text-xs font-bold transition text-left flex items-center justify-between ${
                                isSelected
                                  ? 'bg-[#0c4b39] text-[#66FF33] border-[#0c4b39]'
                                  : 'bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-emerald-500'
                              }`}
                            >
                              <span>{opt}</span>
                              {isSelected && <Check className="w-4 h-4 text-[#66FF33]" />}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <Input
                        type="text"
                        placeholder="Nhập câu trả lời..."
                        value={currentAns}
                        onChange={(e) => handleAnswerQuestion(q.id, e.target.value)}
                        className="rounded-xl text-xs"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="rounded-2xl text-xs font-bold border-slate-300"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
              </Button>
              <Button
                type="button"
                disabled={loading}
                onClick={handleCompleteScreening}
                className="flex-1 bg-[#0c4b39] hover:bg-[#083629] text-white font-extrabold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Hoàn thành & Xem kết quả đánh giá <Sparkles className="w-4 h-4" /></>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Màn hình Kết quả */}
      {step === 3 && finalResult && (
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardContent className="p-6 space-y-6">
            {/* Risk Badge */}
            <RiskBadge
              level={finalResult.riskAssessment?.level}
              label={finalResult.riskAssessment?.label}
              reason={finalResult.riskAssessment?.reason}
            />

            {/* Recommendations */}
            {finalResult.recommendations && finalResult.riskAssessment?.level !== 'EMERGENCY' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                  <p className="font-extrabold text-emerald-800 dark:text-[#66FF33] flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4" /> Chuyên khoa khuyến nghị:
                  </p>
                  <p className="text-base font-black text-slate-900 dark:text-white">
                    {finalResult.recommendations.suggestedSpecialty || 'Nội tổng quát'}
                  </p>
                </div>

                <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Bác Sĩ Gợi Ý Phù Hợp Cho Bạn
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {finalResult.recommendations.doctors?.map((doc: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-2 flex flex-col justify-between hover:border-emerald-500 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-[#0c4b39] dark:text-[#66FF33] font-black text-xs flex items-center justify-center">
                            👨‍⚕️
                          </span>
                          <div>
                            <p className="font-extrabold text-xs text-slate-900 dark:text-white">{doc.doctorName}</p>
                            <p className="text-[11px] text-emerald-600 font-semibold">{doc.qualification}</p>
                          </div>
                        </div>

                        <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{doc.hospitalName}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="font-black text-xs text-emerald-600 dark:text-[#66FF33]">
                          {Number(doc.fee || 200000).toLocaleString()}đ
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleProceedToBooking(doc)}
                          className="bg-[#0c4b39] hover:bg-[#083629] text-white text-xs font-extrabold rounded-xl px-3 py-1"
                        >
                          Chọn bác sĩ này
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handleProceedToBooking()}
                  className="w-full bg-[#0c4b39] hover:bg-[#083629] text-white font-extrabold text-xs py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg"
                >
                  <CalendarCheck className="w-4 h-4" /> Đặt Lịch Khám Theo Đề Xuất Này
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
