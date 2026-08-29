import { ObservationCategory } from '@prisma/client';

export interface MockDiagnosisItem {
  icdCode: string;
  diseaseName: string;
  isPrimary: boolean;
  note?: string;
}

export interface MockObservationItem {
  category: ObservationCategory;
  code?: string;
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  interpretation?: string;
}

export interface MockPrescriptionItem {
  drugName: string;
  dosage: string;
  usageInstruction: string;
  quantity: number;
  unit: string;
  duration: string;
  note?: string;
}

export interface SpecialtyEMRTemplate {
  chiefComplaint: string;
  clinicalSummary: string;
  diagnoses: MockDiagnosisItem[];
  observations: MockObservationItem[];
  prescriptionItems: MockPrescriptionItem[];
}

/**
 * Danh mục tri thức bệnh án điện tử mô phỏng theo 12+ Chuyên khoa chuẩn Bộ Y tế
 */
export const SPECIALTY_EMR_TEMPLATES: Record<string, SpecialtyEMRTemplate> = {
  // 1. TIM MẠCH
  cardiology: {
    chiefComplaint: 'Khám và theo dõi huyết áp định kỳ, thỉnh thoảng có cảm giác hồi hộp, tức nhẹ vùng ngực trái khi gắng sức',
    clinicalSummary: 'Bệnh nhân tỉnh táo, tiếp xúc tốt. Tiền sử tăng huyết áp 3 năm. Thể trạng trung bình. Tim nhịp đều, T1 T2 rõ, không nghe tiếng thổi bệnh lý. Phổi trong, không rale. Bụng mềm, gan lách không sờ chạm.',
    diagnoses: [
      { icdCode: 'I10', diseaseName: 'Tăng huyết áp vô căn (nguyên phát)', isPrimary: true, note: 'Tăng huyết áp độ 1 - Phân tầng nguy cơ tim mạch trung bình' },
      { icdCode: 'E78.5', diseaseName: 'Tăng lipid máu không đặc hiệu', isPrimary: false, note: 'Rối loạn mỡ máu kèm theo' },
    ],
    observations: [
      { category: ObservationCategory.VITAL_SIGNS, code: 'BP', name: 'Huyết áp', value: '138/86', unit: 'mmHg', referenceRange: '90/60 - 120/80 mmHg', interpretation: 'Tăng nhẹ' },
      { category: ObservationCategory.VITAL_SIGNS, code: 'HR', name: 'Nhịp tim', value: '78', unit: 'nhịp/phút', referenceRange: '60 - 90 nhịp/phút', interpretation: 'Bình thường' },
      { category: ObservationCategory.VITAL_SIGNS, code: 'SPO2', name: 'Độ bão hòa oxy (SpO2)', value: '98', unit: '%', referenceRange: '95 - 100%', interpretation: 'Bình thường' },
      { category: ObservationCategory.VITAL_SIGNS, code: 'BMI', name: 'Chỉ số khối cơ thể (BMI)', value: '23.4', unit: 'kg/m²', referenceRange: '18.5 - 22.9 kg/m²', interpretation: 'Thể trạng tốt' },
      { category: ObservationCategory.LAB_RESULT, code: 'CHOL', name: 'Cholesterol toàn phần', value: '5.82', unit: 'mmol/L', referenceRange: '< 5.2 mmol/L', interpretation: 'Tăng nhẹ' },
      { category: ObservationCategory.LAB_RESULT, code: 'TRIG', name: 'Triglyceride máu', value: '2.14', unit: 'mmol/L', referenceRange: '< 1.7 mmol/L', interpretation: 'Tăng nhẹ' },
      { category: ObservationCategory.IMAGING, code: 'ECG', name: 'Điện tâm đồ 12 chuyển đạo (ECG)', value: 'Nhịp xoang đều, tần số 78 ck/phút, trục trung gian, không có dấu hiệu thiếu máu cơ tim cấp', interpretation: 'Bình thường' },
      { category: ObservationCategory.IMAGING, code: 'ECHO', name: 'Siêu âm tim Doppler màu', value: 'Chức năng tâm thu thất trái bảo tồn EF = 64%, không rối loạn vận động vùng, không hở van tim có ý nghĩa huyết động', interpretation: 'Bình thường' },
    ],
    prescriptionItems: [
      { drugName: 'Amlodipine 5mg', dosage: '5mg', usageInstruction: 'Uống 1 viên vào buổi sáng sau ăn', quantity: 30, unit: 'Viên', duration: '30 ngày', note: 'Theo dõi huyết áp định kỳ mỗi sáng' },
      { drugName: 'Atorvastatin 20mg', dosage: '20mg', usageInstruction: 'Uống 1 viên vào buổi tối trước khi đi ngủ', quantity: 30, unit: 'Viên', duration: '30 ngày', note: 'Hạn chế mỡ động vật và phủ tạng' },
      { drugName: 'Aspirin pH8 81mg', dosage: '81mg', usageInstruction: 'Uống 1 viên sau bữa ăn trưa', quantity: 30, unit: 'Viên', duration: '30 ngày', note: 'Không uống lúc bụng đói' },
    ],
  },

  // 2. THẦN KINH
  neurology: {
    chiefComplaint: 'Đau nửa đầu âm ỉ, hoa mắt chóng mặt khi thay đổi tư thế, khó ngủ kéo dài 2 tuần nay',
    clinicalSummary: 'Bệnh nhân tỉnh táo, định hướng không gian thời gian tốt. Không yếu liệt vận động tứ chi, đồng tử 2 bên đều 2.5mm phản xạ ánh sáng (+). Dấu hiệu màng não (-), nghiệm pháp Romberg (-). Cơ lực 5/5 hai bên.',
    diagnoses: [
      { icdCode: 'G44.2', diseaseName: 'Đau đầu kiểu căng thẳng (Tension headache)', isPrimary: true, note: 'Đau đầu căng cơ do stress và mất ngủ' },
      { icdCode: 'H81.0', diseaseName: 'Hội chứng tiền đình ngoại biên', isPrimary: false, note: 'Thiểu năng tuần hoàn não mức độ nhẹ' },
    ],
    observations: [
      { category: ObservationCategory.VITAL_SIGNS, code: 'BP', name: 'Huyết áp', value: '115/75', unit: 'mmHg', referenceRange: '90/60 - 120/80 mmHg', interpretation: 'Bình thường' },
      { category: ObservationCategory.VITAL_SIGNS, code: 'HR', name: 'Nhịp tim', value: '72', unit: 'nhịp/phút', referenceRange: '60 - 90 nhịp/phút', interpretation: 'Bình thường' },
      { category: ObservationCategory.IMAGING, code: 'MRI_BRAIN', name: 'Chụp cộng hưởng từ sọ não (MRI)', value: 'Nhu mô não không thấy tổn thương xuất huyết hay ổ nhồi máu não cấp tính, hệ thống não thất cân đối', interpretation: 'Bình thường' },
      { category: ObservationCategory.IMAGING, code: 'EEG', name: 'Điện não đồ vi tính (EEG)', value: 'Sóng Alpha ưu thế vùng chẩm, không ghi nhận phóng điện kịch phát dạng động kinh', interpretation: 'Bình thường' },
    ],
    prescriptionItems: [
      { drugName: 'Betaserc (Betahistine) 16mg', dosage: '16mg', usageInstruction: 'Uống 1 viên x 2 lần/ngày sau bữa ăn', quantity: 28, unit: 'Viên', duration: '14 ngày', note: 'Hỗ trợ tuần hoàn tai trong và giảm chóng mặt' },
      { drugName: 'Flunarizine 5mg', dosage: '5mg', usageInstruction: 'Uống 1 viên vào buổi tối trước ngủ', quantity: 14, unit: 'Viên', duration: '14 ngày', note: 'Phòng ngừa cơn đau nửa đầu' },
      { drugName: 'Ginkgo Biloba 120mg', dosage: '120mg', usageInstruction: 'Uống 1 viên vào buổi sáng', quantity: 30, unit: 'Viên', duration: '30 ngày', note: 'Tăng cường tuần hoàn vi mạch não' },
    ],
  },

  // 3. NỘI TIẾT
  endocrinology: {
    chiefComplaint: 'Khám tầm soát và kiểm tra đường huyết định kỳ, khát nước nhiều, sút 2kg trong 1 tháng',
    clinicalSummary: 'Bệnh nhân thể trạng hơi thừa cân, niêm mạc hồng, tuyến giáp không to, không phù. Tim đều, phổi không rale. Mạch mu chân 2 bên bắt rõ. Không có dấu hiệu bàn chân đái tháo đường.',
    diagnoses: [
      { icdCode: 'E11.9', diseaseName: 'Đái tháo đường type 2 không có biến chứng', isPrimary: true, note: 'Đường huyết chưa kiểm soát tối ưu' },
      { icdCode: 'E78.2', diseaseName: 'Tăng lipid máu hỗn hợp', isPrimary: false, note: 'Rối loạn chuyển hóa mỡ' },
    ],
    observations: [
      { category: ObservationCategory.VITAL_SIGNS, code: 'BP', name: 'Huyết áp', value: '125/80', unit: 'mmHg', referenceRange: '90/60 - 120/80 mmHg', interpretation: 'Bình thường' },
      { category: ObservationCategory.VITAL_SIGNS, code: 'BMI', name: 'Chỉ số khối cơ thể (BMI)', value: '25.2', unit: 'kg/m²', referenceRange: '18.5 - 22.9 kg/m²', interpretation: 'Thừa cân độ 1' },
      { category: ObservationCategory.LAB_RESULT, code: 'GLU_FAST', name: 'Đường huyết lúc đói (Fasting Glucose)', value: '7.8', unit: 'mmol/L', referenceRange: '3.9 - 6.4 mmol/L', interpretation: 'Tăng' },
      { category: ObservationCategory.LAB_RESULT, code: 'HBA1C', name: 'Chỉ số HbA1c', value: '7.4', unit: '%', referenceRange: '4.0 - 6.0%', interpretation: 'Tăng vừa' },
      { category: ObservationCategory.LAB_RESULT, code: 'CREAT', name: 'Creatinine huyết thanh', value: '78', unit: 'µmol/L', referenceRange: '53 - 106 µmol/L', interpretation: 'Bình thường' },
      { category: ObservationCategory.IMAGING, code: 'THYROID_US', name: 'Siêu âm tuyến giáp', value: 'Hai thùy tuyến giáp kích thước bình thường, nhu mô đồng nhất, TIRADS 1', interpretation: 'Bình thường' },
    ],
    prescriptionItems: [
      { drugName: 'Metformin HCl 850mg (Glucophage)', dosage: '850mg', usageInstruction: 'Uống 1 viên x 2 lần/ngày ngay sau bữa ăn', quantity: 60, unit: 'Viên', duration: '30 ngày', note: 'Kiêng đồ ngọt, hạn chế tinh bột, tập thể dục 30 phút/ngày' },
      { drugName: 'Gliclazide MR 30mg (Diamicron MR)', dosage: '30mg', usageInstruction: 'Uống 1 viên vào buổi sáng trước ăn 15 phút', quantity: 30, unit: 'Viên', duration: '30 ngày', note: 'Phòng ngừa hạ đường huyết khi bỏ bữa' },
      { drugName: 'Rosuvastatin 10mg', dosage: '10mg', usageInstruction: 'Uống 1 viên vào buổi tối', quantity: 30, unit: 'Viên', duration: '30 ngày', note: 'Kiểm soát lipid máu' },
    ],
  },

  // 4. NHI KHOA
  pediatrics: {
    chiefComplaint: 'Bé ho đờm, chảy nước mũi trong, sốt nhẹ 38.2°C từng cơn 2 ngày nay, bú kém',
    clinicalSummary: 'Bé tỉnh, quấy khóc nhẹ khi khám. Họng đỏ nhẹ, không có mủ. Thở đều, không rút lõm lồng ngực, nhịp thở 28 lần/phút. Phổi nghe thông khí tốt, có ít rale ẩm rải rác 2 phế trường. Bụng mềm, thóp phẳng.',
    diagnoses: [
      { icdCode: 'J20.9', diseaseName: 'Viêm phế quản cấp tính ở trẻ em', isPrimary: true, note: 'Theo dõi nguyên nhân do virus' },
      { icdCode: 'J00', diseaseName: 'Viêm mũi họng cấp tính (Cảm lạnh thông thường)', isPrimary: false, note: 'Bội nhiễm nhẹ' },
    ],
    observations: [
      { category: ObservationCategory.VITAL_SIGNS, code: 'TEMP', name: 'Thân nhiệt', value: '38.2', unit: '°C', referenceRange: '36.5 - 37.5°C', interpretation: 'Sốt vừa' },
      { category: ObservationCategory.VITAL_SIGNS, code: 'WEIGHT', name: 'Cân nặng', value: '14.5', unit: 'kg', referenceRange: '13.0 - 16.0 kg', interpretation: 'Chuẩn theo độ tuổi' },
      { category: ObservationCategory.VITAL_SIGNS, code: 'SPO2', name: 'Độ bão hòa oxy (SpO2)', value: '98', unit: '%', referenceRange: '96 - 100%', interpretation: 'Bình thường' },
      { category: ObservationCategory.LAB_RESULT, code: 'CBC_WBC', name: 'Bạch cầu tổng số (WBC)', value: '9.2', unit: 'G/L', referenceRange: '5.0 - 12.0 G/L', interpretation: 'Bình thường' },
      { category: ObservationCategory.LAB_RESULT, code: 'CRP', name: 'CRP định lượng', value: '4.8', unit: 'mg/L', referenceRange: '< 5.0 mg/L', interpretation: 'Bình thường' },
      { category: ObservationCategory.IMAGING, code: 'CHEST_XRAY', name: 'X-quang ngực thẳng trẻ em', value: 'Rốn phổi 2 bên đậm nhẹ, nhu mô phổi không thấy tổn thương đông đặc khu trú', interpretation: 'Hình ảnh viêm phế quản' },
    ],
    prescriptionItems: [
      { drugName: 'Cefixime 100mg/5ml (Siro)', dosage: '5ml', usageInstruction: 'Uống 5ml x 2 lần/ngày sau khi ăn no', quantity: 1, unit: 'Chai', duration: '7 ngày', note: 'Uống đúng giờ và đủ liệu trình 7 ngày' },
      { drugName: 'Hapacol 250mg (Gói bột sủi)', dosage: '250mg', usageInstruction: 'Pha 1 gói với nước ấm khi sốt ≥ 38.5°C', quantity: 10, unit: 'Gói', duration: '5 ngày', note: 'Mỗi lần cách nhau tối thiểu 4 - 6 giờ' },
      { drugName: 'Siro ho thảo dược Prospan 100ml', dosage: '3.5ml', usageInstruction: 'Uống 3.5ml x 3 lần/ngày', quantity: 1, unit: 'Chai', duration: '7 ngày', note: 'Lắc kỹ trước khi dùng' },
      { drugName: 'Men vi sinh Enterogermina 2 tỷ bào tử/5ml', dosage: '5ml', usageInstruction: 'Uống 1 ống/ngày trước bữa ăn', quantity: 10, unit: 'Ống', duration: '10 ngày', note: 'Uống cách kháng sinh 2 giờ' },
    ],
  },

  // 5. SẢN PHỤ KHOA
  obstetrics: {
    chiefComplaint: 'Khám thai định kỳ tuần thứ 24, tầm soát hình thái học và kiểm tra sức khỏe mẹ và bé',
    clinicalSummary: 'Sản phụ toàn trạng tốt, không phù, không nhức đầu hoa mắt. Bề cao tử cung phù hợp tuổi thai 24 tuần. Tim thai rõ 145 lần/phút. Cổ tử cung đóng kín, chiều dài kênh cổ tử cung 38mm.',
    diagnoses: [
      { icdCode: 'Z34.8', diseaseName: 'Giám sát thai kỳ bình thường khác (Thai 24 tuần)', isPrimary: true, note: 'Thai đơn, phát triển tương đương tuổi thai' },
      { icdCode: 'D50.9', diseaseName: 'Thiếu máu do thiếu sắt không đặc hiệu', isPrimary: false, note: 'Thiếu máu nhẹ trong thai kỳ' },
    ],
    observations: [
      { category: ObservationCategory.VITAL_SIGNS, code: 'BP', name: 'Huyết áp mẹ', value: '110/70', unit: 'mmHg', referenceRange: '90/60 - 120/80 mmHg', interpretation: 'Bình thường' },
      { category: ObservationCategory.VITAL_SIGNS, code: 'FETAL_HR', name: 'Nhịp tim thai', value: '145', unit: 'nhịp/phút', referenceRange: '120 - 160 nhịp/phút', interpretation: 'Tim thai tốt, đều' },
      { category: ObservationCategory.LAB_RESULT, code: 'HGB', name: 'Huyết sắc tố (Hemoglobin)', value: '112', unit: 'g/L', referenceRange: '110 - 150 g/L', interpretation: 'Bình thường' },
      { category: ObservationCategory.LAB_RESULT, code: 'URINE_PROT', name: 'Protein nước tiểu', value: 'Âm tính (Negative)', interpretation: 'Không có dấu hiệu tiền sản giật' },
      { category: ObservationCategory.IMAGING, code: 'US_4D', name: 'Siêu âm 4D hình thái thai nhi', value: '01 thai sống trong buồng tử cung ngôi đầu. Ước lượng cân nặng 650g, các cơ quan hình thái học (não, tim 4 buồng, cột sống, môi, tứ chi) chưa thấy bất thường', interpretation: 'Thai phát triển tốt' },
    ],
    prescriptionItems: [
      { drugName: 'Ferrovit (Sắt + Acid Folic)', dosage: '1 viên', usageInstruction: 'Uống 1 viên vào buổi sáng sau ăn 1 giờ', quantity: 30, unit: 'Viên', duration: '30 ngày', note: 'Không uống chung với sữa hoặc trà/cà phê' },
      { drugName: 'Canxi Corbiere 10ml', dosage: '10ml', usageInstruction: 'Uống 1 ống vào buổi trưa sau ăn', quantity: 30, unit: 'Ống', duration: '30 ngày', note: 'Bổ sung đầy đủ nước' },
      { drugName: 'Elevit Multivitamin cho bà bầu', dosage: '1 viên', usageInstruction: 'Uống 1 viên vào buổi sáng', quantity: 30, unit: 'Viên', duration: '30 ngày', note: 'Duy trì đều đặn suốt thai kỳ' },
    ],
  },

  // 6. CƠ XƯƠNG KHỚP
  orthopedics: {
    chiefComplaint: 'Đau mỏi hai khớp gối tăng lên khi lên xuống cầu thang, lục cục khớp gối khi vận động, đau lưng dưới',
    clinicalSummary: 'Hai khớp gối không sưng đỏ, không nóng, có tiếng lạo xạo khớp khi vận động gấp duỗi. Dấu hiệu ngăn kéo (-), bập bềnh xương bánh chè (-). Cột sống thắt lưng co cứng nhẹ cơ cạnh sống, Schober 14/10cm, Lasegue (-) 2 bên.',
    diagnoses: [
      { icdCode: 'M17.0', diseaseName: 'Thoái hóa khớp gối nguyên phát hai bên', isPrimary: true, note: 'Giai đoạn 2 theo phân loại Kellgren-Lawrence' },
      { icdCode: 'M54.5', diseaseName: 'Đau vùng thắt lưng cơ năng (Low back pain)', isPrimary: false, note: 'Hội chứng đau cơ mạc' },
    ],
    observations: [
      { category: ObservationCategory.VITAL_SIGNS, code: 'BP', name: 'Huyết áp', value: '128/82', unit: 'mmHg', referenceRange: '90/60 - 120/80 mmHg', interpretation: 'Bình thường' },
      { category: ObservationCategory.LAB_RESULT, code: 'URIC', name: 'Axit Uric máu', value: '380', unit: 'µmol/L', referenceRange: '200 - 420 µmol/L', interpretation: 'Bình thường' },
      { category: ObservationCategory.IMAGING, code: 'XRAY_KNEE', name: 'X-quang khớp gối thẳng nghiêng 2 bên', value: 'Gai xương nhẹ bờ mâm chày và xương bánh chè, hẹp nhẹ khe khớp gối trong 2 bên, không loãng xương rõ', interpretation: 'Thoái hóa khớp gối độ 2' },
      { category: ObservationCategory.IMAGING, code: 'XRAY_SPINE', name: 'X-quang cột sống thắt lưng', value: 'Thoái hóa nhẹ đốt sống L4-L5, chiều cao các thân đốt sống được bảo tồn', interpretation: 'Thoái hóa cột sống nhẹ' },
    ],
    prescriptionItems: [
      { drugName: 'Celecoxib 200mg (Celebrex)', dosage: '200mg', usageInstruction: 'Uống 1 viên x 1 lần/ngày sau bữa ăn', quantity: 14, unit: 'Viên', duration: '14 ngày', note: 'Kháng viêm giảm đau khớp, uống khi no' },
      { drugName: 'Glucosamine Sulfate 1500mg (Viartril-S)', dosage: '1500mg', usageInstruction: 'Pha 1 gói với 1 ly nước uống hàng ngày', quantity: 30, unit: 'Gói', duration: '30 ngày', note: 'Nuôi dưỡng và tái tạo sụn khớp' },
      { drugName: 'Eperisone HCl 50mg (Myonal)', dosage: '50mg', usageInstruction: 'Uống 1 viên x 2 lần/ngày sau ăn', quantity: 28, unit: 'Viên', duration: '14 ngày', note: 'Giãn cơ giảm co cứng vùng thắt lưng' },
    ],
  },

  // 7. TAI MŨI HỌNG
  ent: {
    chiefComplaint: 'Nghẹt mũi chảy dịch nhầy, đau nhức vùng trán và hai bên má, họng rát đắng về sáng',
    clinicalSummary: 'Nội soi Tai Mũi Họng: Niêm mạc mũi xung huyết đỏ, cuốn mũi dưới 2 bên quá phát, khe giữa 2 bên có nhiều dịch nhầy đọng. Vách ngăn vẹo nhẹ sang trái. Họng niêm mạc đỏ, thành sau họng nhiều tổ chức lympho viêm hạt. Hai màng nhĩ sáng, nón sáng rõ.',
    diagnoses: [
      { icdCode: 'J32.0', diseaseName: 'Viêm xoang hàm mạn tính tái phát đợt cấp', isPrimary: true, note: 'Viêm đa xoang dị ứng bội nhiễm' },
      { icdCode: 'J31.2', diseaseName: 'Viêm họng mạn tính (Viêm họng hạt)', isPrimary: false, note: 'Do trào ngược dịch mũi sau' },
    ],
    observations: [
      { category: ObservationCategory.VITAL_SIGNS, code: 'TEMP', name: 'Thân nhiệt', value: '37.2', unit: '°C', referenceRange: '36.5 - 37.5°C', interpretation: 'Bình thường' },
      { category: ObservationCategory.IMAGING, code: 'ENT_ENDOSCOPY', name: 'Nội soi Tai Mũi Họng bằng ống mềm', value: 'Khe giữa 2 bên nhiều mủ nhầy, niêm mạc phù nề, vòm họng thông thoáng không u sùi, thanh dây thanh khép kín', interpretation: 'Viêm mũi xoang xuất tiết' },
    ],
    prescriptionItems: [
      { drugName: 'Augmentin 1g (Amoxicillin + Clavulanate)', dosage: '1000mg', usageInstruction: 'Uống 1 viên x 2 lần/ngày ngay đầu bữa ăn', quantity: 14, unit: 'Viên', duration: '7 ngày', note: 'Uống đủ 7 ngày liên tục' },
      { drugName: 'Thuốc xịt mũi Flixonase 0.05%', dosage: '50mcg/nhát', usageInstruction: 'Xịt mỗi bên mũi 1 nhát vào buổi sáng', quantity: 1, unit: 'Chai', duration: '30 ngày', note: 'Xịt thẳng góc, hít nhẹ nhàng' },
      { drugName: 'Alpha Choay (Chymotrypsin)', dosage: '2 viên', usageInstruction: 'Ngậm dưới lưỡi 2 viên x 3 lần/ngày', quantity: 30, unit: 'Viên', duration: '5 ngày', note: 'Chống phù nề niêm mạc mũi họng' },
      { drugName: 'Nước muối sinh lý xịt mũi Xisat', dosage: '75ml', usageInstruction: 'Xịt rửa mũi 3 - 4 lần/ngày trước khi xịt thuốc', quantity: 1, unit: 'Chai', duration: '15 ngày', note: 'Vệ sinh đường thở' },
    ],
  },

  // 8. MẮT (OPHTHALMOLOGY)
  ophthalmology: {
    chiefComplaint: 'Nhìn mờ khi nhìn xa, mỏi mắt, khô cộm mắt sau khi làm việc máy tính nhiều giờ liên tục',
    clinicalSummary: 'Khám mắt toàn diện: Kết mạc 2 mắt cương tụ nhẹ, giác mạc trong suốt biểu mô nguyên vẹn. Tiền phòng sâu sạch, đồng tử tròn 3mm phản xạ ánh sáng tốt. Thể thủy tinh trong suốt, đáy mắt gai thị hồng bờ rõ, tỷ lệ C/D = 0.3.',
    diagnoses: [
      { icdCode: 'H52.2', diseaseName: 'Tật khúc xạ loạn thị kết hợp cận thị', isPrimary: true, note: 'Mắt phải: -1.75 Diop (-0.50 Cyl), Mắt trái: -2.00 Diop (-0.75 Cyl)' },
      { icdCode: 'H04.1', diseaseName: 'Hội chứng khô mắt (Dry eye syndrome)', isPrimary: false, note: 'Khô mắt do hội chứng thị giác màn hình máy tính' },
    ],
    observations: [
      { category: ObservationCategory.VITAL_SIGNS, code: 'VA_RIGHT', name: 'Thị lực mắt phải (không kính)', value: '3/10', interpretation: 'Giảm thị lực' },
      { category: ObservationCategory.VITAL_SIGNS, code: 'VA_LEFT', name: 'Thị lực mắt trái (không kính)', value: '2/10', interpretation: 'Giảm thị lực' },
      { category: ObservationCategory.VITAL_SIGNS, code: 'VA_CORRECTED', name: 'Thị lực sau chỉnh kính tối ưu', value: '10/10 (Cả 2 mắt)', interpretation: 'Đạt thị lực tối đa' },
      { category: ObservationCategory.IMAGING, code: 'IOP', name: 'Đo nhãn áp không tiếp xúc (IOP)', value: 'Mắt phải: 14 mmHg | Mắt trái: 15 mmHg', unit: 'mmHg', referenceRange: '10 - 21 mmHg', interpretation: 'Nhãn áp bình thường' },
      { category: ObservationCategory.IMAGING, code: 'FUNDUS', name: 'Soi đáy mắt trực tiếp', value: 'Võng mạc áp phẳng, mạch máu võng mạc bình thường, không có dấu hiệu thoái hóa hoàng điểm', interpretation: 'Bình thường' },
    ],
    prescriptionItems: [
      { drugName: 'Nước mắt nhân tạo Sanlein 0.1% (Sodium Hyaluronate)', dosage: '5ml', usageInstruction: 'Nhỏ mỗi mắt 1 giọt x 4 - 6 lần/ngày khi cộm khô', quantity: 2, unit: 'Chai', duration: '30 ngày', note: 'Tránh để đầu lọ thuốc chạm vào lông mi' },
      { drugName: 'Dung dịch nhỏ mắt Tobradex 5ml', dosage: '5ml', usageInstruction: 'Nhỏ 1 giọt x 2 lần/ngày', quantity: 1, unit: 'Chai', duration: '5 ngày', note: 'Chỉ dùng đúng 5 ngày theo chỉ định' },
      { drugName: 'Viên uống bổ mắt Ocuvite Lutein', dosage: '1 viên', usageInstruction: 'Uống 1 viên vào buổi sáng sau ăn', quantity: 30, unit: 'Viên', duration: '30 ngày', note: 'Áp dụng quy tắc 20-20-20 khi dùng màn hình' },
    ],
  },

  // 9. RĂNG HÀM MẶT
  dental: {
    chiefComplaint: 'Đau buốt răng hàm dưới bên phải khi uống nước lạnh, chảy máu chân răng khi đánh răng',
    clinicalSummary: 'Khám Răng Hàm Mặt: Răng 46 sâu mặt nhai ngà sâu, gõ không đau, thử tủy (+). Cao răng mảng bám độ II quanh cổ răng toàn hàm, lợi cương tụ đỏ nhẹ, chảy máu khi thăm khám túi lợi (BOP +). Khớp cắn chuẩn.',
    diagnoses: [
      { icdCode: 'K02.1', diseaseName: 'Sâu răng ở ngà răng (Răng 46)', isPrimary: true, note: 'Sâu ngà sâu chưa hở tủy' },
      { icdCode: 'K05.1', diseaseName: 'Viêm lợi mạn tính do mảng bám', isPrimary: false, note: 'Cần lấy cao răng và vệ sinh nha chu' },
    ],
    observations: [
      { category: ObservationCategory.VITAL_SIGNS, code: 'BP', name: 'Huyết áp', value: '120/80', unit: 'mmHg', referenceRange: '90/60 - 120/80 mmHg', interpretation: 'Bình thường' },
      { category: ObservationCategory.IMAGING, code: 'DENTAL_PANORAMA', name: 'Chụp X-quang răng toàn cảnh (Panorama)', value: 'Răng 46 thấu quang mặt nhai sát buồng tủy, cuống răng chưa có tổn thương tiêu xương. Không có răng ngầm bất thường', interpretation: 'Sâu ngà sâu R46' },
    ],
    prescriptionItems: [
      { drugName: 'Rodogyl (Spiramycin + Metronidazole)', dosage: '2 viên', usageInstruction: 'Uống 2 viên x 2 lần/ngày sau bữa ăn', quantity: 20, unit: 'Viên', duration: '5 ngày', note: 'Kháng sinh đặc trị vi khuẩn kỵ khí vùng răng miệng' },
      { drugName: 'Paracetamol 500mg (Efferalgan)', dosage: '500mg', usageInstruction: 'Uống 1 viên khi đau nhức nhiều', quantity: 10, unit: 'Viên', duration: '5 ngày', note: 'Cách nhau tối thiểu 4 - 6 giờ' },
      { drugName: 'Nước súc miệng diệt khuẩn Kin Gingival (Chlorhexidine 0.12%)', dosage: '250ml', usageInstruction: 'Súc miệng 15ml x 2 lần/ngày sau khi đánh răng 30 giây', quantity: 1, unit: 'Chai', duration: '14 ngày', note: 'Không nuốt nước súc miệng' },
    ],
  },

  // 10. DA LIỄU
  dermatology: {
    chiefComplaint: 'Nổi các mảng dát đỏ ngứa ngáy nhiều ở vùng mặt trong cẳng tay và đùi, tróc vảy mỏng 4 ngày nay',
    clinicalSummary: 'Tổn thương da dạng dát sẩn đỏ rải rác đối xứng 2 bên, bờ không đều, bề mặt có ít vảy mịn và vết cào gãi rớm máu nhẹ. Không có mụn mủ, không trợt loét rỉ dịch. Nghiệm pháp vạch da nổi (+).',
    diagnoses: [
      { icdCode: 'L20.8', diseaseName: 'Viêm da cơ địa dị ứng giai đoạn bán cấp', isPrimary: true, note: 'Kích ứng thời tiết và cơ địa dị ứng' },
      { icdCode: 'L29.9', diseaseName: 'Ngứa da không đặc hiệu', isPrimary: false, note: 'Tăng cảm giác ngứa về đêm' },
    ],
    observations: [
      { category: ObservationCategory.VITAL_SIGNS, code: 'TEMP', name: 'Thân nhiệt', value: '36.8', unit: '°C', referenceRange: '36.5 - 37.5°C', interpretation: 'Bình thường' },
      { category: ObservationCategory.LAB_RESULT, code: 'SKIN_SCRAPING', name: 'Soi tươi tìm nấm da (KOH)', value: 'Âm tính (Không tìm thấy sợi nấm hay bào tử nấm)', interpretation: 'Không nhiễm nấm' },
      { category: ObservationCategory.LAB_RESULT, code: 'IGE', name: 'Định lượng kháng thể IgE toàn phần', value: '185', unit: 'IU/mL', referenceRange: '< 100 IU/mL', interpretation: 'Tăng - Cơ địa dị ứng' },
    ],
    prescriptionItems: [
      { drugName: 'Telfast HD (Fexofenadine) 180mg', dosage: '180mg', usageInstruction: 'Uống 1 viên vào buổi tối trước khi đi ngủ', quantity: 14, unit: 'Viên', duration: '14 ngày', note: 'Thuốc kháng Histamin thế hệ mới không gây buồn ngủ' },
      { drugName: 'Kem bôi da Eumovate (Clobetasone Butyrate 0.05%)', dosage: '15g', usageInstruction: 'Thoa một lớp mỏng lên vùng tổn thương 2 lần/ngày', quantity: 1, unit: 'Tuýp', duration: '7 ngày', note: 'Không thoa lên vết thương hở sâu hay niêm mạc mắt' },
      { drugName: 'Kem dưỡng ẩm phục hồi da Cerave Moisturizing Cream', dosage: '50ml', usageInstruction: 'Thoa toàn thân sau khi tắm và khi da khô', quantity: 1, unit: 'Tuýp', duration: '30 ngày', note: 'Duy trì độ ẩm tự nhiên cho da' },
    ],
  },

  // 11. TIÊU HÓA
  gastroenterology: {
    chiefComplaint: 'Đau âm ỉ và cồn cào vùng thượng vị sau khi ăn no hoặc lúc đói, ợ chua, nóng rát sau xương ức',
    clinicalSummary: 'Bệnh nhân thể trạng trung bình, niêm mạc hồng hào. Khám bụng: Bụng mềm, ấn tức nhẹ điểm thượng vị, không có đề kháng thành bụng. Gan lách không sờ thấy, nghiệm pháp Murphy (-). Tiếng nhu động ruột bình thường 6 lần/phút.',
    diagnoses: [
      { icdCode: 'K21.9', diseaseName: 'Bệnh trào ngược dạ dày - thực quản (GERD)', isPrimary: true, note: 'Mức độ A theo phân loại Los Angeles' },
      { icdCode: 'K29.7', diseaseName: 'Viêm dạ dày không đặc hiệu (Nghiễm HP (+))', isPrimary: false, note: 'Viêm trợt hang vị dạ dày' },
    ],
    observations: [
      { category: ObservationCategory.VITAL_SIGNS, code: 'BP', name: 'Huyết áp', value: '118/76', unit: 'mmHg', referenceRange: '90/60 - 120/80 mmHg', interpretation: 'Bình thường' },
      { category: ObservationCategory.VITAL_SIGNS, code: 'HR', name: 'Nhịp tim', value: '74', unit: 'nhịp/phút', referenceRange: '60 - 90 nhịp/phút', interpretation: 'Bình thường' },
      { category: ObservationCategory.LAB_RESULT, code: 'HP_TEST', name: 'Xét nghiệm vi khuẩn Helicobacter pylori (Urease Test)', value: 'Dương tính (Positive +)', interpretation: 'Có nhiễm vi khuẩn HP dạ dày' },
      { category: ObservationCategory.IMAGING, code: 'GASTRO_ENDOSCOPY', name: 'Nội soi dạ dày tá tràng không đau', value: 'Tâm vị đóng không kín, niêm mạc thực quản đoạn 1/3 dưới trợt nhẹ dài < 5mm. Hang vị phù nề sung huyết dạng chấm đỏ, môn vị co bóp tốt, tá tràng bình thường', interpretation: 'Viêm thực quản trào ngược độ A + Viêm trợt hang vị' },
      { category: ObservationCategory.IMAGING, code: 'ABDOMINAL_US', name: 'Siêu âm ổ bụng tổng quát', value: 'Gan, mật, tụy, lách, thận 2 bên cấu trúc đồng nhất, không có sỏi, không có dịch tự do ổ bụng', interpretation: 'Bình thường' },
    ],
    prescriptionItems: [
      { drugName: 'Nexium 40mg (Esomeprazole)', dosage: '40mg', usageInstruction: 'Uống 1 viên vào buổi sáng trước bữa ăn 30 phút', quantity: 28, unit: 'Viên', duration: '28 ngày', note: 'Ức chế tiết axit dịch vị tối ưu' },
      { drugName: 'Gaviscon Dual Action (Gói gel 10ml)', dosage: '10ml', usageInstruction: 'Uống 1 gói sau 3 bữa ăn chính và trước khi ngủ', quantity: 24, unit: 'Gói', duration: '7 ngày', note: 'Tạo lớp màng bảo vệ niêm mạc thực quản' },
      { drugName: 'Duspatalin 200mg (Mebeverine)', dosage: '200mg', usageInstruction: 'Uống 1 viên x 2 lần/ngày trước bữa ăn 20 phút', quantity: 28, unit: 'Viên', duration: '14 ngày', note: 'Giảm co thắt cơ trơn đường tiêu hóa' },
    ],
  },

  // 12. HÔ HẤP
  pulmonology: {
    chiefComplaint: 'Khó thở từng cơn về đêm và sáng sớm, thở khò khè, ho có đờm trắng dính sau khi hít phải bụi lạnh',
    clinicalSummary: 'Bệnh nhân tỉnh, nhịp thở 22 lần/phút, không co kéo cơ hô hấp phụ. Phổi nghe rì rào phế nang êm dịu, có tiếng rít và rale ngáy thì thở ra rải rác 2 bên phế trường. Tim đều T1 T2 rõ. Huyết động ổn định.',
    diagnoses: [
      { icdCode: 'J45.9', diseaseName: 'Hen phế quản (Khí phế thũng / Khò khè tái diễn)', isPrimary: true, note: 'Hen phế quản dạng dị ứng kiểm soát một phần' },
      { icdCode: 'J30.1', diseaseName: 'Viêm mũi dị ứng do phấn hoa và bụi nhà', isPrimary: false, note: 'Bệnh kèm theo' },
    ],
    observations: [
      { category: ObservationCategory.VITAL_SIGNS, code: 'SPO2', name: 'Độ bão hòa oxy trong máu (SpO2)', value: '97', unit: '%', referenceRange: '95 - 100%', interpretation: 'Bình thường' },
      { category: ObservationCategory.VITAL_SIGNS, code: 'RR', name: 'Nhịp thở', value: '22', unit: 'lần/phút', referenceRange: '16 - 20 lần/phút', interpretation: 'Tăng nhẹ' },
      { category: ObservationCategory.LAB_RESULT, code: 'SPIROMETRY', name: 'Đo chức năng thông khí phổi (Spirometry)', value: 'FEV1/FVC = 68% (Hội chứng tắc nghẽn thông khí mức độ nhẹ), test hồi phục phế quản với Salbutamol dương tính (+14%)', interpretation: 'Rối loạn thông khí tắc nghẽn có hồi phục' },
      { category: ObservationCategory.IMAGING, code: 'CHEST_XRAY', name: 'X-quang ngực thẳng kỹ thuật số (DR)', value: 'Trường phổi 2 bên sáng nhẹ, rốn phổi đậm, không thấy hình ảnh đông đặc nhu mô phổi hay tràn khí màng phổi', interpretation: 'Hình ảnh ứ khí nhẹ' },
    ],
    prescriptionItems: [
      { drugName: 'Bình xịt Seretide Evohaler 25/125mcg (Salmeterol + Fluticasone)', dosage: '25/125mcg', usageInstruction: 'Hít 2 nhát x 2 lần/ngày (sáng và tối)', quantity: 1, unit: 'Bình', duration: '30 ngày', note: 'Súc miệng sạch bằng nước ấm sau khi hít thuốc' },
      { drugName: 'Singulair 10mg (Montelukast)', dosage: '10mg', usageInstruction: 'Uống 1 viên vào buổi tối trước khi đi ngủ', quantity: 30, unit: 'Viên', duration: '30 ngày', note: 'Kháng thụ thể Leukotriene giảm co thắt' },
      { drugName: 'Ventolin Inhaler 100mcg (Salbutamol xịt cắt cơn)', dosage: '100mcg/nhát', usageInstruction: 'Xịt 2 nhát khi khó thở cấp tính', quantity: 1, unit: 'Bình', duration: 'Khi cần', note: 'Mang theo bên người phòng cơn hen cấp' },
    ],
  },
};

