import { useState, useRef, useCallback, useEffect } from "react";

export type RecordingStatus =
  | "IDLE"
  | "CONSENT"
  | "REQUESTING_PERMISSION"
  | "READY"
  | "COUNTDOWN"
  | "RECORDING"
  | "STOPPING"
  | "PREVIEW"
  | "UPLOADING"
  | "UPLOADED"
  | "ERROR";

export type ScreeningRecording = {
  id?: string;
  localUrl?: string;
  blob?: Blob;
  durationMs: number;
  mimeType: string;
  sizeBytes: number;
  status: RecordingStatus;
  transcript?: string;
};

interface UseMediaRecorderOptions {
  maxDurationSeconds?: number;
  minDurationSeconds?: number;
  onRecordingComplete?: (recording: ScreeningRecording) => void;
}

export function getSupportedRecordingMimeType(): string | undefined {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return undefined;
  }
  const candidateTypes = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  for (const type of candidateTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return undefined;
}

export function useMediaRecorder(options: UseMediaRecorderOptions = {}) {
  const {
    maxDurationSeconds = 30,
    minDurationSeconds = 3,
    onRecordingComplete,
  } = options;

  const [status, setStatus] = useState<RecordingStatus>("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(3);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState<ScreeningRecording | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const generation = useRef(0);

  // Stop all media tracks (Camera & Microphone)
  const stopStreamTracks = useCallback(() => {
    generation.current++;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setMediaStream(null);
  }, []);

  // Clean up intervals and streams on unmount
  useEffect(() => {
    return () => {
      generation.current++;
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);
  useEffect(
    () => () => {
      if (recording?.localUrl) URL.revokeObjectURL(recording.localUrl);
    },
    [recording?.localUrl],
  );

  // Step 1: Open Consent Modal
  const requestConsent = useCallback(() => {
    setErrorMessage(null);
    setStatus("CONSENT");
  }, []);

  // Step 2: Acquire Camera & Microphone Stream
  const initCameraStream = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      !navigator?.mediaDevices?.getUserMedia
    ) {
      setStatus("ERROR");
      setErrorMessage(
        "Trình duyệt hiện tại không hỗ trợ truy cập Camera hoặc Microphone.",
      );
      return false;
    }

    if (window.isSecureContext === false) {
      setStatus("ERROR");
      setErrorMessage(
        "Camera và Microphone yêu cầu kết nối bảo mật (HTTPS hoặc localhost).",
      );
      return false;
    }

    setStatus("REQUESTING_PERMISSION");
    setErrorMessage(null);
    const requestGeneration = ++generation.current;

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch {
      if (requestGeneration !== generation.current) return false;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });
      } catch {
        if (requestGeneration !== generation.current) return false;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        } catch (err: any) {
          if (requestGeneration !== generation.current) return false;
          setStatus("ERROR");
          if (
            err.name === "NotAllowedError" ||
            err.name === "PermissionDeniedError"
          ) {
            setErrorMessage(
              "Bạn đã từ chối quyền Camera/Microphone. Vui lòng bật lại quyền trên thanh chỉ dẫn trình duyệt.",
            );
          } else if (
            err.name === "NotFoundError" ||
            err.name === "DevicesNotFoundError"
          ) {
            setErrorMessage(
              "Không tìm thấy thiết bị Camera hoặc Microphone trên máy tính/điện thoại.",
            );
          } else if (
            err.name === "NotReadableError" ||
            err.name === "TrackStartError"
          ) {
            setErrorMessage(
              "Camera hoặc Microphone đang được ứng dụng khác sử dụng.",
            );
          } else {
            setErrorMessage(
              `Lỗi truy cập Camera/Microphone: ${err.message || "Thiết bị không khả dụng"}`,
            );
          }
          return false;
        }
      }
    }

    if (stream) {
      if (requestGeneration !== generation.current) {
        stream.getTracks().forEach((t) => t.stop());
        return false;
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = stream;
      setMediaStream(stream);
      setStatus("READY");
      return true;
    }
    return false;
  }, []);

  // Internal helper to launch actual MediaRecorder
  const startRecordingInternal = useCallback(
    (stream: MediaStream) => {
      const recordingGeneration = generation.current;
      const mimeType = getSupportedRecordingMimeType();
      chunksRef.current = [];

      try {
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          if (recordingGeneration !== generation.current) return;
          const finalMimeType = recorder.mimeType || mimeType || "video/webm";
          const blob = new Blob(chunksRef.current, { type: finalMimeType });
          const durationMs = Date.now() - startTimeRef.current;

          if (durationMs < minDurationSeconds * 1000) {
            setStatus("READY");
            setErrorMessage(
              `Đoạn ghi âm quá ngắn (${(durationMs / 1000).toFixed(1)}s). Vui lòng mô tả triệu chứng trong ít nhất ${minDurationSeconds} giây.`,
            );
            return;
          }

          const localUrl = URL.createObjectURL(blob);
          const newRecording: ScreeningRecording = {
            localUrl,
            blob,
            durationMs,
            mimeType: finalMimeType,
            sizeBytes: blob.size,
            status: "PREVIEW",
          };

          setRecording(newRecording);
          setStatus("PREVIEW");
          if (onRecordingComplete) {
            onRecordingComplete(newRecording);
          }
        };

        startTimeRef.current = Date.now();
        recorder.start(200);
        mediaRecorderRef.current = recorder;
        setStatus("RECORDING");
        setElapsedSeconds(0);

        // Timer counter interval & auto-stop
        timerIntervalRef.current = setInterval(() => {
          const currentElapsed = Math.floor(
            (Date.now() - startTimeRef.current) / 1000,
          );
          setElapsedSeconds(currentElapsed);

          if (currentElapsed >= maxDurationSeconds) {
            if (timerIntervalRef.current)
              clearInterval(timerIntervalRef.current);
            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state === "recording"
            ) {
              mediaRecorderRef.current.stop();
              setStatus("STOPPING");
            }
          }
        }, 500);
      } catch (err: any) {
        setStatus("ERROR");
        setErrorMessage(`Không thể khởi tạo MediaRecorder: ${err.message}`);
      }
    },
    [maxDurationSeconds, minDurationSeconds, onRecordingComplete],
  );

  // Step 3: Trigger Countdown 3-2-1 then start recording
  const startRecordingProcess = useCallback(() => {
    if (!mediaStream) {
      setErrorMessage("Chưa có tín hiệu từ Camera/Microphone.");
      return;
    }

    setStatus("COUNTDOWN");
    setCountdown(3);

    let count = 3;
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        if (countdownIntervalRef.current)
          clearInterval(countdownIntervalRef.current);
        startRecordingInternal(mediaStream);
      }
    }, 1000);
  }, [mediaStream, startRecordingInternal]);

  // Step 4: Stop Recording Manually
  const stopRecording = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setStatus("STOPPING");
    }
  }, []);

  // Retake: Revoke local Object URL, clear blob, back to READY
  const retake = useCallback(() => {
    if (recording?.localUrl) {
      URL.revokeObjectURL(recording.localUrl);
    }
    setRecording(null);
    setErrorMessage(null);
    setElapsedSeconds(0);

    if (mediaStream) {
      setStatus("READY");
    } else {
      initCameraStream();
    }
  }, [recording?.localUrl, mediaStream, initCameraStream]);

  // Delete local recording
  const deleteRecording = useCallback(() => {
    if (recording?.localUrl) {
      URL.revokeObjectURL(recording.localUrl);
    }
    setRecording(null);
    setErrorMessage(null);
    setElapsedSeconds(0);
    setStatus("READY");
  }, [recording?.localUrl]);

  // Cancel & Close: Reset state and stop all tracks
  const cancel = useCallback(() => {
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (recording?.localUrl) {
      URL.revokeObjectURL(recording.localUrl);
    }
    stopStreamTracks();
    setRecording(null);
    setStatus("IDLE");
    setErrorMessage(null);
    setElapsedSeconds(0);
  }, [recording?.localUrl, stopStreamTracks]);

  return {
    status,
    setStatus,
    errorMessage,
    countdown,
    elapsedSeconds,
    mediaStream,
    recording,
    setRecording,
    requestConsent,
    initCameraStream,
    startRecordingProcess,
    stopRecording,
    retake,
    deleteRecording,
    cancel,
    stopStreamTracks,
  };
}
