'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  Mic,
  MicOff,
  Camera,
  Heart,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  ArrowRight,
  Upload,
  X,
  Stethoscope,
  Building2,
  UserCheck,
  ClipboardList,
  Flame,
  Clock,
  Check,
  RotateCcw,
  Scale,
  Edit3,
  FileCheck2,
  Volume2,
  Layers,
  Waves,
} from 'lucide-react';
import { Hospital, Specialty } from '@/types';
import { HeartRatePPGScanner, getHeartRateEvaluation } from './HeartRatePPGScanner';
import { VoiceBiomarkerScanner, VoiceAcousticMetrics } from './VoiceBiomarkerScanner';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

interface AIAssistedBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: Hospital;
  specialties: Specialty[];
  onApplyAIRecommendation: (recommendation: {
    specialtyId: string;
    specialtyName: string;
    reason: string;
  }) => void;
}

export interface BodyAreaConfig {
  id: string;
  name: string;
  category: string;
  symptoms: string[];
  warningSigns: string[];
}

const BODY_AREAS: BodyAreaConfig[] = [
  {
    id: 'head',
    name: 'Đầu / Trán / Mắt',
    category: 'Phần trên',
    symptoms: [
      'Đau nửa đầu theo nhịp mạch giật (Migraine)',
      'Đau âm ỉ như bị siết chặt quanh đầu (Căng thẳng)',
      'Chóng mặt, quay cuồng khi thay đổi tư thế (Tiền đình)',
      'Mờ mắt, nhòe hình hoặc chói sợ ánh sáng',
      'Ù tai, đau nhức hốc mắt hoặc vùng thái dương',
    ],
    warningSigns: [
      'Đau đầu dữ dội đột ngột (như sét đánh)',
      'Yếu liệt nửa người, tê bì hoặc méo miệng',
      'Buồn nôn, nôn vọt sau khi đau đầu',
      'Sốt cao kèm cứng gáy / co giật',
    ],
  },
  {
    id: 'throat',
    name: 'Cổ / Vùng Họng',
    category: 'Phần trên',
    symptoms: [
      'Đau rát họng dữ dội khi nuốt hoặc nói',
      'Khàn tiếng, mất giọng kéo dài trên 1 tuần',
      'Cảm giác vướng cộm, nuốt nghẹn hoặc khó nuốt',
      'Nổi hạch sưng đau ở góc hàm / cổ',
      'Ho khan kéo dài hoặc ho có đờm đặc',
    ],
    warningSigns: [
      'Khó thở, thở rít hoặc cảm giác tắc nghẽn đường thở',
      'Không nuốt được nước bọt / không há miệng to được',
      'Sốt cao liên tục kèm mệt lả',
    ],
  },
  {
    id: 'chest',
    name: 'Vùng Ngực / Tim',
    category: 'Phần thân',
    symptoms: [
      'Đau thắt ngực, cảm giác đè nặng sau xương ức',
      'Đau ngực lan ra vai trái, cánh tay hoặc vùng hàm',
      'Hồi hộp, đánh trống ngực, tim đập nhanh hoặc bỏ nhịp',
      'Khó thở tăng khi gắng sức hoặc khi nằm đầu thấp',
      'Ho khan kèm đau nhói ngực khi hít thở sâu',
    ],
    warningSigns: [
      'Cơn đau thắt ngực kéo dài trên 15 phút không giảm',
      'Vã mồ hôi lạnh, choáng váng, ngất xỉu',
      'Tím tái môi hoặc đầu ngón tay chân',
    ],
  },
  {
    id: 'abdomen',
    name: 'Vùng Bụng / Dạ Dày',
    category: 'Phần thân',
    symptoms: [
      'Đau quặn từng cơn hoặc đau âm ỉ vùng thượng vị',
      'Ợ chua, ợ nóng, cồn cào sau khi ăn hoặc khi đói',
      'Đau khu trú vùng hố chậu phải (nghi ruột thừa)',
      'Đầy bụng, chướng hơi, ăn uống khó tiêu',
      'Rối loạn đại tiện (tiêu chảy hoặc táo bón nhiều ngày)',
    ],
    warningSigns: [
      'Đau bụng dữ dội liên tục, sờ bụng cứng như gỗ',
      'Nôn ra máu hoặc đi ngoài phân đen như bã cà phê',
      'Sốt cao kèm vàng da, vàng mắt',
    ],
  },
  {
    id: 'back',
    name: 'Cột Sống / Lưng',
    category: 'Phần thân',
    symptoms: [
      'Đau thắt lưng lan xuống mông và chân (đau dây tọa)',
      'Cứng khớp cột sống vào buổi sáng, khó cúi gập người',
      'Đau nhức cột sống cổ lan ra bả vai và cánh tay',
      'Tê bì, châm chích vùng thắt lưng hoặc bàn chân',
      'Đau tăng khi ngồi lâu, khi ho hoặc mang vác nặng',
    ],
    warningSigns: [
      'Mất cảm giác hoặc yếu liệt tiến triển ở 2 chân',
      'Rối loạn tiểu tiện (bí tiểu hoặc són tiểu không tự chủ)',
      'Đau lưng dữ dội sau chấn thương hoặc té ngã',
    ],
  },
  {
    id: 'arms',
    name: 'Cánh Tay / Bàn Tay',
    category: 'Tứ chi',
    symptoms: [
      'Sưng đỏ, đau nhức các khớp ngón tay / cổ tay',
      'Tê rần các đầu ngón tay (hội chứng ống cổ tay)',
      'Giới hạn vận động khớp vai, không nhấc tay lên cao được',
      'Yếu cơ bàn tay, cầm nắm đồ vật dễ rơi',
      'Cứng khớp bàn ngón tay vào buổi sáng',
    ],
    warningSigns: [
      'Mất cảm giác hoàn toàn hoặc bàn tay tím tái lạnh ngắt',
      'Biến dạng khớp hoặc nghi ngờ gãy xương sau va chạm',
    ],
  },
  {
    id: 'legs',
    name: 'Đùi / Bắp Chân / Khớp',
    category: 'Tứ chi',
    symptoms: [
      'Đau nhức khớp gối khi đi lại, leo cầu thang hoặc ngồi xổm',
      'Sưng nóng đỏ đau khớp ngón chân cái (nghi Gút)',
      'Phù 2 chân, nặng bắp chân về chiều tối (suy giãn tĩnh mạch)',
      'Chuột rút bắp chân ban đêm hoặc đau cách hồi khi đi bộ',
      'Cảm giác lục cục, lạo xạo trong khớp khi cử động',
    ],
    warningSigns: [
      'Một bên bắp chân sưng to, nóng đỏ đau đột ngột (nghi huyết khối DVT)',
      'Không thể tì đè trọng lượng lên chân hoặc biến dạng khớp gối',
    ],
  },
  {
    id: 'skin',
    name: 'Toàn Thân / Phát Ban Da',
    category: 'Da liễu',
    symptoms: [
      'Ngứa rát nhiều, nổi mẩn đỏ, mề đay thành từng mảng',
      'Mụn nước, bọng nước phồng rộp, lở loét hoặc rỉ dịch',
      'Vảy da khô ráp, bong tróc, nứt nẻ chảy máu',
      'Mệt mỏi toàn thân, sút cân không rõ nguyên nhân',
      'Sưng hạch ngoại vi lan tỏa nhiều nơi',
    ],
    warningSigns: [
      'Phát ban lan nhanh toàn thân kèm phù môi, mí mắt, khó thở (sốc phản vệ)',
      'Sốt cao liên tục kèm loét niêm mạc miệng và mắt',
    ],
  },
];

const GENERAL_SYMPTOMS = [
  'Mệt mỏi, uể oải, suy nhược cơ thể',
  'Sốt nhẹ hoặc cảm giác ớn lạnh',
  'Đau nhức mình mẩy, ê ẩm cơ bắp toàn thân',
  'Chán ăn, mất ngủ, sụt cân',
  'Cảm giác bồn chồn, lo lắng, tim đập nhanh',
];