/**
 * Trả về template bệnh án điện tử phù hợp nhất dựa trên tên chuyên khoa
 */
export function getSpecialtyEMRTemplate(specialtyName: string): SpecialtyEMRTemplate {
  const norm = (specialtyName || '').toLowerCase().trim();

  if (norm.includes('tim') || norm.includes('cardio') || norm.includes('mạch')) {
    return SPECIALTY_EMR_TEMPLATES.cardiology;
  }
  if (norm.includes('thần kinh') || norm.includes('neuro') || norm.includes('não')) {
    return SPECIALTY_EMR_TEMPLATES.neurology;
  }
  if (norm.includes('nội tiết') || norm.includes('tiểu đường') || norm.includes('đái tháo đường') || norm.includes('endo')) {
    return SPECIALTY_EMR_TEMPLATES.endocrinology;
  }
  if (norm.includes('nhi') || norm.includes('pedia') || norm.includes('trẻ em')) {
    return SPECIALTY_EMR_TEMPLATES.pediatrics;
  }
  if (norm.includes('sản') || norm.includes('phụ khoa') || norm.includes('thai') || norm.includes('obste') || norm.includes('gyne')) {
    return SPECIALTY_EMR_TEMPLATES.obstetrics;
  }
  if (norm.includes('xương') || norm.includes('khớp') || norm.includes('cột sống') || norm.includes('ortho')) {
    return SPECIALTY_EMR_TEMPLATES.orthopedics;
  }
  if (norm.includes('tai') || norm.includes('mũi') || norm.includes('họng') || norm.includes('ent')) {
    return SPECIALTY_EMR_TEMPLATES.ent;
  }
  if (norm.includes('mắt') || norm.includes('nhãn') || norm.includes('opht')) {
    return SPECIALTY_EMR_TEMPLATES.ophthalmology;
  }
  if (norm.includes('răng') || norm.includes('hàm') || norm.includes('mặt') || norm.includes('nha') || norm.includes('dental')) {
    return SPECIALTY_EMR_TEMPLATES.dental;
  }
  if (norm.includes('da') || norm.includes('derma') || norm.includes('liễu')) {
    return SPECIALTY_EMR_TEMPLATES.dermatology;
  }
  if (norm.includes('tiêu hóa') || norm.includes('dạ dày') || norm.includes('gastro') || norm.includes('ruột')) {
    return SPECIALTY_EMR_TEMPLATES.gastroenterology;
  }
  if (norm.includes('hô hấp') || norm.includes('phổi') || norm.includes('pulmo') || norm.includes('hen')) {
    return SPECIALTY_EMR_TEMPLATES.pulmonology;
  }

  // Default: Nội tổng quát / Tiêu hóa
  return SPECIALTY_EMR_TEMPLATES.gastroenterology;
}
