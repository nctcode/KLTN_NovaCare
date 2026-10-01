"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PPGMeasurement } from "@/services/screening/bookingScreening";
import { estimatePPG } from "@/services/screening/ppgQuality";

export function HeartRatePPGScanner({
  onComplete,
  onReset,
}: {
  onComplete: (measurement: PPGMeasurement) => void;
  onReset?: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const frame = useRef<number | null>(null);
  const generation = useRef(0);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(
    "Đặt nhẹ đầu ngón tay che camera sau, giữ yên trong khoảng 20 giây.",
  );
  const [bpm, setBpm] = useState<number | null>(null);
  const stop = () => {
    generation.current++;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  };
  useEffect(() => () => stop(), []);
  const start = async () => {
    stop();
    onReset?.();
    setBpm(null);
    setProgress(0);
    setScanning(true);
    const runId = generation.current;
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 160 },
          height: { ideal: 120 },
        },
        audio: false,
      });
      if (runId !== generation.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      if (!video.current) {
        stop();
        setScanning(false);
        return;
      }
      video.current.srcObject = media;
      await video.current.play();
      const track = media.getVideoTracks()[0];
      if ((track.getCapabilities?.() as any)?.torch) {
        try {
          await track.applyConstraints({ advanced: [{ torch: true } as any] });
        } catch {
          /* Continue only if signal quality is sufficient. */
        }
      }
      const started = performance.now();
      let signalStarted: number | null = null;
      let lastFrame = 0;
      let samples: { red: number; time: number }[] = [];
      let peaks: number[] = [];
      const tick = (now: number) => {
        if (runId !== generation.current) return;
        if (now - started > 60000) {
          stop();
          setScanning(false);
          setMessage(
            "Chưa thu được tín hiệu đủ chất lượng. Hãy thử lại hoặc bỏ qua.",
          );
          return;
        }
        const context = canvas.current?.getContext("2d", {
          willReadFrequently: true,
        });
        if (!context || !video.current || video.current.readyState < 2) {
          frame.current = requestAnimationFrame(tick);
          return;
        }
        context.drawImage(video.current, 0, 0, 80, 60);
        const pixels = context.getImageData(20, 15, 40, 30).data;
        let red = 0,
          green = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          red += pixels[i];
          green += pixels[i + 1];
        }
        red /= pixels.length / 4;
        green /= pixels.length / 4;
        const covered = red > 25 && red < 250 && red / (green + 1) > 1.2;
        if (!covered || (lastFrame && now - lastFrame > 250)) {
          signalStarted = null;
          samples = [];
          peaks = [];
          setProgress(0);
          setMessage(
            "Giữ ngón tay che camera và giữ yên; tín hiệu chưa ổn định.",
          );
        } else {
          if (signalStarted === null) signalStarted = now;
          samples.push({ red, time: now });
          if (samples.length > 60) samples.shift();
          if (samples.length >= 20) {
            const baseline =
              samples.reduce((s, sample) => s + sample.red, 0) / samples.length;
            const a = samples[samples.length - 3],
              b = samples[samples.length - 2],
              c = samples[samples.length - 1];
            if (
              b.red > a.red &&
              b.red > c.red &&
              b.red > baseline + 0.2 &&
              (!peaks.length || b.time - peaks[peaks.length - 1] > 250)
            )
              peaks.push(b.time);
          }
          const duration = now - signalStarted;
          setProgress(Math.min(100, Math.round(duration / 200)));
          setMessage("Đang thu tín hiệu camera, vui lòng giữ yên…");
          if (duration >= 20000) {
            const estimate = estimatePPG(peaks, duration);
            stop();
            setScanning(false);
            if (estimate === null) {
              setMessage(
                "Tín hiệu chưa đủ chất lượng để ước lượng nhịp tim. Không có số đo được sử dụng.",
              );
              return;
            }
            setBpm(estimate);
            setMessage(
              "Nhịp tim ước lượng từ tín hiệu camera; không phải kết quả chẩn đoán.",
            );
            onComplete({
              bpm: estimate,
              source: "CAMERA_PPG",
              quality: "GOOD",
              durationMs: Math.round(duration),
              measuredAt: new Date().toISOString(),
              algorithmVersion: "ppg-signal-1",
            });
            return;
          }
        }
        lastFrame = now;
        frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    } catch {
      if (runId === generation.current) {
        stop();
        setScanning(false);
        setMessage(
          "Không mở được camera. Hãy cấp quyền và thử lại hoặc bỏ qua phép đo.",
        );
      }
    }
  };
  return (
    <div className="space-y-4 rounded-2xl bg-slate-900 p-5 text-white">
      <video
        ref={video}
        autoPlay
        playsInline
        muted
        className="h-24 w-32 rounded-xl object-cover"
      />
      <canvas ref={canvas} width={80} height={60} className="hidden" />
      <p role="status" className="text-sm">
        {message}
      </p>
      {scanning && (
        <progress
          aria-label="Tiến trình đo nhịp tim"
          value={progress}
          max={100}
          className="w-full"
        />
      )}
      {bpm !== null && (
        <p className="text-3xl font-bold">
          {bpm} BPM <span className="text-sm font-normal">ước lượng</span>
        </p>
      )}
      {!scanning ? (
        <Button onClick={start}>Bắt đầu đo</Button>
      ) : (
        <Button
          onClick={() => {
            stop();
            setScanning(false);
            onReset?.();
            setMessage("Đã dừng đo.");
          }}
        >
          Dừng đo
        </Button>
      )}
    </div>
  );
}