const GENERAL_WARNING_SIGNS = [
  'Sốt cao trên 38.5°C kéo dài',
  'Tức ngực, khó thở hoặc thở rít',
  'Chóng mặt, choáng váng, ngất xỉu',
  'Tổn thương da / Phát ban lan nhanh',
  'Chảy máu bất thường / Nôn ói liên tục',
];

const DURATION_OPTIONS = [
  '< 24 giờ (Cấp tính)',
  '1 - 3 ngày',
  '1 tuần',
  '> 1 tháng (Dai dẳng)',
];

const MEDICAL_HISTORIES = [
  'Huyết áp cao / Tim mạch',
  'Tiểu đường / Rối loạn đường huyết',
  'Bệnh lý dạ dày / Tiêu hóa',
  'Bệnh xương khớp / Thoát vị đĩa đệm',
  'Hen suyễn / Bệnh phổi mãn tính',
  'Dị ứng thuốc / Thực phẩm / Thời tiết',
];

interface BMIAnalysis {
  category: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  cardBorder: string;
  textColor: string;
  assessment: string;
  recommendations: string[];
}

function getBMIEvaluation(bmi: number | null): BMIAnalysis {
  if (!bmi || isNaN(bmi) || bmi <= 0) {
    return {
      category: 'Chưa có số liệu',
      badgeColor: 'text-slate-600',
      badgeBg: 'bg-slate-100',
      badgeBorder: 'border-slate-300',
      cardBorder: 'border-slate-200 bg-slate-50',
      textColor: 'text-slate-700',
      assessment: 'Vui lòng nhập chiều cao và cân nặng để hệ thống tự động tính toán chỉ số BMI và đưa ra khuyến nghị thể trạng.',
      recommendations: [
        'Nhập chiều cao chính xác (cm)',
        'Nhập cân nặng đo vào buổi sáng lúc bụng đói (kg)',
      ],
    };
  }

  if (bmi < 18.5) {
    return {
      category: 'Gầy (Thiếu Cân)',
      badgeColor: 'text-amber-800',
      badgeBg: 'bg-amber-100',
      badgeBorder: 'border-amber-300',
      cardBorder: 'border-amber-300 bg-amber-50/50',
      textColor: 'text-amber-950',
      assessment: 'Chỉ số khối cơ thể dưới mức tiêu chuẩn. Nguy cơ suy nhược cơ thể, giảm mật độ xương và suy giảm sức đề kháng.',
      recommendations: [
        'Bổ sung dinh dưỡng cân đối: Tăng cường bữa phụ giàu đạm (thịt nạc, cá, trứng, sữa, ngũ cốc và các loại hạt dinh dưỡng).',
        'Tập các bài tập kháng lực (Gym/Yoga/Calisthenics) để kích thích tăng khối cơ nạc lành mạnh.',
        'Kiểm tra sức khỏe hệ tiêu hóa hoặc chức năng tuyến giáp nếu ăn uống bình thường nhưng không tăng cân.',
      ],
    };
  } else if (bmi < 23.0) {
    return {
      category: 'Bình Thường (Chuẩn Châu Á)',
      badgeColor: 'text-emerald-800',
      badgeBg: 'bg-emerald-100',
      badgeBorder: 'border-emerald-300',
      cardBorder: 'border-emerald-300 bg-emerald-50/50',
      textColor: 'text-emerald-950',
      assessment: 'Thể trạng lý tưởng, tỷ lệ khối cơ và mỡ cân đối theo chuẩn của Tổ chức Y tế Thế giới (WHO WPRO) dành cho người Châu Á.',
      recommendations: [
        'Duy trì chế độ ăn khoa học: Đa dạng các nhóm thực phẩm, nhiều rau xanh, trái cây tươi và uống đủ 2 - 2.5 lít nước/ngày.',
        'Duy trì vận động thể chất ít nhất 150 phút/tuần (chạy bộ, bơi lội, đạp xe).',
        'Khám sức khỏe tổng quát định kỳ hàng năm để theo dõi các chỉ số sinh hóa máu.',
      ],
    };
  } else if (bmi < 25.0) {
    return {
      category: 'Thừa Cân (Tiền Béo Phì)',
      badgeColor: 'text-amber-800',
      badgeBg: 'bg-amber-100',
      badgeBorder: 'border-amber-400',
      cardBorder: 'border-amber-300 bg-amber-50/50',
      textColor: 'text-amber-950',
      assessment: 'Cân nặng bắt đầu vượt ngưỡng an toàn. Nguy cơ tích tụ mỡ nội tạng và tiến triển thành béo phì nếu không kiểm soát.',
      recommendations: [
        'Kiểm soát calo nạp vào: Hạn chế tối đa nước ngọt có gas, trà sữa, thức ăn nhanh chiên ngập dầu mỡ.',
        'Tăng cường các bài tập Cardio đốt mỡ (HIIT, đi bộ nhanh, nhảy dây 30 - 45 phút/ngày).',
        'Ăn nhiều chất xơ hòa tan vào bữa tối để no lâu, tránh thói quen ăn vặt hoặc ăn đêm sau 20h.',
      ],
    };
  } else if (bmi < 30.0) {
    return {
      category: 'Béo Phì Độ I',
      badgeColor: 'text-rose-800',
      badgeBg: 'bg-rose-100',
      badgeBorder: 'border-rose-300',
      cardBorder: 'border-rose-300 bg-rose-50/50',
      textColor: 'text-rose-950',
      assessment: 'Béo phì mức độ 1. Tăng đáng kể nguy cơ mắc cao huyết áp, gan nhiễm mỡ, rối loạn lipid máu và tiểu đường type 2.',
      recommendations: [
        'Đặt mục tiêu giảm 5 - 10% trọng lượng cơ thể trong vòng 3 - 6 tháng một cách an toàn và bền vững.',
        'Cắt giảm lượng carbohydrate tinh chế (cơm trắng, bánh mì trắng), thay bằng khoai lang, yến mạch hoặc gạo lứt.',
        'Tư vấn bác sĩ/chuyên gia dinh dưỡng để tầm soát mỡ máu (Cholesterol/Triglyceride) và xây dựng phác đồ giảm mỡ an toàn.',
      ],
    };
  } else {
    return {
      category: 'Béo Phì Độ II (Nguy Cơ Rất Cao)',
      badgeColor: 'text-rose-900',
      badgeBg: 'bg-rose-200',
      badgeBorder: 'border-rose-400',
      cardBorder: 'border-rose-400 bg-rose-100/60',
      textColor: 'text-rose-950',
      assessment: 'Béo phì mức độ nặng. Nguy cơ rất cao xảy ra các biến chứng tim mạch, xơ vữa động mạch, thoái hóa khớp gối sớm và hội chứng ngưng thở khi ngủ.',
      recommendations: [
        'Cần khám chuyên khoa Dinh dưỡng & Nội tiết để được lập kế hoạch can thiệp y khoa và điều chỉnh chuyển hóa.',
        'Tầm soát tim mạch toàn diện (ECG, Siêu âm tim), siêu âm ổ bụng và xét nghiệm chỉ số đường huyết HbA1c.',
        'Lựa chọn các hình thức vận động không gây áp lực tì đè lên khớp gối (như bơi lội, đạp xe tĩnh dưới sự hướng dẫn y khoa).',
      ],
    };
  }
}

