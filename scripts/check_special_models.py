import re

schema_path = 'nova-care-backend/prisma/schema.prisma'
with open(schema_path, 'r', encoding='utf-8') as f:
    content = f.read()

for m in ['PasswordResetChallenge', 'RegistrationOtpChallenge', 'DoctorWorkplace', 'ClinicRoom']:
    match = re.search(r'model\s+' + m + r'\s*\{([\s\S]*?)\n\}', content)
    if match:
        print(f"=== Model {m} ===")
        print(match.group(1))

