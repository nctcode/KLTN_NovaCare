# -*- coding: utf-8 -*-
import re
import os

with open('nova-care-backend/prisma/schema.prisma', 'r', encoding='utf-8') as f:
    text = f.read()

model_blocks = dict(re.findall(r'model\s+(\w+)\s*\{([^}]+)\}', text))

modules = {
    'Phân hệ Tài khoản, Xác thực & Phân quyền': [
        'User', 'RefreshToken', 'PasswordResetChallenge', 'RegistrationOtpChallenge', 
        'DeviceToken', 'AuditLog', 'Notification', 'NotificationLog'
    ],
    'Phân hệ Hồ sơ Người bệnh & Hộ chiếu Y tế': [
        'PatientProfile', 'MedicalPassport', 'MedicalPassportShare', 
        'MedicalPassportAccessLog', 'PatientConsent', 'PatientHospitalLink'
    ],
    'Phân hệ Cơ sở Y tế, Chuyên khoa & Dịch vụ': [
        'Hospital', 'HospitalBookingConfig', 'HospitalBranch', 'Specialty', 
        'HospitalSpecialty', 'MedicalService', 'ClinicRoom', 'ClinicRoomSession', 
        'HealthPackage', 'PartnerRequest'
    ],
    'Phân hệ Bác sĩ, Nơi làm việc & Lịch trực': [
        'Doctor', 'DoctorWorkplace', 'DoctorSchedule', 'DoctorScheduleService', 'ScheduleException'
    ],
    'Phân hệ Suất khám, Lịch hẹn & Thanh toán': [
        'AppointmentSlot', 'AppointmentSlotBooking', 'Appointment', 
        'AppointmentStatusHistory', 'AppointmentContactLog', 'PaymentTransaction'
    ],
    'Phân hệ Sàng lọc Tiền khám AI & Sinh hiệu PPG': [
        'PreExamSession', 'PreExamQuestion', 'ScreeningMedia'
    ],
    'Phân hệ Khám bệnh Từ xa (Telemedicine)': [
        'ConsultationSession', 'ConsultationMessage', 'ConsultationAttachment'
    ],
    'Phân hệ Hồ sơ Lâm sàng, Chẩn đoán & Đơn thuốc': [
        'MedicalEncounter', 'Diagnosis', 'Observation', 'Prescription', 'PrescriptionItem'
    ],
    'Phân hệ Đánh giá & Kiểm duyệt': [
        'Review', 'ReviewCriteriaScore', 'ReviewResponse', 'ReviewModerationLog', 'ReviewReport'
    ]
}

lines = []
lines.append('@startuml')
lines.append('!theme plain')
lines.append('skinparam linetype ortho')
lines.append('skinparam shadowing false')
lines.append('skinparam roundcorner 5')
lines.append('skinparam packageStyle rectangle')
lines.append('skinparam nodesep 50')
lines.append('skinparam ranksep 60')
lines.append('title SƠ ĐỒ THỰC THỂ LIÊN KẾT (FULL ERD) - NỀN TẢNG Y TẾ SỐ NOVACARE (TOÀN BỘ 51 THỰC THỂ)')
lines.append('')

all_relationships = []

for mod_title, mod_models in modules.items():
    lines.append(f'package "{mod_title}" {{')
    for mname in mod_models:
        body = model_blocks[mname]
        lines.append(f'  entity "{mname}" as {mname} {{')
        
        pk_cols = []
        fk_cols = []
        other_cols = []
        
        for l in body.split('\n'):
            l = l.strip()
            if not l or l.startswith('//') or l.startswith('@@'):
                continue
            parts = l.split()
            if len(parts) >= 2:
                fn, ft = parts[0], parts[1]
                
                # Check relation
                rel_match = re.search(r'@relation\(([^)]*)\)', l)
                if rel_match:
                    r_str = rel_match.group(1)
                    fm = re.search(r'fields:\s*\[([^\]]+)\]', r_str)
                    rm = re.search(r'references:\s*\[([^\]]+)\]', r_str)
                    if fm and rm:
                        target_model = ft.replace('?', '').replace('[]', '')
                        fk_field = fm.group(1).strip()
                        fk_cols.append(fk_field)
                        is_optional = '?' in ft or '?' in parts[1]
                        all_relationships.append((target_model, mname, is_optional, fk_field))
                    continue
                
                if ft.replace('?', '').replace('[]', '') in model_blocks:
                    continue
                
                if '@id' in l:
                    pk_cols.append((fn, ft))
                else:
                    other_cols.append((fn, ft))
                    
        for fn, ft in pk_cols:
            lines.append(f'    * {fn} : {ft} <<PK>>')
        lines.append('    --')
        
        shown = 0
        for fn, ft in other_cols:
            is_fk = fn in fk_cols
            fk_tag = ' <<FK>>' if is_fk else ''
            lines.append(f'    {fn} : {ft}{fk_tag}')
            shown += 1
            if shown >= 8 and len(other_cols) > 10:
                lines.append(f'    ... ({len(other_cols) - shown} thuộc tính khác)')
                break
                
        lines.append('  }')
        lines.append('')
    lines.append('}')
    lines.append('')

lines.append("' ==========================================")
lines.append("' MỐI QUAN HỆ GIỮA CÁC THỰC THỂ (RELATIONSHIPS)")
lines.append("' ==========================================")

seen_rel = set()
for target, source, is_opt, fk_field in all_relationships:
    if target in model_blocks and source in model_blocks:
        key = (target, source, fk_field)
        if key not in seen_rel:
            seen_rel.add(key)
            card = '||--o{' if is_opt else '||--|{'
            lines.append(f'{target} {card} {source} : "{fk_field}"')

lines.append('')
lines.append('@enduml')

puml_content = '\n'.join(lines)
os.makedirs('docs', exist_ok=True)
with open('docs/ERD_NovaCare_Full.puml', 'w', encoding='utf-8') as f:
    f.write(puml_content)

print(f'Successfully generated docs/ERD_NovaCare_Full.puml with {len(lines)} lines.')