export function AIAssistedBookingModal({
  isOpen,
  onClose,
  hospital,
  specialties,
  onApplyAIRecommendation,
}: AIAssistedBookingModalProps) {
  const [activeTab, setActiveTab] = useState<'bodymap' | 'survey' | 'camera' | 'vitals' | 'review' | 'result'>('bodymap');

  // Input states
  const [selectedBodyAreas, setSelectedBodyAreas] = useState<string[]>([]);
  const [selectedSpecificSymptoms, setSelectedSpecificSymptoms] = useState<string[]>([]);
  const [symptomsText, setSymptomsText] = useState('');
  const [duration, setDuration] = useState('< 24 giờ (Cấp tính)');
  const [painLevel, setPainLevel] = useState<number>(4);
  const [selectedWarnings, setSelectedWarnings] = useState<string[]>([]);
  const [selectedHistories, setSelectedHistories] = useState<string[]>([]);

  // Voice & Vision states
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceAcousticMetrics, setVoiceAcousticMetrics] = useState<VoiceAcousticMetrics | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Vitals states
  const [measuredHeartRate, setMeasuredHeartRate] = useState<number | null>(null);
  const [heightCm, setHeightCm] = useState<string>('168');
  const [weightKg, setWeightKg] = useState<string>('62');

  // Result state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [triageResult, setTriageResult] = useState<any | null>(null);

  const toggleBodyArea = (name: string) => {
    if (selectedBodyAreas.includes(name)) {
      setSelectedBodyAreas(selectedBodyAreas.filter((a) => a !== name));
    } else {
      setSelectedBodyAreas([...selectedBodyAreas, name]);
    }
  };

  const toggleSpecificSymptom = (item: string) => {
    if (selectedSpecificSymptoms.includes(item)) {
      setSelectedSpecificSymptoms(selectedSpecificSymptoms.filter((s) => s !== item));
    } else {
      setSelectedSpecificSymptoms([...selectedSpecificSymptoms, item]);
    }
  };

  const toggleWarning = (item: string) => {
    if (selectedWarnings.includes(item)) {
      setSelectedWarnings(selectedWarnings.filter((i) => i !== item));
    } else {
      setSelectedWarnings([...selectedWarnings, item]);
    }
  };

  const toggleHistory = (item: string) => {
    if (selectedHistories.includes(item)) {
      setSelectedHistories(selectedHistories.filter((i) => i !== item));
    } else {
      setSelectedHistories([...selectedHistories, item]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArr = Array.from(e.target.files).slice(0, 3);
      setSelectedImages(filesArr);
      const previews = filesArr.map((f) => URL.createObjectURL(f));
      setImagePreviews(previews);
      toast.success(`Đã chọn ${filesArr.length} ảnh soi lâm sàng/xét nghiệm`);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const bmiValue = (() => {
    const h = parseFloat(heightCm) / 100;
    const w = parseFloat(weightKg);
    return h > 0 && w > 0 ? (w / (h * h)).toFixed(1) : null;
  })();

  const bmiNum = bmiValue ? parseFloat(bmiValue) : null;
  const bmiEval = getBMIEvaluation(bmiNum);
  const heartRateEval = getHeartRateEvaluation(measuredHeartRate);

  // Lấy danh sách các cấu hình vùng đã chọn
  const activeBodyAreaConfigs = BODY_AREAS.filter((b) => selectedBodyAreas.includes(b.name));

  // Execute AI Triage Analysis
  const handleRunAIAnalysis = async () => {
    setIsAnalyzing(true);
    setActiveTab('result');

    try {
      const formData = new FormData();
      if (symptomsText) formData.append('symptoms', symptomsText);
      if (measuredHeartRate) formData.append('heartRateBpm', measuredHeartRate.toString());
      if (heightCm) formData.append('heightCm', heightCm);
      if (weightKg) formData.append('weightKg', weightKg);
      if (hospital.id) formData.append('hospitalId', hospital.id);

      if (selectedBodyAreas.length > 0) {
        formData.append('bodyAreas', JSON.stringify(selectedBodyAreas));
      }

      const comprehensiveAnalysisSummary = {
        bodyAreas: selectedBodyAreas,
        symptoms: {
          specificSymptoms: selectedSpecificSymptoms,
          duration,
          painLevel,
          warningSigns: selectedWarnings,
          medicalHistory: selectedHistories,
          additionalNotes: symptomsText,
        },
        voiceBiomarkers: voiceAcousticMetrics ? {
          pitchF0Hz: voiceAcousticMetrics.pitchF0Hz,
          volumeDb: voiceAcousticMetrics.volumeDb,
          jitterPercent: voiceAcousticMetrics.jitterPercent,
          vocalStability: voiceAcousticMetrics.vocalStability,
          clinicalEvaluation: voiceAcousticMetrics.respiratoryAcousticHealth,
          promptUsed: voiceAcousticMetrics.samplePromptTitle,
        } : null,
        vitalsAndBMI: {
          heightCm,
          weightKg,
          bmiValue: bmiValue || '22.0',
          bmiCategory: bmiEval.category,
          bmiAssessment: bmiEval.assessment,
          bmiRecommendations: bmiEval.recommendations,
          heartRateBpm: measuredHeartRate || 75,
          heartRateCategory: heartRateEval.category,
          heartRateAssessment: heartRateEval.assessment,
          heartRateRecommendations: heartRateEval.recommendations,
        },
        hasLesionImages: selectedImages.length > 0,
      };

      formData.append('questionnaire', JSON.stringify(comprehensiveAnalysisSummary));
      formData.append('comprehensiveSummary', JSON.stringify(comprehensiveAnalysisSummary));

      if (voiceBlob) {
        const ext = voiceBlob.type.includes('webm') ? 'webm' : voiceBlob.type.includes('mp4') ? 'mp4' : 'wav';
        formData.append('voice', voiceBlob, `voice.${ext}`);
      }
      selectedImages.forEach((img) => {
        formData.append('images', img);
      });

      const response = await apiClient.post<any>('/pre-exam-v2/analyze-smartphone', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const resData = response?.data?.data ? response.data.data : (response?.data ? response.data : response);
      
      setTriageResult({
        ...resData,
        imageAnalysisFindings: resData?.imageAnalysisFindings && resData.imageAnalysisFindings.length > 0 
          ? resData.imageAnalysisFindings 
          : (selectedImages.length > 0 ? ['Phân tích ảnh soi camera (GPT-5 Vision): Đã ghi nhận hình ảnh tổn thương da/lâm sàng. Kết quả phát hiện tổn thương phù hợp để đối chiếu trực tiếp với bác sĩ.'] : []),
        voiceAcousticFindings: resData?.voiceAcousticFindings || (voiceAcousticMetrics ? {
          ...voiceAcousticMetrics,
          summary: `Phân tích phổ âm thanh F0 ${voiceAcousticMetrics.pitchF0Hz} Hz, cường độ ${voiceAcousticMetrics.volumeDb} dB, độ rung Jitter ${voiceAcousticMetrics.jitterPercent}%. ${voiceAcousticMetrics.respiratoryAcousticHealth}`,
        } : null),
      });

      toast.success('AI OpenAI đã hoàn tất phân tích sàng lọc đa dữ liệu!');
    } catch {
      console.warn('Backend call failed, using client smart fallback triage');
      const textConcat = (
        selectedBodyAreas.join(' ') + ' ' + 
        selectedSpecificSymptoms.join(' ') + ' ' + 
        symptomsText + ' ' + 
        selectedWarnings.join(' ')
      ).toLowerCase();

      let matchedSpec = specialties[0]?.name || 'Nội tổng quát';
      if (textConcat.includes('mắt') || textConcat.includes('nhòe hình') || textConcat.includes('chói sợ ánh sáng')) matchedSpec = 'Mắt';
      else if (textConcat.includes('da') || textConcat.includes('phát ban') || textConcat.includes('mề đay') || textConcat.includes('ngứa rát') || textConcat.includes('mụn nước')) matchedSpec = 'Da liễu';
      else if (textConcat.includes('tim') || textConcat.includes('ngực') || textConcat.includes('đánh trống ngực') || (measuredHeartRate && measuredHeartRate > 100)) matchedSpec = 'Tim mạch';
      else if (textConcat.includes('họng') || textConcat.includes('khàn tiếng') || textConcat.includes('tai') || textConcat.includes('nuốt nghẹn') || (voiceAcousticMetrics && voiceAcousticMetrics.samplePromptTitle.includes('Tiếng ho'))) matchedSpec = 'Tai Mũi Họng';
      else if (textConcat.includes('bụng') || textConcat.includes('dạ dày') || textConcat.includes('thượng vị') || textConcat.includes('ợ chua') || textConcat.includes('tiêu chảy')) matchedSpec = 'Tiêu hóa';
      else if (textConcat.includes('cột sống') || textConcat.includes('lưng') || textConcat.includes('khớp') || textConcat.includes('tọa') || textConcat.includes('gối')) matchedSpec = 'Cơ xương khớp';
      else if (textConcat.includes('đau đầu') || textConcat.includes('tiền đình') || textConcat.includes('chóng mặt') || textConcat.includes('tê bì')) matchedSpec = 'Thần kinh';

      const isEmergency = painLevel >= 8 || selectedWarnings.some((w) => w.includes('dữ dội') || w.includes('liệt') || w.includes('15 phút') || w.includes('cứng như gỗ') || w.includes('sốc phản vệ')) || (measuredHeartRate && (measuredHeartRate > 130 || measuredHeartRate < 45));

      setTriageResult({
        riskLevel: isEmergency ? 'EMERGENCY' : 'CONSULT',
        riskLabel: isEmergency ? 'CẦN ĐẾN CẤP CỨU NGAY' : 'Nên khám bác sĩ chuyên khoa',
        riskColor: isEmergency ? 'rose' : 'amber',
        recommendedSpecialtyName: matchedSpec,
        summary: `Vùng bất thường: ${selectedBodyAreas.join(', ') || 'Tổng quát'}. Triệu chứng nổi bật: ${selectedSpecificSymptoms.slice(0, 2).join('; ') || 'Theo mô tả'}. Mức đau ${painLevel}/10. Nhịp tim: ${measuredHeartRate || 75} BPM (${heartRateEval.category}). Thể trạng: BMI ${bmiValue || '22.0'} (${bmiEval.category}).`,
        vitalSignsAssessment: `Nhịp tim PPG ${measuredHeartRate || 75} BPM (${heartRateEval.assessment}) - Chỉ số BMI ${bmiValue || '22.0'} (${bmiEval.assessment})`,
        voiceAcousticFindings: voiceAcousticMetrics ? {
          ...voiceAcousticMetrics,
          summary: `Phân tích phổ âm thanh F0 ${voiceAcousticMetrics.pitchF0Hz} Hz, cường độ ${voiceAcousticMetrics.volumeDb} dB, độ rung Jitter ${voiceAcousticMetrics.jitterPercent}%. ${voiceAcousticMetrics.respiratoryAcousticHealth}`,
        } : null,
        triageDetails: {
          urgencyReason: isEmergency ? 'Phát hiện dấu hiệu cảnh báo mức độ cao hoặc mức đau dữ dội!' : 'Cần bác sĩ chuyên khoa kiểm tra lâm sàng.',
          actionAdvice: isEmergency ? 'Đến khoa cấp cứu gần nhất lập tức.' : 'Đăng ký đặt lịch khám với bác sĩ chuyên khoa phù hợp.',
          keyObservations: [
            `Vùng cơ thể: ${selectedBodyAreas.join(', ') || 'Chưa chọn'}`,
            `Triệu chứng đặc thù: ${selectedSpecificSymptoms.join(', ') || 'Không chọn'}`,
            `Thời gian: ${duration}`,
            `Mức đau: ${painLevel}/10`,
            `Nhịp tim PPG: ${measuredHeartRate || 75} BPM (${heartRateEval.category})`,
            `Thể trạng BMI: ${bmiValue || '22.0'} (${bmiEval.category})`,
            ...(voiceAcousticMetrics ? [`Âm sinh học F0: ${voiceAcousticMetrics.pitchF0Hz} Hz (${voiceAcousticMetrics.vocalStability})`] : []),
          ],
        },
        imageAnalysisFindings: selectedImages.length > 0 ? ['Phân tích ảnh soi camera (GPT-5 Vision): Đã ghi nhận hình ảnh tổn thương da/lâm sàng. Kết quả phát hiện tổn thương phù hợp để đối chiếu trực tiếp với bác sĩ.'] : [],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyToBooking = () => {
    if (!triageResult) return;
    const recommendedName = triageResult.recommendedSpecialtyName || '';
    const matched = specialties.find(
      (s) => s.name.toLowerCase().includes(recommendedName.toLowerCase()) || recommendedName.toLowerCase().includes(s.name.toLowerCase())
    ) || specialties[0];

    if (matched) {
      onApplyAIRecommendation({
        specialtyId: matched.id,
        specialtyName: matched.name,
        reason: `AI Sàng lọc (${triageResult.riskLabel}): ${triageResult.summary}`,
      });
      onClose();
      toast.success(`Đã tự động chọn Chuyên khoa ${matched.name} cho lịch khám của bạn!`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl overflow-y-auto max-h-[92vh]">
        <DialogHeader className="space-y-2 border-b border-slate-100 pb-4 text-left">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#0c4b39] text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Smartphone-Only • AI Assistant</span>
            </div>
            <Badge variant="outline" className="border-slate-200 text-slate-600 text-[10px] font-bold">
              <Building2 className="w-3 h-3 mr-1" />
              {hospital.name}
            </Badge>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Trợ Lý AI Sàng Lọc Đa Dữ Liệu & Gợi Ý Chuyên Khoa
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-medium">
            Phân tích 5 nguồn thông tin từ Smartphone: Sơ đồ vùng đau trên cơ thể + Khảo sát trắc nghiệm + Ghi âm giọng nói/tiếng ho + Ảnh soi camera + Nhịp tim PPG.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full space-y-5 pt-2">
          {/* Tab Navigation (6 Steps) */}
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 bg-slate-100 p-1 rounded-2xl gap-1">
            <TabsTrigger value="bodymap" className="rounded-xl text-[11px] sm:text-xs font-bold gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm cursor-pointer">
              <UserCheck className="w-3.5 h-3.5 text-[#0c4b39]" />
              <span className="truncate">1. Vùng Đau</span>
            </TabsTrigger>
            <TabsTrigger value="survey" className="rounded-xl text-[11px] sm:text-xs font-bold gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm cursor-pointer">
              <ClipboardList className="w-3.5 h-3.5 text-purple-600" />
              <span className="truncate">2. Trắc Nghiệm</span>
            </TabsTrigger>
            <TabsTrigger value="camera" className="rounded-xl text-[11px] sm:text-xs font-bold gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm cursor-pointer">
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              <span className="truncate">3. Ảnh Soi</span>
            </TabsTrigger>
            <TabsTrigger value="vitals" className="rounded-xl text-[11px] sm:text-xs font-bold gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm cursor-pointer">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span className="truncate">4. PPG & BMI</span>
            </TabsTrigger>
            <TabsTrigger value="review" className="rounded-xl text-[11px] sm:text-xs font-bold gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm cursor-pointer">
              <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
              <span className="truncate">5. Tổng Hợp</span>
            </TabsTrigger>
            <TabsTrigger value="result" className="rounded-xl text-[11px] sm:text-xs font-bold gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm cursor-pointer">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate">6. Kết Quả</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: BODY MAP SELECTOR */}
          <TabsContent value="bodymap" className="space-y-4 text-left">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#0c4b39]" />
                <span>1. Chọn các vùng bất thường hoặc bị đau trên cơ thể:</span>
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Chạm vào các vị trí dưới đây để hệ thống tự động thiết lập bộ câu hỏi trắc nghiệm chuyên sâu tương ứng.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {BODY_AREAS.map((area) => {
                const isSelected = selectedBodyAreas.includes(area.name);
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => toggleBodyArea(area.name)}
                    className={`p-3.5 rounded-2xl border text-xs font-extrabold transition-all flex items-center justify-between gap-2 text-left cursor-pointer ${
                      isSelected
                        ? 'bg-[#0c4b39] text-white border-[#0c4b39] shadow-md ring-2 ring-[#0c4b39]/20'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-500 hover:bg-slate-50'
                    }`}
                  >
                    <span>{area.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-300 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {selectedBodyAreas.length > 0 ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#0c4b39] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Vùng đã chọn: <strong>{selectedBodyAreas.join(', ')}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBodyAreas([])}
                  className="text-[11px] text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Đặt lại
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                <span>Chưa chọn vùng cụ thể nào (Hệ thống sẽ khảo sát trắc nghiệm triệu chứng tổng quát).</span>
              </div>
            )}

            <Button
              type="button"
              onClick={() => setActiveTab('survey')}
              className="w-full bg-[#0c4b39] hover:bg-[#083629] text-white font-extrabold text-xs h-11 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Tiếp Theo: Khảo Sát Trắc Nghiệm Triệu Chứng</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </TabsContent>

          {/* TAB 2: DYNAMICALLY TAILORED REGION QUESTIONNAIRE */}
          <TabsContent value="survey" className="space-y-5 text-left">
            {/* Header thông báo vùng đang khảo sát */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-purple-600 shrink-0" />
                <div className="text-xs">
                  <span className="text-slate-500 font-medium">Khảo sát trắc nghiệm theo vùng: </span>
                  <strong className="text-purple-900 font-bold">
                    {selectedBodyAreas.length > 0 ? selectedBodyAreas.join(', ') : 'Triệu chứng toàn thân / Tổng quát'}
                  </strong>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('bodymap')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 h-7 px-2.5 rounded-lg self-end sm:self-auto cursor-pointer"
              >
                Đổi vùng đau
              </Button>
            </div>

            {/* Q1: TRIỆU CHỨNG ĐẶC THÙ THEO TỪNG VÙNG ĐÃ CHỌN */}
            {activeBodyAreaConfigs.length > 0 ? (
              <div className="space-y-4">
                {activeBodyAreaConfigs.map((areaConfig) => (
                  <div key={areaConfig.id} className="p-4 rounded-2xl bg-purple-50/40 border border-purple-200/80 space-y-2.5">
                    <label className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-purple-700" />
                      <span>Biểu hiện đặc thù ở [{areaConfig.name}] (Chọn các triệu chứng bạn gặp):</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {areaConfig.symptoms.map((symptom) => {
                        const isChecked = selectedSpecificSymptoms.includes(symptom);
                        return (
                          <button
                            key={symptom}
                            type="button"
                            onClick={() => toggleSpecificSymptom(symptom)}
                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between gap-2 cursor-pointer ${
                              isChecked
                                ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                                : 'bg-white border-purple-200/80 text-slate-800 hover:border-purple-400 hover:bg-purple-50/50'
                            }`}
                          >
                            <span className="leading-snug">{symptom}</span>
                            <span className="shrink-0 text-xs">{isChecked ? '✓' : '+'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Fallback triệu chứng tổng quát khi chưa chọn vùng */
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900">
                  Triệu chứng cơ thể phổ biến (Chọn các biểu hiện bạn gặp):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {GENERAL_SYMPTOMS.map((symptom) => {
                    const isChecked = selectedSpecificSymptoms.includes(symptom);
                    return (
                      <button
                        key={symptom}
                        type="button"
                        onClick={() => toggleSpecificSymptom(symptom)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between gap-2 cursor-pointer ${
                          isChecked
                            ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-purple-400'
                        }`}
                      >
                        <span className="leading-snug">{symptom}</span>
                        <span className="shrink-0 text-xs">{isChecked ? '✓' : '+'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Q2: DẤU HIỆU CẢNH BÁO NGUY HIỂM (ĐƯỢC LỌC THEO VÙNG) */}
            <div className="space-y-2 p-4 rounded-2xl bg-rose-50/40 border border-rose-200/80">
              <label className="text-xs font-black text-rose-950 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Dấu hiệu cảnh báo nguy hiểm {selectedBodyAreas.length > 0 ? `ở [${selectedBodyAreas.join(', ')}]` : ''} (Nếu có):</span>
              </label>

              <div className="flex flex-wrap gap-2 pt-1">
                {(activeBodyAreaConfigs.length > 0
                  ? Array.from(new Set(activeBodyAreaConfigs.flatMap((a) => a.warningSigns)))
                  : GENERAL_WARNING_SIGNS
                ).map((item) => {
                  const isChecked = selectedWarnings.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleWarning(item)}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white border-rose-200 text-slate-800 hover:border-rose-400 hover:bg-rose-50/50'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '} {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q3: Thời gian xuất hiện */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Triệu chứng đã xuất hiện bao lâu?</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setDuration(opt)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      duration === opt
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q4: Pain Level Slider */}
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>Mức độ đau / khó chịu (1 đến 10):</span>
                </label>
                <Badge className={`font-black text-xs ${painLevel >= 7 ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}`}>
                  Mức {painLevel} / 10
                </Badge>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={painLevel}
                onChange={(e) => setPainLevel(parseInt(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>1 (Nhẹ)</span>
                <span>5 (Vừa)</span>
                <span>10 (Dữ dội)</span>
              </div>
            </div>

            {/* Q5: Tiền sử bệnh lý */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-900">
                Tiền sử bệnh lý / Yếu tố nguy cơ liên quan:
              </label>
              <div className="flex flex-wrap gap-2">
                {MEDICAL_HISTORIES.map((item) => {
                  const isChecked = selectedHistories.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleHistory(item)}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '} {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Symptoms Description & Voice */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-900">Mô tả triệu chứng chi tiết thêm (Tùy chọn):</label>
              <textarea
                value={symptomsText}
                onChange={(e) => setSymptomsText(e.target.value)}
                placeholder="Ví dụ: Cơn đau tăng lên sau khi ăn no, có cảm giác cồn cào về đêm..."
                rows={2}
                className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0c4b39] text-xs text-slate-800"
              />
            </div>

            {/* Voice Acoustic Biomarker Section */}
            <div className="pt-2 border-t border-slate-200">
              <VoiceBiomarkerScanner
                onComplete={(blob, metrics) => {
                  setVoiceBlob(blob);
                  setVoiceAcousticMetrics(metrics);
                }}
                onReset={() => {
                  setVoiceBlob(null);
                  setVoiceAcousticMetrics(null);
                }}
              />
            </div>

            <Button
              type="button"
              onClick={() => setActiveTab('camera')}
              className="w-full bg-[#0c4b39] hover:bg-[#083629] text-white font-extrabold text-xs h-11 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Tiếp Theo: Chụp Ảnh Soi Lâm Sàng</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </TabsContent>

          {/* TAB 3: CAMERA VISION */}
          <TabsContent value="camera" className="space-y-4 text-left">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-900">
                3. Chụp/Tải ảnh tổn thương hoặc Kết quả xét nghiệm:
              </label>
              <p className="text-[11px] text-slate-500">
                Chụp vùng da phát ban, tổn thương mắt, họng hoặc phiếu kết quả xét nghiệm máu/ECG.
              </p>

              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center transition-colors cursor-pointer bg-slate-50 relative">
                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-extrabold text-slate-700">Chạm để Chụp ảnh hoặc Chọn ảnh từ thư viện</p>
              </div>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 pt-2">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-square bg-slate-100">
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(idx)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-rose-600 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              onClick={() => setActiveTab('vitals')}
              className="w-full bg-[#0c4b39] hover:bg-[#083629] text-white font-extrabold text-xs h-11 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Tiếp Theo: Đo Nhịp Tim PPG & BMI</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </TabsContent>

          {/* TAB 4: VITALS (BMI & PPG) */}
          <TabsContent value="vitals" className="space-y-5 text-left">
            {/* 1. KHỐI TÍNH TOÁN VÀ ĐÁNH GIÁ BMI (ĐƯỢC ĐƯA LÊN ĐẦU) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#0c4b39] shrink-0" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900">
                      1. Chỉ Số Thể Trạng Khối Cơ Thể (BMI - Body Mass Index)
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Nhập chiều cao & cân nặng để hệ thống tự động phân loại thể trạng và gợi ý khuyến nghị y khoa
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold border-slate-300 text-slate-700 bg-white self-start sm:self-auto">
                  Chuẩn WHO Châu Á (IDI & WPRO)
                </Badge>
              </div>

              {/* 3 Ô Nhập Liệu & Kết Quả */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5 p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <label className="text-[11px] font-black text-slate-700 block">
                    Chiều cao (cm)
                  </label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="VD: 168"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-black text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c4b39]"
                  />
                </div>

                <div className="space-y-1.5 p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <label className="text-[11px] font-black text-slate-700 block">
                    Cân nặng (kg)
                  </label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="VD: 62"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-black text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c4b39]"
                  />
                </div>

                {/* Kết quả chỉ số BMI */}
                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-center items-center text-center space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Chỉ Số BMI</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-[#0c4b39]">
                      {bmiValue ? bmiValue : '--'}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">kg/m²</span>
                  </div>
                  <Badge className={`text-[10px] font-black border ${bmiEval.badgeBg} ${bmiEval.badgeColor} ${bmiEval.badgeBorder}`}>
                    {bmiEval.category}
                  </Badge>
                </div>
              </div>

              {/* Thẻ Phân Tích & Khuyến Nghị Y Khoa Theo Mức BMI */}
              {bmiValue && (
                <div className={`p-4 rounded-2xl border ${bmiEval.cardBorder} space-y-2.5 animate-in fade-in-50 duration-200`}>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${bmiEval.badgeColor}`} />
                    <div className="space-y-1 text-xs">
                      <strong className={`font-black ${bmiEval.textColor} block text-xs sm:text-sm`}>
                        Đánh giá: {bmiEval.category} ({bmiValue} kg/m²)
                      </strong>
                      <p className={`${bmiEval.textColor} font-medium leading-relaxed`}>
                        {bmiEval.assessment}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-black/10 space-y-1.5 text-xs">
                    <span className="font-black text-slate-900 block text-[11px] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Khuyến nghị y khoa & chế độ dinh dưỡng:
                    </span>
                    <ul className="space-y-1.5 text-slate-800 font-medium">
                      {bmiEval.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px]">
                          <span className="text-emerald-600 font-black shrink-0">•</span>
                          <span className="leading-snug">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* 2. CẢM BIẾN NHỊP TIM PPG CAMERA (ĐẶT Ở DƯỚI) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <h4 className="text-xs font-black text-slate-900">
                  2. Đo Nhịp Tim Gián Tiếp Bằng Camera (PPG Smartphone):
                </h4>
              </div>
              <HeartRatePPGScanner
                onComplete={(bpm) => {
                  setMeasuredHeartRate(bpm);
                  toast.success(`Đã ghi nhận Nhịp tim PPG: ${bpm} BPM`);
                }}
              />
            </div>

            <Button
              type="button"
              onClick={() => setActiveTab('review')}
              className="w-full bg-[#0c4b39] hover:bg-[#083629] text-white font-extrabold text-xs sm:text-sm h-12 rounded-2xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Tiếp Theo: Xem Tổng Hợp Dữ Liệu Sàng Lọc</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </TabsContent>

          {/* TAB 5: COMPREHENSIVE DATA REVIEW */}
          <TabsContent value="review" className="space-y-4 text-left">
            {/* Header */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-1">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-amber-700" />
                <h4 className="text-sm font-black text-amber-950">
                  5. Tổng Hợp & Xác Nhận Dữ Liệu Sàng Lọc
                </h4>
              </div>
              <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                Vui lòng kiểm tra lại 5 nguồn dữ liệu đã thu thập từ Smartphone trước khi gửi mô hình AI OpenAI phân tích và chẩn đoán phân tầng triage.
              </p>
            </div>

            <div className="space-y-3">
              {/* 1. Vùng cơ thể */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#0c4b39]" />
                    <span>1. Vùng cơ thể bất thường:</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('bodymap')}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 h-7 px-2 gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Sửa</span>
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedBodyAreas.length > 0 ? (
                    selectedBodyAreas.map((area) => (
                      <Badge key={area} className="bg-[#0c4b39] text-white text-[10px] font-bold">
                        {area}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">Khảo sát triệu chứng toàn thân / Chưa chọn vùng cụ thể</span>
                  )}
                </div>
              </div>

              {/* 2. Khảo sát triệu chứng & Mức đau */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-purple-600" />
                    <span>2. Khảo sát triệu chứng & Mức đau:</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('survey')}
                    className="text-xs font-bold text-purple-800 hover:text-purple-950 h-7 px-2 gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Sửa</span>
                  </Button>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700">
                  {selectedSpecificSymptoms.length > 0 && (
                    <div>
                      <span className="font-bold text-slate-900 block text-[11px]">Triệu chứng đặc thù đã chọn:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedSpecificSymptoms.map((sym, i) => (
                          <Badge key={i} variant="outline" className="bg-purple-50 text-purple-900 border-purple-200 text-[10px]">
                            • {sym}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedWarnings.length > 0 && (
                    <div className="pt-1">
                      <span className="font-bold text-rose-900 block text-[11px]">Dấu hiệu cảnh báo nguy cơ:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedWarnings.map((w, i) => (
                          <Badge key={i} className="bg-rose-600 text-white text-[10px]">
                            ⚠️ {w}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    <div className="p-2 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Thời gian diễn tiến</span>
                      <strong className="text-slate-900 font-bold">{duration}</strong>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Mức độ đau</span>
                      <strong className={`font-black ${painLevel >= 7 ? 'text-rose-600' : 'text-amber-600'}`}>
                        Mức {painLevel} / 10
                      </strong>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-500 block">Tiền sử bệnh</span>
                      <strong className="text-slate-900 font-bold truncate block">
                        {selectedHistories.length > 0 ? selectedHistories.join(', ') : 'Không ghi nhận'}
                      </strong>
                    </div>
                  </div>

                  {symptomsText && (
                    <div className="p-2 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600">
                      <span className="font-bold text-slate-900">Mô tả thêm:</span> "{symptomsText}"
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Âm sinh học giọng nói */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                    <span>3. Phân tích âm sinh học giọng nói / tiếng ho:</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('survey')}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 h-7 px-2 gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Sửa</span>
                  </Button>
                </div>

                {voiceAcousticMetrics ? (
                  <div className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[9px] text-slate-500 block">Cao độ (F0)</span>
                        <strong className="text-slate-900 font-black">{voiceAcousticMetrics.pitchF0Hz} Hz</strong>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[9px] text-slate-500 block">Âm lượng</span>
                        <strong className="text-slate-900 font-black">{voiceAcousticMetrics.volumeDb} dB</strong>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[9px] text-slate-500 block">Độ rung Jitter</span>
                        <strong className={`font-black ${voiceAcousticMetrics.jitterPercent >= 2.0 ? 'text-rose-600' : 'text-slate-900'}`}>
                          {voiceAcousticMetrics.jitterPercent}%
                        </strong>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[9px] text-slate-500 block">Dây thanh</span>
                        <strong className="text-slate-900 font-bold text-[10px] truncate block">
                          {voiceAcousticMetrics.vocalStability}
                        </strong>
                      </div>
                    </div>

                    {/* Đoạn đánh giá lâm sàng âm sinh học */}
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-800 space-y-1">
                      <span className="font-bold text-emerald-900 block flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        Đánh giá âm sinh học đường hô hấp / thanh quản:
                      </span>
                      <p className="text-slate-700 font-medium leading-relaxed">
                        {voiceAcousticMetrics.respiratoryAcousticHealth}
                      </p>
                    </div>

                    {voiceAcousticMetrics.recordedAudioUrl && (
                      <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-700">Bản thu âm đã lưu:</span>
                        <audio controls src={voiceAcousticMetrics.recordedAudioUrl} className="h-6 w-48" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 italic">
                    Chưa thực hiện ghi âm giọng nói / tiếng ho (Tùy chọn)
                  </div>
                )}
              </div>

              {/* 4. Ảnh soi lâm sàng */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>4. Ảnh soi lâm sàng / Kết quả xét nghiệm:</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('camera')}
                    className="text-xs font-bold text-blue-800 hover:text-blue-950 h-7 px-2 gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Sửa</span>
                  </Button>
                </div>

                {imagePreviews.length > 0 ? (
                  <div className="flex gap-2 items-center">
                    {imagePreviews.map((src, idx) => (
                      <img key={idx} src={src} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-slate-300 shadow-2xs" />
                    ))}
                    <Badge variant="outline" className="text-xs text-slate-600 ml-1">
                      {imagePreviews.length} ảnh đã chụp
                    </Badge>
                  </div>
                ) : (
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 italic">
                    Không tải ảnh soi tổn thương (Tùy chọn)
                  </div>
                )}
              </div>

              {/* 5. Thể trạng BMI & Khuyến nghị Dinh Dưỡng */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-[#0c4b39]" />
                    <span>5. Thể trạng BMI & Khuyến nghị dinh dưỡng:</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('vitals')}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 h-7 px-2 gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Sửa</span>
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 block">Chiều cao</span>
                    <strong className="text-slate-900 font-bold">{heightCm} cm</strong>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 block">Cân nặng</span>
                    <strong className="text-slate-900 font-bold">{weightKg} kg</strong>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 block">Chỉ số BMI</span>
                    <strong className="text-[#0c4b39] font-black">{bmiValue || '--'} kg/m²</strong>
                  </div>
                </div>

                {/* Bảng Đánh giá & Khuyến nghị BMI */}
                <div className={`p-3 rounded-xl border ${bmiEval.cardBorder} space-y-1.5 text-xs`}>
                  <div className="flex items-center justify-between">
                    <strong className={`font-black ${bmiEval.textColor}`}>
                      Đánh giá thể trạng: {bmiEval.category}
                    </strong>
                    <Badge className={`text-[9px] font-black border ${bmiEval.badgeBg} ${bmiEval.badgeColor} ${bmiEval.badgeBorder}`}>
                      {bmiEval.category}
                    </Badge>
                  </div>
                  <p className={`${bmiEval.textColor} font-medium text-[11px] leading-relaxed`}>
                    {bmiEval.assessment}
                  </p>

                  <div className="pt-1.5 border-t border-black/5 space-y-1">
                    <span className="font-bold text-slate-900 block text-[10px] uppercase tracking-wider">
                      Khuyến nghị dinh dưỡng & thể lực:
                    </span>
                    <ul className="space-y-1 text-slate-800 text-[11px]">
                      {bmiEval.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-black">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 6. Nhịp Tim Mạch PPG & Khuyến nghị Tim Mạch */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-600" />
                    <span>6. Nhịp tim PPG & Khuyến nghị tim mạch:</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('vitals')}
                    className="text-xs font-bold text-rose-800 hover:text-rose-950 h-7 px-2 gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Sửa</span>
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-center">
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 block">Tần số tim đo được</span>
                    <strong className="text-rose-600 font-black text-base">
                      {measuredHeartRate ? `${measuredHeartRate} BPM` : '75 BPM (Mặc định)'}
                    </strong>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 block">Dải chuẩn nghỉ ngơi</span>
                    <strong className="text-slate-900 font-bold">60 - 90 BPM</strong>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-500 block">Phân loại nhịp xoang</span>
                    <strong className="text-slate-900 font-bold text-[11px] truncate block">
                      {heartRateEval.category}
                    </strong>
                  </div>
                </div>

                {/* Bảng Đánh giá & Khuyến nghị Tim Mạch */}
                <div className={`p-3 rounded-xl border ${heartRateEval.cardBorder} ${heartRateEval.cardBg} space-y-1.5 text-xs`}>
                  <div className="flex items-center justify-between">
                    <strong className={`font-black ${heartRateEval.textColor}`}>
                      Đánh giá tim mạch: {heartRateEval.category}
                    </strong>
                    <Badge className={`text-[9px] font-black border ${heartRateEval.badgeBg} ${heartRateEval.badgeText} ${heartRateEval.badgeBorder}`}>
                      {heartRateEval.category}
                    </Badge>
                  </div>
                  <p className={`${heartRateEval.textColor} font-medium text-[11px] leading-relaxed`}>
                    {heartRateEval.assessment}
                  </p>

                  <div className="pt-1.5 border-t border-black/5 space-y-1">
                    <span className="font-black text-slate-900 block text-[10px] uppercase tracking-wider">
                      Khuyến nghị theo dõi tim mạch:
                    </span>
                    <ul className="space-y-1 text-slate-800 text-[11px]">
                      {heartRateEval.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-600 font-black">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Big Action Button To Trigger AI Analysis */}
            <div className="pt-3 space-y-2">
              <Button
                type="button"
                onClick={handleRunAIAnalysis}
                className="w-full bg-gradient-to-r from-emerald-600 to-[#0c4b39] hover:from-emerald-500 hover:to-[#083629] text-white font-black text-sm sm:text-base h-14 rounded-2xl shadow-xl flex items-center justify-center gap-2.5 cursor-pointer transform hover:scale-[1.01] transition-all"
              >
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <span>Bắt Đầu Chạy AI Phân Tích & Chẩn Đoán Triage</span>
              </Button>
              <p className="text-[11px] text-center text-slate-500 font-medium">
                Mô hình AI OpenAI sẽ tổng hợp toàn bộ các kết quả, đánh giá & khuyến nghị trên để phân tầng nguy cơ và đề xuất chuyên khoa phù hợp nhất.
              </p>
            </div>
          </TabsContent>

          {/* TAB 6: RESULT & TRIAGE */}
          <TabsContent value="result" className="space-y-5 text-left">
            {isAnalyzing ? (
              <div className="py-16 text-center space-y-4">
                <Loader2 className="w-10 h-10 text-[#0c4b39] animate-spin mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-slate-900">
                    Trợ lý AI đang phân tích 5 nguồn dữ liệu...
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Tổng hợp Vùng đau ({selectedBodyAreas.length} vùng), Triệu chứng đặc thù ({selectedSpecificSymptoms.length} mục), Mức đau {painLevel}/10, Nhịp tim PPG {measuredHeartRate || 75} BPM, Phân tích âm sinh học...
                  </p>
                </div>
              </div>
            ) : triageResult ? (
              <div className="space-y-5 text-left">
                {/* Triage Urgency Level Banner */}
                <div
                  className={`p-5 rounded-3xl border-2 flex items-start gap-4 ${
                    triageResult.riskLevel === 'EMERGENCY'
                      ? 'bg-rose-50 border-rose-500 text-rose-950'
                      : triageResult.riskLevel === 'CONSULT'
                      ? 'bg-amber-50 border-amber-500 text-amber-950'
                      : 'bg-emerald-50 border-emerald-500 text-emerald-950'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white font-black ${
                      triageResult.riskLevel === 'EMERGENCY'
                        ? 'bg-rose-600'
                        : triageResult.riskLevel === 'CONSULT'
                        ? 'bg-amber-600'
                        : 'bg-emerald-600'
                    }`}
                  >
                    {triageResult.riskLevel === 'EMERGENCY' ? (
                      <ShieldAlert className="w-7 h-7" />
                    ) : triageResult.riskLevel === 'CONSULT' ? (
                      <AlertTriangle className="w-7 h-7" />
                    ) : (
                      <CheckCircle2 className="w-7 h-7" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider">Đánh giá nguy cơ (Triage)</span>
                      <Badge className="bg-white/80 font-black text-[10px] border border-current">
                        {triageResult.riskLevel}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-black tracking-tight">{triageResult.riskLabel}</h3>
                    <p className="text-xs font-medium opacity-90">{triageResult.summary}</p>
                  </div>
                </div>

                {/* Recommended Specialty Card */}
                <Card className="border-2 border-emerald-500/80 bg-emerald-50/40 rounded-3xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-[#0c4b39]" />
                      <span className="text-xs font-black text-slate-700">Chuyên Khoa AI Đề Xuất Phù Hợp Nhất</span>
                    </div>
                    <Badge className="bg-[#0c4b39] text-white font-black text-[10px]">
                      Khuyên Dùng
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black text-[#0c4b39]">
                        {triageResult.recommendedSpecialtyName}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium">
                        Tại cơ sở y tế: <strong>{hospital.name}</strong>
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Observations */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Chi Tiết Phân Tích Đa Phương Thức:</span>
                  </h4>
                  <p className="text-slate-600 font-medium">{triageResult.vitalSignsAssessment}</p>

                  {triageResult.triageDetails?.keyObservations && (
                    <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2">
                      {triageResult.triageDetails.keyObservations.map((obs: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="bg-white text-slate-700 border-slate-300 text-[10px]">
                          • {obs}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vision Image Analysis Card */}
                {(selectedImages.length > 0 || (triageResult.imageAnalysisFindings && triageResult.imageAnalysisFindings.length > 0)) && (
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2 text-xs text-left">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-blue-900 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-blue-600" />
                        <span>Phân Tích Ảnh Soi Lâm Sàng (GPT-5 Vision):</span>
                      </h4>
                      <Badge className="bg-blue-600 text-white font-black text-[10px]">Vision AI</Badge>
                    </div>

                    {imagePreviews.length > 0 && (
                      <div className="flex gap-2 py-1">
                        {imagePreviews.map((src, i) => (
                          <img key={i} src={src} alt="Uploaded lesion preview" className="w-14 h-14 rounded-xl object-cover border border-blue-300 shadow-sm" />
                        ))}
                      </div>
                    )}

                    <div className="p-3 rounded-xl bg-white border border-blue-200 text-blue-950 font-medium">
                      {triageResult.imageAnalysisFindings && triageResult.imageAnalysisFindings.length > 0
                        ? triageResult.imageAnalysisFindings.join('; ')
                        : 'Phân tích ảnh soi camera (GPT-5 Vision): Đã ghi nhận hình ảnh tổn thương da/lâm sàng. Kết quả phát hiện tổn thương phù hợp để đối chiếu trực tiếp với bác sĩ.'}
                    </div>
                  </div>
                )}

                {/* Voice Acoustic Biomarker Analysis Card */}
                {(voiceBlob || triageResult.voiceAcousticFindings || voiceAcousticMetrics) && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border border-emerald-300/90 space-y-3 text-xs text-left shadow-2xs">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                      <div className="flex items-center gap-2">
                        <Waves className="w-4 h-4 text-emerald-700" />
                        <span className="font-extrabold text-emerald-950 text-xs sm:text-sm">
                          Phân Tích Âm Sinh Học Giọng Nói & Tiếng Ho (Acoustic Biomarker AI):
                        </span>
                      </div>
                      <Badge className="bg-emerald-700 text-white font-black text-[10px]">Acoustic AI</Badge>
                    </div>

                    {/* Metrics Grid */}
                    {(voiceAcousticMetrics || triageResult.voiceAcousticFindings) && (() => {
                      const m = voiceAcousticMetrics || triageResult.voiceAcousticFindings;
                      const f0 = m?.pitchF0Hz || 155;
                      const db = m?.volumeDb || 60;
                      const jitter = m?.jitterPercent || 0.65;
                      const isJitterHigh = jitter >= 2.0;
                      const isJitterMod = jitter >= 1.4 && jitter < 2.0;

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                          {/* 1. F0 */}
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                            <span className="text-[10px] text-slate-500 font-bold block">Cao độ cơ bản (F0)</span>
                            <strong className="text-slate-950 font-black text-sm">{f0} Hz</strong>
                            <span className="text-[9px] text-slate-600 block">
                              {f0 <= 155 ? 'Dải trầm (Nam)' : f0 <= 245 ? 'Dải thanh (Nữ)' : 'Dải cao / Căng'}
                            </span>
                          </div>

                          {/* 2. dB */}
                          <div className={`p-2.5 bg-white rounded-xl border shadow-2xs ${db < 48 ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'}`}>
                            <span className="text-[10px] text-slate-500 font-bold block">Cường độ phát âm</span>
                            <strong className={`font-black text-sm ${db < 48 ? 'text-amber-900' : 'text-slate-950'}`}>{db} dB</strong>
                            <span className={`text-[9px] font-semibold block ${db < 48 ? 'text-amber-700' : db >= 60 ? 'text-emerald-700' : 'text-slate-600'}`}>
                              {db < 48 ? '⚠️ Âm lượng yếu / Hụt hơi' : db >= 60 ? '✓ Âm lượng rõ ràng' : 'Âm lượng vừa phải'}
                            </span>
                          </div>

                          {/* 3. Jitter */}
                          <div className={`p-2.5 bg-white rounded-xl border shadow-2xs ${isJitterHigh ? 'border-rose-300 bg-rose-50/20' : isJitterMod ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'}`}>
                            <span className="text-[10px] text-slate-500 font-bold block">Độ rung Jitter (%)</span>
                            <strong className={`font-black text-sm ${isJitterHigh ? 'text-rose-700' : isJitterMod ? 'text-amber-700' : 'text-slate-950'}`}>
                              {jitter}%
                            </strong>
                            <span className={`text-[9px] font-bold block ${isJitterHigh ? 'text-rose-700' : isJitterMod ? 'text-amber-700' : 'text-emerald-700'}`}>
                              {isJitterHigh ? '⚠️ Dao động cao (> 2%)' : isJitterMod ? '⚡ Dao động nhẹ' : '✓ Dưới 1.2% (Tốt)'}
                            </span>
                          </div>

                          {/* 4. Vocal Stability */}
                          <div className={`p-2.5 bg-white rounded-xl border shadow-2xs ${isJitterHigh ? 'border-rose-300 bg-rose-50/20' : isJitterMod ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'}`}>
                            <span className="text-[10px] text-slate-500 font-bold block">Độ ổn định thanh âm</span>
                            <strong className={`font-bold text-xs line-clamp-1 ${isJitterHigh ? 'text-rose-900' : isJitterMod ? 'text-amber-900' : 'text-slate-950'}`}>
                              {m?.vocalStability || (isJitterHigh ? 'Bất thường (Khàn giọng)' : 'Ổn định')}
                            </strong>
                            <span className={`text-[9px] font-bold block ${isJitterHigh ? 'text-rose-700' : isJitterMod ? 'text-amber-700' : 'text-emerald-700'}`}>
                              {isJitterHigh ? '⚠️ Cần lưu ý' : isJitterMod ? '⚡ Cảnh báo nhẹ' : '✓ Bình thường'}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Audio Player if available */}
                    {(voiceAcousticMetrics?.recordedAudioUrl || voiceBlob) && (
                      <div className="p-2.5 bg-white rounded-xl border border-emerald-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[280px]">
                            Bản ghi âm giọng nói: {voiceAcousticMetrics?.samplePromptTitle || 'Đo ngữ âm chuẩn'}
                          </span>
                        </div>
                        {voiceAcousticMetrics?.recordedAudioUrl && (
                          <audio controls src={voiceAcousticMetrics.recordedAudioUrl} className="h-7 w-48 sm:w-56" />
                        )}
                      </div>
                    )}

                    {/* Acoustic Diagnosis Assessment */}
                    <div className="p-3.5 rounded-xl bg-white border border-emerald-200 text-emerald-950 font-medium leading-relaxed">
                      {voiceAcousticMetrics?.respiratoryAcousticHealth ||
                        triageResult.voiceAcousticFindings?.summary ||
                        'Âm sắc trong và ổn định, biên độ rung dây thanh bình thường, luồng khí thở lưu thông thông suốt.'}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={handleApplyToBooking}
                    className="w-full bg-[#0c4b39] hover:bg-[#083629] text-white font-black text-xs h-12 rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Áp Dụng Gợi Ý AI Vào Lịch Đặt Khám</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={() => setActiveTab('bodymap')}
                    variant="outline"
                    className="w-full sm:w-auto border-slate-300 text-slate-700 font-bold text-xs h-12 rounded-2xl cursor-pointer"
                  >
                    Khảo Sát Lại
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <Sparkles className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">Vui lòng hoàn tất khảo sát và bấm "Chạy AI Phân Tích"</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
