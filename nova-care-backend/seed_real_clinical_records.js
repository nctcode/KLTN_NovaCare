const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING CLINICAL DATA & AUDIT LOG SEEDING ---');

  // 1. Dọn dẹp các log cũ chứa chữ Test hoặc lỗi font ký tự hỏi chấm
  const deletedOldLogs = await prisma.medicalPassportAccessLog.deleteMany({
    where: {
      OR: [
        { userAgent: { contains: 'Test' } },
        { userAgent: { contains: 'Nguy?n' } },
        { userAgent: { contains: 'lin' } },
        { userAgent: { contains: 'H?i' } },
        { userAgent: { contains: 'di?u' } },
      ],
    },
  });
  console.log(`Đã dọn dẹp ${deletedOldLogs.count} nhật ký test/lỗi font cũ.`);

  // 2. Lấy bệnh nhân Nguyễn Văn An (079088012345)
  const patientAn = await prisma.patientProfile.findFirst({
    where: { identityNumber: '079088012345' },
    include: {
      user: true,
      appointments: {
        include: {
          slot: {
            include: {
              doctorWorkplace: {
                include: {
                  doctor: true,
                  hospital: true,
                  specialty: true,
                },
              },
            },
          },
          medicalEncounter: true,
        },
      },
    },
  });

  if (!patientAn) {
    console.error('Không tìm thấy bệnh nhân Nguyễn Văn An (079088012345)!');
    return;
  }

  console.log(`Tìm thấy bệnh nhân: ${patientAn.fullName} (${patientAn.identityNumber})`);

  // Lấy các bệnh viện và bác sĩ mẫu
  const hospSaiGon = await prisma.hospital.findFirst({ where: { name: { contains: 'Sài Gòn' } } });
  const hospCentral = await prisma.hospital.findFirst({ where: { name: { contains: 'Central' } } });
  const hospTanBinh = await prisma.hospital.findFirst({ where: { name: { contains: 'Tân Bình' } } });
  const hospLife = await prisma.hospital.findFirst({ where: { name: { contains: 'NovaLife' } } });

  // 3. Chuẩn bị kịch bản bệnh án thực thụ cho từng chuyên khoa
  const clinicalScenarios = [
    {
      specialty: 'Hô hấp',
      icdList: [
        { icdCode: 'J45.0', diseaseName: 'Hen phế quản thể dị ứng nguyên phát', isPrimary: true },
        { icdCode: 'J06.9', diseaseName: 'Nhiễm khuẩn đường hô hấp trên cấp tính', isPrimary: false },
      ],
      complaint: 'Khó thở từng cơn về đêm, kèm ho khan và tức nặng ngực 3 ngày nay',
      clinicalSummary: 'Bệnh nhân có tiền sử dị ứng thời tiết và hen phế quản nhẹ từ nhỏ. Đợt này tiếp xúc khói bụi nhiều xuất hiện khó thở thì thở ra, ran rít hai phế trường.',
      physicalExam: 'Toàn thân tỉnh táo, tiếp xúc tốt. SpO2 96% khí phòng, thở 22 lần/phút. Lồng ngực di động theo nhịp thở. Phổi nghe ran rít, ran ngáy rải rác hai phế trường. Tim đều, T1 T2 rõ, không âm bệnh lý.',
      diagnosis: 'Cơn hen phế quản mức độ trung bình có yếu tố khởi phát dị ứng / Nhiễm khuẩn hô hấp trên',
      treatmentPlan: 'Khí dung cắt cơn cấp, sử dụng ICS/LABA duy trì phòng ngừa cơn, tránh khói bụi và thức ăn dị ứng.',
      doctorNotes: 'Xịt Symbicort đúng kỹ thuật súc miệng sau xịt. Đo lưu lượng đỉnh tại nhà mỗi sáng. Tái khám sau 2 tuần hoặc ngay khi khó thở tăng.',
      conclusion: 'Cắt cơn thành công tại phòng khám, tình trạng hô hấp ổn định, cho đơn thuốc điều trị ngoại trú.',
      departmentHead: 'TS.BS. Nguyễn Văn Hùng (Trưởng khoa Hô hấp)',
      director: 'PGS.TS. Trần Đình Nam (Giám đốc Bệnh viện)',
      prescriptions: [
        { drugName: 'Symbicort Turbuhaler 160/4.5mcg', activeCode: 'BUD-FOR-160', dosage: '160mcg/4.5mcg', usageInstruction: 'Hít 1 nhát x 2 lần/ngày (sáng 1, tối 1 sau ăn). Súc miệng sau hít.', quantity: 1, unit: 'Ống hít', duration: '30 ngày' },
        { drugName: 'Singulair 10mg (Montelukast)', activeCode: 'MONT-10', dosage: '10mg', usageInstruction: 'Uống 1 viên vào buổi tối trước khi đi ngủ', quantity: 30, unit: 'Viên', duration: '30 ngày' },
        { drugName: 'Ventolin Inhaler 100mcg', activeCode: 'SALB-100', dosage: '100mcg', usageInstruction: 'Hít 2 nhát khi có cơn khó thở cấp tính', quantity: 1, unit: 'Lọ xịt', duration: 'Khi cần' },
      ],
      vitals: [
        { name: 'Huyết áp (HA)', value: '125/80', unit: 'mmHg' },
        { name: 'Mạch / Nhịp tim', value: '78', unit: 'lần/phút' },
        { name: 'Thân nhiệt', value: '36.8', unit: '°C' },
        { name: 'SpO2', value: '98', unit: '%' },
        { name: 'Nhịp thở', value: '20', unit: 'lần/phút' },
      ],
    },
    {
      specialty: 'Tim mạch',
      icdList: [
        { icdCode: 'I10', diseaseName: 'Tăng huyết áp vô căn (nguyên phát) giai đoạn 2', isPrimary: true },
        { icdCode: 'E78.0', diseaseName: 'Tăng cholesterol máu nguyên phát', isPrimary: false },
      ],
      complaint: 'Đau đầu vùng chẩm gáy vào buổi sáng, cảm giác hồi hộp trống ngực',
      clinicalSummary: 'Bệnh nhân phát hiện tăng huyết áp 2 năm nay nhưng không dùng thuốc thường xuyên. Khám đo HA tại phòng khám 150/95 mmHg. Điện tâm đồ ghi nhận dày thất trái nhẹ.',
      physicalExam: 'Bệnh nhân tỉnh táo, thể trạng trung bình (BMI 23.5). HA tay phải 150/95 mmHg, tay trái 148/92 mmHg. Mỏm tim đập ở khoang liên sườn V đường trung đòn trái, T2 đanh ở đáy tim. Không phù ngoại biên.',
      diagnosis: 'Tăng huyết áp nguyên phát giai đoạn 2 theo ISH/VNHA - Nguy cơ tim mạch trung bình / Rối loạn lipid máu',
      treatmentPlan: 'Kiểm soát huyết áp mục tiêu < 130/80 mmHg với phối hợp thuốc chẹn canxi + statin hạ lipid, chế độ ăn giảm muối.',
      doctorNotes: 'Uống thuốc đều đặn vào 8h sáng hàng ngày. Giảm lượng muối ăn (<5g/ngày), tập thể dục nhẹ nhàng 30 phút/ngày.',
      conclusion: 'Huyết áp đã giảm an toàn, bệnh nhân dung nạp thuốc tốt, hướng dẫn ghi nhật ký huyết áp tại nhà.',
      departmentHead: 'PGS.TS. Lê Thị Kim Hoa (Trưởng khoa Tim mạch can thiệp)',
      director: 'GS.TS. Hoàng Trọng Kim (Chủ tịch Hội đồng Y khoa)',
      prescriptions: [
        { drugName: 'Amlodipine (Norvasc 5mg)', activeCode: 'AMLO-5', dosage: '5mg', usageInstruction: 'Uống 1 viên vào 8h00 mỗi sáng sau khi ăn', quantity: 30, unit: 'Viên', duration: '30 ngày' },
        { drugName: 'Lipitor 20mg (Atorvastatin)', activeCode: 'ATOR-20', dosage: '20mg', usageInstruction: 'Uống 1 viên vào buổi tối sau ăn', quantity: 30, unit: 'Viên', duration: '30 ngày' },
        { drugName: 'Aspirin 81mg', activeCode: 'ASP-81', dosage: '81mg', usageInstruction: 'Uống 1 viên sau bữa ăn trưa', quantity: 30, unit: 'Viên', duration: '30 ngày' },
      ],
      vitals: [
        { name: 'Huyết áp (HA)', value: '135/85', unit: 'mmHg' },
        { name: 'Mạch / Nhịp tim', value: '74', unit: 'lần/phút' },
        { name: 'Thân nhiệt', value: '36.6', unit: '°C' },
        { name: 'SpO2', value: '99', unit: '%' },
        { name: 'BMI', value: '23.4', unit: 'kg/m²' },
      ],
    },
    {
      specialty: 'Tiêu hóa',
      icdList: [
        { icdCode: 'K21.0', diseaseName: 'Bệnh trào ngược dạ dày - thực quản có viêm thực quản', isPrimary: true },
        { icdCode: 'K29.5', diseaseName: 'Viêm dạ dày mạn tính không đặc hiệu', isPrimary: false },
      ],
      complaint: 'Nóng rát vùng sau xương ức, ợ chua, cồn cào đau tức thượng vị sau ăn no',
      clinicalSummary: 'Bệnh nhân có thói quen ăn đêm và uống cà phê nhiều. Nội soi tiêu hóa trên ghi nhận niêm mạc thực quản đoạn dưới trợt đỏ nhẹ (Los Angeles độ A), hang vị phù nề sung huyết.',
      physicalExam: 'Bệnh nhân tỉnh táo, tiếp xúc tốt. Bụng mềm, ấn tức nhẹ vùng thượng vị, không đề kháng, không có điểm đau khu trú khác. Gan lách không sờ chạm.',
      diagnosis: 'Trào ngược dạ dày thực quản (GERD Grade A) / Viêm niêm mạc dạ dày mạn tính',
      treatmentPlan: 'Ức chế tiết acid dạ dày bằng PPI thế hệ mới liều chuẩn trong 8 tuần kết hợp thuốc trung hòa acid tạo màng bảo vệ thực quản.',
      doctorNotes: 'Uống thuốc trước bữa ăn sáng 30 phút. Tránh nằm ngay sau ăn (ít nhất 2 giờ). Kiêng cà phê, rượu bia, thức ăn chua cay cay nóng.',
      conclusion: 'Các triệu chứng đáp ứng tốt với phác đồ điều trị nội khoa, hẹn tái khám sau 4 tuần.',
      departmentHead: 'BS.CKII Vũ Hoài Nam (Trưởng khoa Nội Tiêu hóa)',
      director: 'PGS.TS. Trần Đình Nam (Giám đốc Bệnh viện)',
      prescriptions: [
        { drugName: 'Nexium 40mg (Esomeprazole)', activeCode: 'ESOM-40', dosage: '40mg', usageInstruction: 'Uống 1 viên trước ăn sáng 30-60 phút', quantity: 28, unit: 'Viên', duration: '28 ngày' },
        { drugName: 'Gaviscon Dual Action', activeCode: 'GAV-DA', dosage: '10ml/gói', usageInstruction: 'Uống 1 gói sau các bữa ăn chính và trước khi đi ngủ', quantity: 40, unit: 'Gói', duration: '20 ngày' },
        { drugName: 'Phosphalugel 20g', activeCode: 'PHOS-20', dosage: '20g/gói', usageInstruction: 'Uống 1 gói khi có cơn đau rát thượng vị', quantity: 20, unit: 'Gói', duration: 'Khi cần' },
      ],
      vitals: [
        { name: 'Huyết áp (HA)', value: '120/78', unit: 'mmHg' },
        { name: 'Mạch / Nhịp tim', value: '72', unit: 'lần/phút' },
        { name: 'Thân nhiệt', value: '36.7', unit: '°C' },
        { name: 'SpO2', value: '98', unit: '%' },
        { name: 'BMI', value: '22.8', unit: 'kg/m²' },
      ],
    },
    {
      specialty: 'Tai Mũi Họng',
      icdList: [
        { icdCode: 'J30.1', diseaseName: 'Viêm mũi dị ứng do thời tiết và phấn hoa', isPrimary: true },
        { icdCode: 'J32.0', diseaseName: 'Viêm xoang hàm mạn tính hai bên', isPrimary: false },
      ],
      complaint: 'Hắt hơi liên tục thành tràng, ngứa mũi, chảy nước mũi trong và nghẹt mũi luân phiên',
      clinicalSummary: 'Bệnh tái phát nhiều lần khi thời tiết chuyển mùa. Nội soi tai mũi họng ghi nhận cuốn mũi dưới hai bên phù nề, thoái hóa nhợt màu, đọng dịch nhầy trong khe giữa.',
      physicalExam: 'Niêm mạc họng hồng, amidan hai bên kích thước độ 1 không sưng đỏ. Màng nhĩ hai tai sáng bóng nguyên vẹn. Điểm xoang hàm ấn tức nhẹ hai bên.',
      diagnosis: 'Viêm mũi dị ứng dai dẳng mức độ vừa - nặng / Theo dõi đợt cấp viêm xoang mạn',
      treatmentPlan: 'Xịt corticoid tại chỗ kiểm soát viêm mũi, kháng histamin thế hệ 2 không gây buồn ngủ, rửa mũi bằng nước muối sinh lý.',
      doctorNotes: 'Xịt mũi đúng kỹ thuật hướng đầu xịt ra góc ngoài cánh mũi. Rửa mũi sạch trước khi xịt. Đeo khẩu trang khi ra đường.',
      conclusion: 'Bệnh nhân giảm ngạt mũi và hắt hơi rõ rệt sau khí dung và xịt thuốc tại chỗ.',
      departmentHead: 'BS.CKII Bùi Nha Hằng (Trưởng khoa Tai Mũi Họng)',
      director: 'PGS.TS. Vũ Đức Khang (Giám đốc Điều hành)',
      prescriptions: [
        { drugName: 'Avamys 27.5mcg xịt mũi (Fluticasone furoate)', activeCode: 'FLUT-27.5', dosage: '27.5mcg/liều', usageInstruction: 'Xịt mỗi bên mũi 2 nhát x 1 lần/ngày vào buổi sáng', quantity: 1, unit: 'Lọ xịt', duration: '30 ngày' },
        { drugName: 'Clarityne 10mg (Loratadine)', activeCode: 'LORA-10', dosage: '10mg', usageInstruction: 'Uống 1 viên vào buổi tối sau ăn', quantity: 20, unit: 'Viên', duration: '20 ngày' },
        { drugName: 'Nước muối biển Sterimar', activeCode: 'STER-100', dosage: '100ml', usageInstruction: 'Xịt rửa hốc mũi 2-3 lần mỗi ngày', quantity: 2, unit: 'Chai', duration: '30 ngày' },
      ],
      vitals: [
        { name: 'Huyết áp (HA)', value: '118/75', unit: 'mmHg' },
        { name: 'Mạch / Nhịp tim', value: '76', unit: 'lần/phút' },
        { name: 'Thân nhiệt', value: '36.8', unit: '°C' },
        { name: 'SpO2', value: '99', unit: '%' },
        { name: 'BMI', value: '22.4', unit: 'kg/m²' },
      ],
    },
    {
      specialty: 'Da liễu',
      icdList: [
        { icdCode: 'L20.8', diseaseName: 'Viêm da cơ địa dị ứng (Atopic dermatitis)', isPrimary: true },
        { icdCode: 'L50.0', diseaseName: 'Mày đay dị ứng cấp tính', isPrimary: false },
      ],
      complaint: 'Ngứa nhiều vùng cẳng tay và cổ, xuất hiện các mảng sẩn đỏ dát ngứa rải rác sau ăn hải sản',
      clinicalSummary: 'Bệnh nhân có cơ địa dị ứng, ngứa dữ dội tăng lên về đêm. Khám lâm sàng tổn thương là các dát đỏ, mụn nước nhỏ li ti rải rác đối xứng hai cẳng tay, có vết cào gãi trợt da nhẹ.',
      physicalExam: 'Tổn thương da khu trú vùng cẳng tay và trước ngực, không có bọng nước lớn, không dấu hiệu nhiễm trùng mủ. Da toàn thân khô ráp nhẹ.',
      diagnosis: 'Đợt bùng phát viêm da cơ địa dị ứng mức độ trung bình / Mày đay cấp dị ứng thức ăn',
      treatmentPlan: 'Kháng histamin chống ngứa toàn thân, corticoid bôi tại chỗ ngắn ngày (7 ngày), phục hồi hàng rào bảo vệ da với kem dưỡng ẩm.',
      doctorNotes: 'Bôi thuốc mỏng đúng vùng da bệnh, không bôi lên vết thương hở. Thoa kem dưỡng ẩm toàn thân sau tắm 3 phút. Kiêng hải sản và xà phòng tẩy mạnh.',
      conclusion: 'Tình trạng ngứa giảm trên 80% sau xử trí, tổn thương da khô se tốt.',
      departmentHead: 'TS.BS. Hoàng Thanh Tâm (Trưởng khoa Da liễu & Thẩm mỹ)',
      director: 'PGS.TS. Trần Đình Nam (Giám đốc Bệnh viện)',
      prescriptions: [
        { drugName: 'Elocon Cream 0.1% (Mometasone furoate)', activeCode: 'MOME-0.1', dosage: '0.1% 15g', usageInstruction: 'Thoa 1 lớp mỏng lên vùng da tổn thương 1 lần/ngày vào buổi tối trong 7 ngày', quantity: 1, unit: 'Tuýp', duration: '7 ngày' },
        { drugName: 'Telfast HD 180mg (Fexofenadine)', activeCode: 'FEXO-180', dosage: '180mg', usageInstruction: 'Uống 1 viên vào buổi sáng sau ăn', quantity: 14, unit: 'Viên', duration: '14 ngày' },
        { drugName: 'Cerave Moisturizing Cream 236ml', activeCode: 'CERA-236', dosage: '236ml', usageInstruction: 'Thoa toàn thân 2 lần/ngày sau khi tắm sạch', quantity: 1, unit: 'Hộp', duration: '30 ngày' },
      ],
      vitals: [
        { name: 'Huyết áp (HA)', value: '120/80', unit: 'mmHg' },
        { name: 'Mạch / Nhịp tim', value: '75', unit: 'lần/phút' },
        { name: 'Thân nhiệt', value: '36.7', unit: '°C' },
        { name: 'SpO2', value: '98', unit: '%' },
        { name: 'BMI', value: '22.6', unit: 'kg/m²' },
      ],
    },
    {
      specialty: 'Mắt',
      icdList: [
        { icdCode: 'H52.1', diseaseName: 'Tật cận thị hai mắt (Myopia)', isPrimary: true },
        { icdCode: 'H10.1', diseaseName: 'Viêm kết mạc dị ứng cấp tính', isPrimary: false },
      ],
      complaint: 'Mắt nhìn mờ khi nhìn xa, ngứa mắt, cộm xốn và chảy nước mắt nhiều khi làm việc máy tính',
      clinicalSummary: 'Bệnh nhân làm việc văn phòng tiếp xúc máy tính >8 giờ/ngày. Khám sinh hiển vi ghi nhận kết mạc cương tụ nhẹ, có nhú gai nhỏ li ti ở cùng đồ dưới hai mắt, giác mạc trong suốt.',
      physicalExam: 'Thị lực không kính: Mắt phải 3/10, Mắt trái 4/10. Thị lực có kính chỉnh: Hai mắt 10/10 (MP -2.25 D, MT -2.00 D). Nhãn áp hai mắt trong giới hạn bình thường (16 mmHg).',
      diagnosis: 'Cận thị hai mắt ổn định / Hội chứng thị giác màn hình kèm Viêm kết mạc dị ứng nhẹ',
      treatmentPlan: 'Cấp đơn kính điều chỉnh khúc xạ, sử dụng nước mắt nhân tạo không chất bảo quản và thuốc nhỏ chống dị ứng kết mạc.',
      doctorNotes: 'Nhỏ thuốc đúng cách tránh để đầu lọ chạm vào lông mi. Quy tắc 20-20-20 khi làm việc với màn hình (nghỉ 20 giây mỗi 20 phút nhìn xa 6 mét).',
      conclusion: 'Hai mắt nhìn rõ 10/10 với kính mới, tình trạng cộm xốn thuyên giảm rõ sau nhỏ thuốc.',
      departmentHead: 'BS.CKII Huỳnh Thanh Nam (Trưởng khoa Mắt Kỹ thuật cao)',
      director: 'GS.TS. Hoàng Trọng Kim (Chủ tịch Hội đồng Y khoa)',
      prescriptions: [
        { drugName: 'Sanlein 0.1% (Sodium hyaluronate)', activeCode: 'SOD-0.1', dosage: '0.1% 5ml', usageInstruction: 'Nhỏ mỗi mắt 1 giọt x 4-5 lần/ngày khi thấy khô cộm', quantity: 2, unit: 'Lọ', duration: '30 ngày' },
        { drugName: 'Pataday 0.2% (Olopatadine)', activeCode: 'OLO-0.2', dosage: '0.2% 2.5ml', usageInstruction: 'Nhỏ mỗi mắt 1 giọt x 1 lần/ngày vào buổi sáng', quantity: 1, unit: 'Lọ', duration: '14 ngày' },
      ],
      vitals: [
        { name: 'Huyết áp (HA)', value: '115/75', unit: 'mmHg' },
        { name: 'Mạch / Nhịp tim', value: '72', unit: 'lần/phút' },
        { name: 'Thân nhiệt', value: '36.6', unit: '°C' },
        { name: 'SpO2', value: '99', unit: '%' },
        { name: 'BMI', value: '22.0', unit: 'kg/m²' },
      ],
    },
  ];

  // 4. Tạo hoặc liên kết MedicalEncounter thực tế cho các Appointment của Nguyễn Văn An
  const apts = patientAn.appointments;
  console.log(`Số lịch hẹn của Nguyễn Văn An: ${apts.length}`);

  let scenarioIdx = 0;
  for (const apt of apts) {
    const workplace = apt.slot?.doctorWorkplace;
    const hospital = workplace?.hospital || hospSaiGon || hospCentral;
    const doctor = workplace?.doctor;
    const specialty = workplace?.specialty;

    // Chọn kịch bản lâm sàng phù hợp với chuyên khoa của lịch hẹn
    let scenario = clinicalScenarios.find(s => specialty?.name?.toLowerCase().includes(s.specialty.toLowerCase()));
    if (!scenario) {
      scenario = clinicalScenarios[scenarioIdx % clinicalScenarios.length];
      scenarioIdx++;
    }

    const docName = doctor ? `${doctor.title ? doctor.title + ' ' : ''}${doctor.fullName}` : 'PGS.TS. Lý Gia Huy';
    const docTitle = doctor?.title || 'Bác sĩ chuyên khoa';
    const specName = specialty?.name || scenario.specialty;
    const hospId = hospital?.id || hospSaiGon?.id;
    const encDate = apt.slot?.startTime || apt.createdAt || new Date();
    const encCode = `EMR-${encDate.getFullYear()}${String(encDate.getMonth() + 1).padStart(2, '0')}-${apt.bookingCode || apt.id.slice(0, 6).toUpperCase()}`;

    // Kiểm tra xem appointment này đã có MedicalEncounter chưa
    let existingEnc = apt.medicalEncounter;
    if (!existingEnc) {
      existingEnc = await prisma.medicalEncounter.findFirst({
        where: { appointmentId: apt.id },
      });
    }

    if (!existingEnc) {
      // Tạo mới MedicalEncounter chuẩn thực thụ
      const createdEnc = await prisma.medicalEncounter.create({
        data: {
          patientProfileId: patientAn.id,
          hospitalId: hospId,
          appointmentId: apt.id,
          encounterCode: encCode,
          encounterDate: encDate,
          doctorName: docName,
          doctorTitle: docTitle,
          specialtyName: specName,
          chiefComplaint: scenario.complaint,
          clinicalSummary: scenario.clinicalSummary,
          physicalExamination: scenario.physicalExam,
          admissionSource: 'Khoa Khám Bệnh Ngoại Trú (Tiếp nhận hệ thống NovaCare)',
          admissionAt: encDate,
          dischargeType: 'Khám ngoại trú kê đơn về nhà điều trị',
          treatmentDays: 1,
          initialDiagnosis: scenario.diagnosis,
          differentialDiagnosis: 'Đã loại trừ các biến chứng cấp tính nguy hiểm',
          treatmentPlan: scenario.treatmentPlan,
          doctorNotes: scenario.doctorNotes,
          conclusion: scenario.conclusion,
          treatmentResult: 'Khỏi / Thuyên giảm rõ rệt',
          revisitDate: new Date(new Date(encDate).getTime() + 14 * 24 * 60 * 60 * 1000),
          prognosisNear: 'Tốt, bệnh nhân tuân thủ điều trị',
          prognosisFar: 'Ổn định lâu dài khi duy trì chế độ sinh hoạt và uống thuốc định kỳ',
          careLevel: 'Cấp III (Tự chăm sóc ngoại trú)',
          dietaryRegimen: 'Chế độ ăn thanh đạm, giảm muối, hạn chế dầu mỡ, uống đủ 2 lít nước/ngày',
          departmentHeadName: scenario.departmentHead,
          hospitalDirectorName: scenario.director,
          digitalSignature: {
            signerName: docName,
            signedAt: encDate,
            certificateNumber: `VN-CA-${docName.replace(/[^A-Z]/gi, '').slice(0, 4)}-${Math.floor(100000 + Math.random() * 900000)}`,
            isValid: true,
          },
          status: 'PUBLISHED',
          diagnoses: {
            create: scenario.icdList.map(icd => ({
              icdCode: icd.icdCode,
              diseaseName: icd.diseaseName,
              isPrimary: icd.isPrimary,
              isComplication: false,
              diagnosisType: icd.isPrimary ? 'Xác định' : 'Kèm theo',
            })),
          },
          observations: {
            create: scenario.vitals.map(v => ({
              category: 'VITAL_SIGNS',
              name: v.name,
              value: v.value,
              unit: v.unit,
              observedAt: encDate,
            })),
          },
          prescription: {
            create: {
              prescriptionCode: `RX-${encCode.replace('EMR-', '')}`,
              prescribedAt: encDate,
              note: scenario.doctorNotes,
              items: {
                create: scenario.prescriptions.map(p => ({
                  drugName: p.drugName,
                  activeIngredientCode: p.activeCode,
                  dosage: p.dosage,
                  usageInstruction: p.usageInstruction,
                  quantity: p.quantity,
                  unit: p.unit,
                  duration: p.duration,
                })),
              },
            },
          },
        },
      });

      console.log(`+ Đã tạo bệnh án thực tế: ${createdEnc.encounterCode} | ${specName} | ${docName}`);
    } else {
      console.log(`= Đã có bệnh án: ${existingEnc.encounterCode}`);
    }
  }

  // 5. Cập nhật MedicalPassport và tạo Nhật ký truy cập (Audit Logs) hoàn toàn có thật
  let passport = await prisma.medicalPassport.findUnique({
    where: { userId: patientAn.userId },
    include: { shares: true },
  });

  if (!passport) {
    passport = await prisma.medicalPassport.create({
      data: {
        userId: patientAn.userId,
        summary: {
          fullName: patientAn.fullName,
          identityNumber: patientAn.identityNumber,
          medicalHistory: patientAn.medicalHistory || 'Hen phế quản dị ứng thời tiết, Tăng huyết áp độ 1',
          allergies: patientAn.allergies || 'Dị ứng hải sản (tôm, cua), Dị ứng Penicillin',
        },
      },
      include: { shares: true },
    });
  }

  let share = passport.shares.find(s => s.shareToken.startsWith('NC-AUDIT-'));
  if (!share) {
    share = await prisma.medicalPassportShare.create({
      data: {
        passportId: passport.id,
        shareToken: `NC-AUDIT-${patientAn.identityNumber}`,
        qrCode: `QR-PASSPORT-${patientAn.identityNumber}`,
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        sharedWith: 'BS.CKII Trần Minh Bình · Bệnh viện Đa khoa NovaCare Sài Gòn',
        allowedSections: ['summary', 'diagnoses', 'prescriptions', 'observations', 'encounters'],
      },
    });
  }

  // Tạo chuỗi nhật ký truy cập thực tế phong phú trải dài các khung giờ và ngày gần đây
  const realisticAuditLogs = [
    {
      hospitalName: 'Bệnh viện Đa khoa NovaCare Sài Gòn',
      hospitalId: hospSaiGon?.id || 'e95b4d3c-ed80-46a9-baf7-26b239f61353',
      doctorName: 'BS.CKII Trần Minh Bình',
      doctorId: '0257c21e-6d0b-40d7-8c13-da4785e14309',
      purpose: 'Hội chẩn liên viện & Đánh giá nguy cơ tim mạch trước kê đơn',
      method: 'CCCD',
      status: 'SUCCESS',
      query: '079088012345',
      timeOffsetMinutes: 5, // 5 phút trước
      ip: '192.168.1.45',
    },
    {
      hospitalName: 'Bệnh viện Quốc tế Nova Central',
      hospitalId: hospCentral?.id || '6b5c511a-c615-415a-bd00-9604e406f667',
      doctorName: 'PGS.TS Lý Gia Huy',
      doctorId: '025c34dc-16b1-449f-bc72-7a15bca71ff8',
      purpose: 'Khai thác tiền sử hen dị ứng và đối chiếu tương tác thuốc',
      method: 'MPI',
      status: 'SUCCESS',
      query: 'NOVA-079088012345',
      timeOffsetMinutes: 75, // 1 giờ 15 phút trước
      ip: '172.16.10.88',
    },
    {
      hospitalName: 'Bệnh Viện Đa Khoa Quốc Tế NovaLife',
      hospitalId: hospLife?.id || '3aae9ef1-8bad-4c06-b142-fb85e87ca424',
      doctorName: 'BS.CKI Trần Thị Bình',
      doctorId: '076a4b90-3e99-4c1e-b05b-9394ee0ed334',
      purpose: 'Tiếp nhận cấp cứu ngoại viện & Kiểm tra sinh hiệu liên thông',
      method: 'CCCD',
      status: 'SUCCESS',
      query: '079088012345',
      timeOffsetMinutes: 240, // 4 giờ trước
      ip: '10.20.30.12',
    },
    {
      hospitalName: 'Bệnh viện Đa khoa NovaCare Tân Bình',
      hospitalId: hospTanBinh?.id || '7aa0fdd4-1f95-46ae-b5bc-5d81b2a3e4a9',
      doctorName: 'BS.CKII Bùi Nha Hằng',
      doctorId: '086516f6-75f8-4ee4-8ac3-421859783795',
      purpose: 'Tái khám chuyên khoa & Kiểm tra cận lâm sàng tai mũi họng',
      method: 'CCCD',
      status: 'SUCCESS',
      query: '079088012345',
      timeOffsetMinutes: 1440, // 1 ngày trước
      ip: '192.168.2.110',
    },
    {
      hospitalName: 'Bệnh viện Sản Nhi NovaCare TP.HCM',
      hospitalId: '32fd9bc0-b6bf-4d85-ae2a-5cf62320f414',
      doctorName: 'ThS.BS Vũ Đức Khang',
      doctorId: '00be500e-0482-4e9f-99fd-f29849662615',
      purpose: 'Khai thác tiền sử bệnh án chuyển tuyến điều trị ngoại trú',
      method: 'SHARE_CODE',
      status: 'SUCCESS',
      query: 'NOVA-079088012345',
      timeOffsetMinutes: 2880, // 2 ngày trước
      ip: '118.69.172.4',
    },
  ];

  for (const item of realisticAuditLogs) {
    const accessTime = new Date(Date.now() - item.timeOffsetMinutes * 60 * 1000);
    await prisma.medicalPassportAccessLog.create({
      data: {
        shareId: share.id,
        accessedAt: accessTime,
        ipAddress: item.ip,
        userAgent: JSON.stringify({
          hospitalId: item.hospitalId,
          hospitalName: item.hospitalName,
          doctorId: item.doctorId,
          doctorName: item.doctorName,
          purpose: item.purpose,
          method: item.method,
          status: item.status,
          query: item.query,
          patientName: patientAn.fullName,
          patientCode: patientAn.patientCode || `NOVA-${patientAn.identityNumber}`,
          identityNumber: patientAn.identityNumber,
        }),
      },
    });
    console.log(`+ Ghi nhận nhật ký truy cập thật: ${item.hospitalName} | ${item.doctorName} | ${accessTime.toLocaleTimeString('vi-VN')}`);
  }

  console.log('--- HOÀN TẤT SEED DỮ LIỆU LÂM SÀNG & NHẬT KÝ THẬT ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
