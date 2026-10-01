"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Hospital, Specialty } from "@/types";
import { BookingType } from "@/config/bookingTypes";
import { BodyDiagram } from "../BodyDiagram";
import { ScreeningStep2 } from "@/components/features/screening/ScreeningStep2";
import { RedFlagEngine } from "@/services/screening/RedFlagEngine";
import { HeartRatePPGScanner } from "./HeartRatePPGScanner";
import { VideoVoiceRecorder } from "./VideoVoiceRecorder";
import {
  analyzeBookingScreening,
  transcribeScreening,
  BookingScreeningDraft,
  BookingScreeningResult,
} from "@/services/screening/bookingScreening";
import { Loader2, ShieldAlert, Sparkles } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  hospital: Hospital;
  specialties: Specialty[];
  doctors?: any[];
  onApplyAIRecommendation: (recommendation: {
    specialtyId?: string;
    specialtyName: string;
    reason: string;
    bookingType?: BookingType;
    doctorId?: string;
    doctorName?: string;
    doctor?: any;
  }) => void;
}
const emptyDraft = (): BookingScreeningDraft => ({
  regions: [],
  answers: [],
  symptoms: "",
  age: "",
  painLevel: "",
  duration: "",
  heightCm: "",
  weightKg: "",
  ppg: null,
  images: [],
  mediaConsent: false,
  transcript: "",
  transcriptConfirmed: false,
});
const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900";
const steps = [
  "Vùng đau",
  "Trắc nghiệm",
  "Ảnh tổn thương",
  "Nhịp tim",
  "Giọng nói",
  "Kết quả",
];

