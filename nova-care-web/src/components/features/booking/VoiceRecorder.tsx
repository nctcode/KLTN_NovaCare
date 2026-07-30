'use client';

import React, { useState, useRef } from 'react';
import { Mic, Square, Trash2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceRecorderProps {
  onRecorded: (file: File | null) => void;
}

export function VoiceRecorder({ onRecorded }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        const file = new File([audioBlob], 'voice-symptom.wav', { type: 'audio/wav' });
        onRecorded(file);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      alert('Vui lòng cấp quyền truy cập Micro để ghi âm mô tả triệu chứng.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const deleteRecording = () => {
    setAudioUrl(null);
    setRecordingTime(0);
    onRecorded(null);
  };

  return (
    <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-extrabold flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <Mic className="w-4 h-4 text-emerald-600" />
          Ghi âm lời nói mô tả triệu chứng (Tùy chọn)
        </label>
        {isRecording && (
          <span className="text-xs font-black text-rose-500 animate-pulse flex items-center gap-1">
            ● Đang ghi âm: {recordingTime}s
          </span>
        )}
      </div>

      {!audioUrl && !isRecording && (
        <Button
          type="button"
          variant="outline"
          onClick={startRecording}
          className="w-full text-xs font-bold rounded-xl border-dashed border-emerald-500 text-emerald-700 dark:text-[#66FF33] hover:bg-emerald-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 py-3"
        >
          <Mic className="w-4 h-4" /> Bấm để bắt đầu ghi âm giọng nói
        </Button>
      )}

      {isRecording && (
        <Button
          type="button"
          onClick={stopRecording}
          className="w-full text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 py-3"
        >
          <Square className="w-4 h-4" /> Dừng ghi âm & Lưu bài phát
        </Button>
      )}

      {audioUrl && (
        <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <audio src={audioUrl} controls className="h-8 max-w-[200px]" />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={deleteRecording}
            className="text-rose-600 hover:bg-rose-50 rounded-xl"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
