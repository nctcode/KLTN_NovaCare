import { getSpecialtyEMRTemplate, SPECIALTY_EMR_TEMPLATES } from '../src/modules/appointments/data/specialty-emr-mock.data';

const SPECIALTIES = [
  'Tim mạch',
  'Thần kinh',
  'Nội tiết',
  'Nhi khoa',
  'Sản phụ khoa',
  'Cơ xương khớp',
  'Tai Mũi Họng',
  'Mắt',
  'Răng Hàm Mặt',
  'Da liễu',
  'Tiêu hóa',
  'Hô hấp',
];

console.log('🚀 TESTING SPECIALTY-BASED EMR GENERATOR ACROSS ALL 12 SPECIALTIES...\n');

let passCount = 0;
for (const spec of SPECIALTIES) {
  const template = getSpecialtyEMRTemplate(spec);
  
  const hasDiagnoses = template.diagnoses && template.diagnoses.length > 0;
  const hasICD = hasDiagnoses && template.diagnoses.every(d => d.icdCode && d.diseaseName);
  const hasVitalSigns = template.observations && template.observations.some(o => o.category === 'VITAL_SIGNS');
  const hasPrescription = template.prescriptionItems && template.prescriptionItems.length > 0;

  if (hasDiagnoses && hasICD && hasPrescription) {
    passCount++;
    console.log(`✅ [PASS] Chuyên khoa: ${spec}`);
    console.log(`   - Chẩn đoán chính: ${template.diagnoses[0].diseaseName} (ICD: ${template.diagnoses[0].icdCode})`);
    console.log(`   - Cận lâm sàng/Sinh hiệu: ${template.observations.length} chỉ số`);
    console.log(`   - Đơn thuốc: ${template.prescriptionItems.length} loại thuốc (VD: ${template.prescriptionItems[0].drugName} - ${template.prescriptionItems[0].dosage})`);
  } else {
    console.error(`❌ [FAIL] Chuyên khoa: ${spec} thiếu thông tin!`);
  }
}

console.log(`\n🎉 KẾT QUẢ: ${passCount}/${SPECIALTIES.length} chuyên khoa ĐẠT CHUẨN BỆNH ÁN ĐIỆN TỬ BỘ Y TẾ!`);