export function AIAssistedBookingModal({
  isOpen,
  onClose,
  hospital,
  specialties,
  onApplyAIRecommendation,
}: Props) {
  const [draft, setDraft] = useState(emptyDraft);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<BookingScreeningResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const revision = useRef(0);
  const request = useRef<AbortController | null>(null);
  const voiceRequest = useRef<AbortController | null>(null);
  const active = useRef(false);
  useEffect(() => {
    active.current = isOpen;
    request.current?.abort();
    voiceRequest.current?.abort();
    revision.current++;
    setBusy(false);
    setTranscribing(false);
    setDraft(emptyDraft());
    setResult(null);
    setError("");
    setStep(0);
    return () => {
      active.current = false;
      request.current?.abort();
      voiceRequest.current?.abort();
    };
  }, [isOpen, hospital.id]);
  const change = (patch: Partial<BookingScreeningDraft>) => {
    if (patch.regions || patch.mediaConsent === false) {
      voiceRequest.current?.abort();
      setTranscribing(false);
    }
    revision.current++;
    request.current?.abort();
    setBusy(false);
    setError("");
    setResult(null);
    setDraft((prev) => ({ ...prev, ...patch }));
  };
  const warning = RedFlagEngine.evaluateRedFlags(draft.answers);
  const run = async () => {
    if (busy || transcribing) return;
    if (!draft.regions.length) {
      setError("Vui lòng chọn vùng bất thường.");
      setStep(0);
      return;
    }
    if (draft.images.length && !draft.mediaConsent) {
      setError("Cần đồng ý xử lý ảnh hoặc xóa ảnh để tiếp tục.");
      setStep(2);
      return;
    }
    const currentRevision = String(revision.current);
    const controller = new AbortController();
    request.current?.abort();
    request.current = controller;
    setBusy(true);
    setError("");
    setResult(null);
    setStep(5);
    try {
      const response = await analyzeBookingScreening(
        draft,
        hospital.id,
        currentRevision,
        controller.signal,
      );
      if (
        active.current &&
        !controller.signal.aborted &&
        currentRevision === String(revision.current)
      )
        setResult(response);
    } catch (err: any) {
      if (!controller.signal.aborted && active.current)
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Chưa phân tích được. Vui lòng thử lại.",
        );
    } finally {
      if (request.current === controller && active.current) setBusy(false);
    }
  };
  const transcribe = async (recording: { blob?: Blob | null }) => {
    if (!recording.blob || !draft.mediaConsent) {
      setError("Cần đồng ý xử lý bản ghi trước khi chuyển thành văn bản.");
      return;
    }
    const controller = new AbortController();
    voiceRequest.current?.abort();
    voiceRequest.current = controller;
    setTranscribing(true);
    change({ transcript: "", transcriptConfirmed: false });
    try {
      const transcript = await transcribeScreening(
        recording.blob,
        controller.signal,
      );
      if (active.current && !controller.signal.aborted)
        change({ transcript, transcriptConfirmed: false });
    } catch (err: any) {
      if (active.current && !controller.signal.aborted)
        setError(
          err?.response?.data?.message ||
            "Chưa chuyển được giọng nói. Bạn có thể nhập mô tả triệu chứng.",
        );
    } finally {
      if (voiceRequest.current === controller && active.current)
        setTranscribing(false);
    }
  };
  const apply = () => {
    if (
      !result?.canApply ||
      result.nextAction !== "BOOK_SPECIALTY" ||
      result.inputRevision !== String(revision.current)
    )
      return;
    const specialty = specialties.find(
      (s) => s.id === result.recommendedSpecialtyId,
    );
    if (!specialty) {
      setError(
        "Chuyên khoa này không có trong danh mục đặt khám hiện tại. Vui lòng chọn cơ sở phù hợp.",
      );
      return;
    }
    onApplyAIRecommendation({
      specialtyId: specialty.id,
      specialtyName: specialty.name,
      reason: result.summary,
    });
    onClose();
  };
  const consent = (
    <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
      <input
        type="checkbox"
        checked={draft.mediaConsent}
        onChange={(e) => {
          if (!e.target.checked) voiceRequest.current?.abort();
          change({ mediaConsent: e.target.checked });
        }}
      />
      <span>
        Tôi đồng ý gửi ảnh/bản ghi đã chọn đến nhà cung cấp AI được NovaCare cấu
        hình để xử lý phiên này. Luồng này không lưu file vào hồ sơ; dữ liệu có
        thể được nhà cung cấp xử lý theo chính sách của họ. Có thể bỏ qua và chỉ
        nhập mô tả.
      </span>
    </label>
  );
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-8">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="text-emerald-700" />
            Sàng lọc & gợi ý chuyên khoa
          </DialogTitle>
          <DialogDescription>
            {hospital.name} · Kết quả hỗ trợ chọn nơi khám, không thay thế chẩn
            đoán của bác sĩ.
          </DialogDescription>
        </DialogHeader>
        <nav aria-label="Các bước sàng lọc" className="flex flex-wrap gap-2">
          {steps.map((name, index) => (
            <button
              key={name}
              type="button"
              disabled={
                busy ||
                transcribing ||
                (index > 0 && !draft.regions.length) ||
                (index === 5 && !result)
              }
              onClick={() => setStep(index)}
              className={`rounded-full px-3 py-2 text-xs font-semibold ${step === index ? "bg-emerald-900 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              {index + 1}. {name}
            </button>
          ))}
        </nav>
        {error && (
          <div
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-sm text-red-800"
          >
            {String(error)}
          </div>
        )}
        {warning.triggeredRedFlags.length > 0 && step !== 5 && (
          <div
            role="alert"
            className="space-y-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-900"
          >
            <p className="font-bold flex gap-2">
              <ShieldAlert />
              Có câu trả lời cần được đánh giá y tế sớm.
            </p>
            <p className="text-sm">
              Không cần chờ chụp ảnh, đo nhịp tim hay ghi âm để tìm hỗ trợ.
            </p>
            <Button onClick={run}>Xem hướng dẫn ngay</Button>
            {warning.hasCriticalRedFlag && (
              <a href="tel:115" className="ml-4 underline">
                Gọi 115 nếu cần cấp cứu
              </a>
            )}
          </div>
        )}
        {step === 0 && (
          <div className="space-y-4">
            <BodyDiagram
              selectedAreas={draft.regions}
              onChange={(regions) =>
                change({
                  regions,
                  answers: [],
                  images: [],
                  ppg: null,
                  transcript: "",
                  transcriptConfirmed: false,
                })
              }
            />
            <label className="block text-sm font-semibold">
              Tuổi của người cần khám
              <input
                aria-label="Tuổi"
                className={inputClass}
                type="number"
                min="0"
                max="120"
                value={draft.age}
                onChange={(e) => change({ age: e.target.value })}
                placeholder="Nhập tuổi thực tế"
              />
            </label>
            <label className="block text-sm font-semibold">
              Mô tả triệu chứng chính
              <textarea
                aria-label="Mô tả triệu chứng"
                className={inputClass}
                value={draft.symptoms}
                maxLength={4000}
                onChange={(e) => change({ symptoms: e.target.value })}
                placeholder="Đau ở đâu, bắt đầu khi nào, có biểu hiện gì đi kèm?"
              />
            </label>
            <Button disabled={!draft.regions.length} onClick={() => setStep(1)}>
              Tiếp tục trắc nghiệm
            </Button>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <ScreeningStep2
              key={draft.regions.join("|")}
              selectedRegions={draft.regions}
              initialAnswers={draft.answers}
              onAnswersChange={(answers) => change({ answers })}
              onCompleted={(value) => {
                change({ answers: value.answers });
                setStep(2);
              }}
              onBack={() => setStep(0)}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="text-sm">
                Mức đau (0–10, bỏ trống nếu không rõ)
                <input
                  aria-label="Mức đau"
                  type="number"
                  min="0"
                  max="10"
                  className={inputClass}
                  value={draft.painLevel}
                  onChange={(e) => change({ painLevel: e.target.value })}
                />
              </label>
              <label className="text-sm">
                Thời gian xuất hiện
                <input
                  aria-label="Thời gian xuất hiện"
                  className={inputClass}
                  value={draft.duration}
                  maxLength={100}
                  onChange={(e) => change({ duration: e.target.value })}
                  placeholder="Ví dụ: khoảng 2 ngày"
                />
              </label>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm">
              Ảnh là tùy chọn, phù hợp với tổn thương nhìn thấy bên ngoài. Chọn
              tối đa 3 ảnh JPEG/PNG/WebP, mỗi ảnh tối đa 5 MB. Không tải giấy tờ
              có thông tin nhận dạng.
            </p>
            <input
              aria-label="Ảnh tổn thương"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => {
                const images = Array.from(e.target.files || []);
                if (
                  images.length > 3 ||
                  images.some(
                    (f) =>
                      f.size > 5 * 1024 * 1024 ||
                      !["image/jpeg", "image/png", "image/webp"].includes(
                        f.type,
                      ),
                  )
                ) {
                  setError(
                    "Chỉ nhận tối đa 3 ảnh JPEG/PNG/WebP, mỗi ảnh không quá 5 MB.",
                  );
                  return;
                }
                change({ images });
              }}
            />
            {draft.images.length > 0 && (
              <div className="text-sm">
                {draft.images.map((f) => f.name).join(", ")}{" "}
                <button
                  type="button"
                  className="underline text-red-700"
                  onClick={() => change({ images: [] })}
                >
                  Xóa ảnh
                </button>
              </div>
            )}
            {consent}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  change({ images: [] });
                  setStep(3);
                }}
              >
                Bỏ qua ảnh
              </Button>
              <Button onClick={() => setStep(3)}>Tiếp tục</Button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm">
              Đo nhịp tim bằng camera là tùy chọn. Chỉ số ước lượng không dùng
              để chẩn đoán rối loạn nhịp hoặc loại trừ tình trạng khẩn cấp.
            </p>
            <HeartRatePPGScanner
              onComplete={(measurement) => change({ ppg: measurement })}
              onReset={() => change({ ppg: null })}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  change({ ppg: null });
                  setStep(4);
                }}
              >
                Bỏ qua phép đo
              </Button>
              <Button onClick={() => setStep(4)}>Tiếp tục</Button>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm">
              Bạn có thể kể triệu chứng bằng giọng nói. Hãy mô tả tình trạng
              thực tế; hệ thống chuyển lời nói thành văn bản để bạn kiểm tra,
              không chẩn đoán bệnh qua âm sắc.
            </p>
            {consent}
            {draft.mediaConsent && (
              <VideoVoiceRecorder
                isUploading={transcribing}
                onConfirmRecording={transcribe}
                onSkip={() => {
                  change({ transcript: "", transcriptConfirmed: false });
                }}
                scriptText="Hãy tự mô tả: bạn đang khó chịu ở đâu, triệu chứng bắt đầu khi nào, điều gì làm nặng hơn và có biểu hiện gì đi kèm. Không đọc câu mẫu như lời khai của mình."
              />
            )}
            {draft.transcript && (
              <div className="space-y-3">
                <label className="text-sm font-semibold">
                  Kiểm tra và sửa lời kể
                  <textarea
                    aria-label="Bản chuyển giọng nói"
                    className={inputClass}
                    value={draft.transcript}
                    onChange={(e) =>
                      change({
                        transcript: e.target.value,
                        transcriptConfirmed: false,
                      })
                    }
                  />
                </label>
                <label className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.transcriptConfirmed}
                    onChange={(e) =>
                      change({ transcriptConfirmed: e.target.checked })
                    }
                  />
                  Tôi xác nhận văn bản này đúng với triệu chứng của mình.
                </label>
              </div>
            )}
            <Button
              disabled={
                transcribing ||
                (Boolean(draft.transcript) && !draft.transcriptConfirmed)
              }
              onClick={run}
            >
              Phân tích & gợi ý chuyên khoa
            </Button>
            <Button
              variant="outline"
              disabled={transcribing}
              onClick={() => {
                change({ transcript: "", transcriptConfirmed: false });
                setStep(0);
              }}
            >
              Nhập mô tả thay cho giọng nói
            </Button>
          </div>
        )}
        {step === 5 && (
          <div className="space-y-4">
            {busy && (
              <p role="status" className="flex items-center gap-2">
                <Loader2 className="animate-spin" />
                Đang kiểm tra thông tin sàng lọc…
              </p>
            )}
            {!busy && !result && (
              <Button onClick={run}>Thử phân tích lại</Button>
            )}
            {result && (
              <>
                <div
                  className={`rounded-2xl border p-5 ${["EMERGENCY", "URGENT"].includes(result.riskLevel) ? "bg-red-50 border-red-300" : "bg-emerald-50 border-emerald-200"}`}
                >
                  <p className="font-bold text-lg">{result.riskLabel}</p>
                  <p className="mt-2 text-sm">{result.summary}</p>
                </div>
                {result.triageDetails.keyObservations.length > 0 && (
                  <ul className="list-disc pl-6 text-sm space-y-2">
                    {result.triageDetails.keyObservations.map((text, i) => (
                      <li key={i}>{text}</li>
                    ))}
                  </ul>
                )}
                {result.nextAction === "EMERGENCY_GUIDANCE" && (
                  <a
                    href="tel:115"
                    className="block rounded-xl bg-red-700 p-4 text-center font-bold text-white"
                  >
                    Gọi 115 / tìm hỗ trợ cấp cứu
                  </a>
                )}
                {result.nextAction === "URGENT_GUIDANCE" && (
                  <p className="font-semibold text-red-800">
                    Liên hệ cơ sở y tế để được đánh giá sớm; không chờ hoàn tất
                    các bước thu thập tùy chọn.
                  </p>
                )}
                {result.missingInformation.length > 0 && (
                  <p className="text-sm text-amber-900">
                    Vui lòng quay lại kiểm tra tuổi, các câu hỏi cảnh báo chưa
                    rõ và bổ sung mô tả triệu chứng.
                  </p>
                )}
                {result.recommendedSpecialtyName && (
                  <p className="text-lg font-bold text-emerald-900">
                    Chuyên khoa gợi ý: {result.recommendedSpecialtyName}
                  </p>
                )}
                {result.decisionReason === "REGION_CONFLICT" && (
                  <Button variant="outline" onClick={() => setStep(0)}>
                    Kiểm tra lại vùng đau
                  </Button>
                )}
                {!!result.providerErrors?.length && (
                  <p
                    role="status"
                    className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900"
                  >
                    {result.providerErrors.some(
                      (e) => e.code === "INSUFFICIENT_BALANCE",
                    )
                      ? "Dịch vụ AI đang tạm ngừng do tài khoản nhà cung cấp không đủ số dư."
                      : "Một phần phân tích AI chưa hoạt động. Bạn có thể thử lại hoặc liên hệ cơ sở y tế."}{" "}
                    Kết quả hiện tại chưa phải phân tích AI đầy đủ.
                  </p>
                )}
                {result.recommendationSource === "QUESTIONNAIRE_RULES" && (
                  <p className="text-xs text-slate-600">
                    Gợi ý ban đầu từ câu trả lời và quy tắc sàng lọc. Chưa có
                    kết quả RAG + LLM được xác thực cho phiên này.
                  </p>
                )}
                <div className="rounded-xl bg-slate-50 p-3 text-sm">
                  Nhịp tim:{" "}
                  {result.ppg.bpm === null
                    ? "Chưa có số đo đủ chất lượng"
                    : `${result.ppg.bpm} BPM (ước lượng)`}
                  .{" "}
                  {result.modalityStatuses.image === "PARTIAL_OR_FAILED" &&
                    "Phân tích ảnh chưa hoàn tất; kết quả có thể thiếu thông tin."}
                  {result.modalityStatuses.image ===
                    "LOW_QUALITY_OR_UNRELATED" &&
                    "Ảnh chưa đủ rõ hoặc không phù hợp để sử dụng."}
                </div>
                {result.imageAnalysisFindings.length > 0 && (
                  <div className="text-sm">
                    <p className="font-semibold">
                      Quan sát từ ảnh, cần đối chiếu khi khám:
                    </p>
                    <ul className="list-disc pl-5">
                      {result.imageAnalysisFindings.map((finding, i) => (
                        <li key={i}>{finding}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.citations.length > 0 && (
                  <div className="text-sm">
                    <p className="font-semibold">Tài liệu tham chiếu:</p>
                    {result.citations.map((c) => (
                      <a
                        key={c.id}
                        href={c.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block underline text-emerald-800"
                      >
                        {c.title} — {c.section}
                      </a>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Kiểm tra lại thông tin
                  </Button>
                  {result.canApply && (
                    <Button onClick={apply}>
                      Áp dụng chuyên khoa vào đặt khám
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
