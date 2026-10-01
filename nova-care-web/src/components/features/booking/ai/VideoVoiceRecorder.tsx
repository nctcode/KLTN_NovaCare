"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Mic,
  ShieldCheck,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Square,
  Play,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useMediaRecorder, ScreeningRecording } from "@/hooks/useMediaRecorder";

export const DEFAULT_READING_SCRIPT = {
  id: "DEFAULT_VOICE_SAMPLE",
  code: "DEFAULT_VOICE_SAMPLE",
  language: "vi-VN",
  title: "Hướng dẫn mô tả triệu chứng:",
  text: "Hãy kể triệu chứng thực tế: khó chịu ở đâu, bắt đầu khi nào, điều gì làm nặng hơn và có biểu hiện gì đi kèm. Không cần nêu họ tên hoặc thông tin nhận dạng.",
};

interface VideoVoiceRecorderProps {
  scriptText?: string;
  onConfirmRecording: (recording: ScreeningRecording) => Promise<void> | void;
  onSkip?: () => void;
  isUploading?: boolean;
}

export function VideoVoiceRecorder({
  scriptText = DEFAULT_READING_SCRIPT.text,
  onConfirmRecording,
  onSkip,
  isUploading = false,
}: VideoVoiceRecorderProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const {
    status,
    errorMessage,
    countdown,
    elapsedSeconds,
    mediaStream,
    recording,
    requestConsent,
    initCameraStream,
    startRecordingProcess,
    stopRecording,
    retake,
    deleteRecording,
    cancel,
    stopStreamTracks,
  } = useMediaRecorder({
    maxDurationSeconds: 30,
    minDurationSeconds: 3,
  });

  // Attach mediaStream to live video element
  useEffect(() => {
    if (
      videoRef.current &&
      mediaStream &&
      (status === "READY" || status === "COUNTDOWN" || status === "RECORDING")
    ) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(() => {});
    }
  }, [mediaStream, status]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // STEP 1: INITIAL STATE (IDLE)
  if (status === "IDLE") {
    return (
      <Card className="p-5 rounded-3xl bg-slate-900 text-white space-y-4 border border-slate-800 shadow-xl text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-emerald-300">
                🎥 Video & Giọng Nói
              </h4>
              <p className="text-[11px] text-slate-400 font-medium">
                Kể triệu chứng thực tế để bổ sung thông tin cho quá trình sàng
                lọc
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-emerald-400 border-emerald-500 text-[10px] font-bold"
          >
            Không bắt buộc
          </Badge>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 space-y-1.5">
          <p className="font-semibold text-slate-200">
            💡 Mục đích: Kể triệu chứng trong 10–30 giây. Kiểm tra và xác nhận
            văn bản chuyển từ lời nói trước khi phân tích.
          </p>
          <p className="text-[11px] text-slate-400">
            Không chẩn đoán qua khuôn mặt hoặc âm sắc. Khi xác nhận gửi, bản ghi
            được chuyển đến nhà cung cấp AI đã cấu hình để chuyển lời nói thành
            văn bản.
          </p>
        </div>

        <Button
          type="button"
          onClick={requestConsent}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs h-11 rounded-2xl flex items-center justify-center gap-2 shadow-lg"
        >
          <Video className="w-4 h-4" />
          <span>Bắt Đầu Ghi Video & Giọng Nói</span>
        </Button>
      </Card>
    );
  }

  // STEP 2: PRIVACY CONSENT MODAL / DIALOG
  if (status === "CONSENT") {
    return (
      <Card className="p-5 rounded-3xl bg-slate-900 text-white space-y-4 border border-emerald-500/50 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2.5 text-emerald-400">
          <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          <h4 className="text-sm font-black">
            Xác Nhận Quyền Truy Cập Camera & Microphone
          </h4>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/90 p-4 rounded-2xl border border-slate-700">
          NovaCare cần quyền sử dụng <strong>Camera</strong> và{" "}
          <strong>Microphone</strong> để ghi đoạn video bạn chủ động thực hiện.
          <br />
          <br />
          Video chỉ được sử dụng cho phiên sàng lọc hiện tại theo đúng chức năng
          của hệ thống.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={cancel}
            className="w-1/3 border-slate-700 text-slate-300 hover:bg-slate-800 font-bold text-xs h-11 rounded-2xl"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={() => initCameraStream()}
            className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs h-11 rounded-2xl shadow-lg flex items-center justify-center gap-2"
          >
            <Video className="w-4 h-4" />
            <span>Cho Phép Camera & Microphone</span>
          </Button>
        </div>
      </Card>
    );
  }

  // STEP 3: ERROR OR PERMISSION DENIED STATE
  if (status === "ERROR") {
    return (
      <Card className="p-5 rounded-3xl bg-slate-900 text-white space-y-4 border border-rose-500/60 shadow-xl text-left">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <h4 className="text-xs font-extrabold uppercase">
            Không Thể Khởi Tạo Camera / Microphone
          </h4>
        </div>

        <p className="text-xs text-rose-200 bg-rose-950/60 p-3.5 rounded-2xl border border-rose-800/80 leading-relaxed font-medium">
          {errorMessage ||
            "Không thể truy cập camera hoặc microphone. Bạn có thể cấp quyền và thử lại, hoặc bỏ qua bước này."}
        </p>

        <div className="flex items-center gap-2 pt-1">
          {onSkip && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                stopStreamTracks();
                onSkip();
              }}
              className="w-1/2 border-slate-700 text-slate-300 font-bold text-xs h-11 rounded-2xl"
            >
              Bỏ Qua Bước Này
            </Button>
          )}
          <Button
            type="button"
            onClick={() => initCameraStream()}
            className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs h-11 rounded-2xl shadow-lg flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Thử Lại Cấp Quyền</span>
          </Button>
        </div>
      </Card>
    );
  }

  // STEP 4: PREVIEW PLAYBACK / CONFIRM STEP
  if (status === "PREVIEW" && recording?.localUrl) {
    return (
      <Card className="p-5 rounded-3xl bg-slate-900 text-white space-y-4 border border-emerald-500/80 shadow-2xl text-left animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Đoạn Ghi Video
            Của Bạn Đã Sẵn Sàng
          </span>
          <Badge
            variant="outline"
            className="text-emerald-300 border-emerald-500 text-[10px] font-bold"
          >
            Thời lượng: {formatTime(Math.round(recording.durationMs / 1000))}
          </Badge>
        </div>

        {/* Video Player */}
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-56 border border-slate-700 shadow-inner">
          <video
            controls
            src={recording.localUrl}
            className="w-full h-full object-contain"
          />
        </div>

        <p className="text-[11px] text-slate-400 font-medium">
          Bấm nút Play trên video để phát lại cả hình và tiếng. Bạn có thể chọn
          quay lại hoặc xác nhận sử dụng.
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={retake}
            disabled={isUploading}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 font-bold text-xs h-11 rounded-2xl flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Ghi Lại</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={deleteRecording}
            disabled={isUploading}
            className="border-rose-900/80 text-rose-400 hover:bg-rose-950/60 font-bold text-xs h-11 rounded-2xl flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa</span>
          </Button>

          <Button
            type="button"
            onClick={() => onConfirmRecording(recording)}
            disabled={isUploading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs h-11 rounded-2xl shadow-lg flex items-center justify-center gap-1.5"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Đang Lưu...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Sử Dụng</span>
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  // STEP 5: READY / COUNTDOWN / RECORDING STATE WITH CAMERA PREVIEW & READING SCRIPT
  return (
    <Card className="p-4 rounded-3xl bg-slate-900 text-white space-y-3.5 border border-slate-800 shadow-xl text-left">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
          <Mic className="w-4 h-4" /> Camera Quay Khuôn Mặt & Ghi Âm Đọc Mẫu
        </span>
        <Badge
          variant="outline"
          className="text-emerald-300 border-emerald-500 text-[10px] font-bold"
        >
          {status === "RECORDING"
            ? "🔴 LIVE REC"
            : status === "COUNTDOWN"
              ? "⏳ ĐẾM NGƯỢC"
              : "CAMERA ACTIVE"}
        </Badge>
      </div>

      {/* Reading Prompt Card */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            Hãy nói rõ triệu chứng thực tế theo gợi ý dưới đây:
          </p>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
            Không đọc PII
          </span>
        </div>
        <p className="text-xs sm:text-sm font-extrabold italic leading-relaxed text-emerald-200 bg-slate-950 p-3.5 rounded-2xl border border-emerald-500/50 shadow-inner">
          &quot;{scriptText}&quot;
        </p>
      </div>

      {/* Camera Preview Viewport */}
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-56 flex items-center justify-center border border-slate-700 shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100"
        />

        {/* Face Guide Oval Contour Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
          <div className="w-40 h-52 sm:w-48 sm:h-60 rounded-[50%] border-2 border-dashed border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center">
            <span className="text-[10px] font-bold text-emerald-300/80 bg-slate-900/80 px-2.5 py-1 rounded-full backdrop-blur-sm border border-emerald-500/30">
              Không cần quay rõ khuôn mặt
            </span>
          </div>
        </div>

        {/* Countdown Overlay (3, 2, 1) */}
        {status === "COUNTDOWN" && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-2 animate-in fade-in duration-150">
            <span className="text-6xl sm:text-7xl font-black text-emerald-400 animate-bounce">
              {countdown}
            </span>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
              Chuẩn bị mô tả triệu chứng...
            </span>
          </div>
        )}

        {/* Recording Active Status Badge */}
        {status === "RECORDING" && (
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-black flex items-center gap-1.5 shadow-lg animate-pulse">
            <div className="w-2.5 h-2.5 rounded-full bg-white" />
            <span>● GHI ÂM {formatTime(elapsedSeconds)} / 00:30</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-1">
        {status === "RECORDING" ? (
          <Button
            type="button"
            onClick={stopRecording}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs h-11 rounded-2xl flex items-center justify-center gap-2 shadow-lg"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>Dừng Ghi Video ({formatTime(elapsedSeconds)})</span>
          </Button>
        ) : status === "COUNTDOWN" ? (
          <Button
            type="button"
            disabled
            className="w-full bg-amber-600 text-white font-black text-xs h-11 rounded-2xl flex items-center justify-center gap-2 shadow-lg opacity-80"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang đếm ngược ({countdown}s)...</span>
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={cancel}
              className="w-1/3 border-slate-700 text-slate-300 font-bold text-xs h-11 rounded-2xl"
            >
              Hủy / Đóng
            </Button>
            <Button
              type="button"
              onClick={startRecordingProcess}
              className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs h-11 rounded-2xl flex items-center justify-center gap-2 shadow-lg"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Bắt Đầu Ghi Video & Giọng Nói</span>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
