import { apiClient } from "@/lib/api-client";
import { SCREENING_CATALOG_VERSION } from "@/config/screening/catalogVersion";
import { QuestionAnswer } from "@/types/screening";

export interface PPGMeasurement {
  bpm: number;
  source: "CAMERA_PPG";
  quality: "GOOD";
  durationMs: number;
  measuredAt: string;
  algorithmVersion: string;
}
export interface BookingScreeningDraft {
  regions: string[];
  answers: QuestionAnswer[];
  symptoms: string;
  age: string;
  painLevel: string;
  duration: string;
  heightCm: string;
  weightKg: string;
  ppg: PPGMeasurement | null;
  images: File[];
  mediaConsent: boolean;
  transcript: string;
  transcriptConfirmed: boolean;
}
export interface BookingScreeningResult {
  schemaVersion: string;
  inputRevision: string;
  riskLevel: string;
  riskLabel: string;
  summary: string;
  nextAction: string;
  canApply: boolean;
  recommendedSpecialtyId: string | null;
  recommendedSpecialtyName: string | null;
  missingInformation: string[];
  triageDetails: { keyObservations: string[] };
  citations: {
    id: string;
    title: string;
    sourceUrl: string;
    section: string;
  }[];
  modalityStatuses: { image: string; voice: string; ppg: string };
  imageAnalysisFindings: string[];
  ppg: { bpm: number | null; quality: string };
  aiStatus: string;
  providerErrors?: { stage: string; code: string }[];
  decisionReason?: string;
  recommendationSource?: string;
  retrieval: { status: string; mode: string };
}
export function buildScreeningPayload(
  draft: BookingScreeningDraft,
  hospitalId: string,
  revision: string,
): FormData {
  const data = new FormData();
  data.append("schemaVersion", "3");
  data.append("inputRevision", revision);
  data.append("hospitalId", hospitalId);
  data.append("bodyAreas", JSON.stringify(draft.regions));
  data.append(
    "questionnaire",
    JSON.stringify({
      version: SCREENING_CATALOG_VERSION,
      answers: draft.answers.map(({ questionId, answer }) => ({
        questionId,
        answer,
      })),
      painLevel: draft.painLevel === "" ? null : Number(draft.painLevel),
      duration: draft.duration || null,
    }),
  );
  data.append("symptoms", draft.symptoms);
  if (draft.age) data.append("age", draft.age);
  if (draft.heightCm) data.append("heightCm", draft.heightCm);
  if (draft.weightKg) data.append("weightKg", draft.weightKg);
  if (draft.ppg) data.append("ppg", JSON.stringify(draft.ppg));
  if (draft.transcriptConfirmed && draft.transcript.trim()) {
    data.append("voiceTranscript", draft.transcript);
    data.append("voiceConfirmed", "true");
  }
  data.append("mediaConsent", String(draft.mediaConsent));
  draft.images.forEach((file) => data.append("images", file));
  return data;
}
function unwrap(value: any): any {
  return value?.data?.data ?? value?.data ?? value;
}
export async function analyzeBookingScreening(
  draft: BookingScreeningDraft,
  hospitalId: string,
  revision: string,
  signal: AbortSignal,
): Promise<BookingScreeningResult> {
  const response = await apiClient.post(
    "/pre-exam-v2/analyze-smartphone",
    buildScreeningPayload(draft, hospitalId, revision),
    { signal, headers: { "Content-Type": "multipart/form-data" } },
  );
  const result = unwrap(response);
  if (
    result?.schemaVersion !== "3" ||
    result.inputRevision !== revision ||
    typeof result.summary !== "string" ||
    typeof result.canApply !== "boolean" ||
    !Array.isArray(result.missingInformation)
  )
    throw new Error("Kết quả sàng lọc không hợp lệ. Vui lòng thử lại.");
  return result;
}
export async function transcribeScreening(
  blob: Blob,
  signal: AbortSignal,
): Promise<string> {
  const data = new FormData();
  data.append(
    "file",
    blob,
    blob.type.includes("mp4") ? "voice.mp4" : "voice.webm",
  );
  data.append("consent", "true");
  const response = await apiClient.post("/pre-exam-v2/transcribe", data, {
    signal,
    headers: { "Content-Type": "multipart/form-data" },
  });
  const result = unwrap(response);
  if (typeof result?.transcript !== "string" || !result.transcript.trim())
    throw new Error("Chưa nhận diện được lời nói.");
  return result.transcript;
}
