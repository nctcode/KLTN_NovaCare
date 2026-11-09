import re
import json

schema_path = 'nova-care-backend/prisma/schema.prisma'
with open(schema_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Ordered list of 51 tables
ORDERED_51_TABLES = [
    "User", "RefreshToken", "PasswordResetChallenge", "RegistrationOtpChallenge",
    "DeviceToken", "AuditLog", "Notification", "NotificationLog", "PatientProfile",
    "MedicalPassport", "MedicalPassportShare", "MedicalPassportAccessLog",
    "PatientConsent", "PatientHospitalLink", "Hospital", "HospitalBookingConfig",
    "HospitalBranch", "Specialty", "HospitalSpecialty", "MedicalService",
    "ClinicRoom", "ClinicRoomSession", "HealthPackage", "PartnerRequest",
    "Doctor", "DoctorWorkplace", "DoctorSchedule", "DoctorScheduleService",
    "ScheduleException", "AppointmentSlot", "AppointmentSlotBooking",
    "Appointment", "AppointmentStatusHistory", "AppointmentContactLog",
    "PaymentTransaction", "PreExamSession", "PreExamQuestion", "ScreeningMedia",
    "ConsultationSession", "ConsultationMessage", "ConsultationAttachment",
    "MedicalEncounter", "Diagnosis", "Observation", "Prescription",
    "PrescriptionItem", "Review", "ReviewCriteriaScore", "ReviewResponse",
    "ReviewModerationLog", "ReviewReport"
]

# Extract all model blocks
models_dict = {}
model_matches = re.finditer(r'model\s+(\w+)\s*\{([\s\S]*?)\n\}', content)
for m in model_matches:
    mname = m.group(1)
    mbody = m.group(2)
    models_dict[mname] = mbody

all_enums = set(re.findall(r'enum\s+(\w+)\s*\{', content))
all_model_names = set(models_dict.keys())

parsed_tables = {}

for mname in ORDERED_51_TABLES:
    if mname not in models_dict:
        print(f"ERROR: Model {mname} not found in schema.prisma!")
        continue
    
    body = models_dict[mname]
    lines = body.split('\n')
    
    # Check table-level attributes
    table_map_m = re.search(r'@@map\("([^"]+)"\)', body)
    db_table_name = table_map_m.group(1) if table_map_m else mname
    
    table_id_m = re.search(r'@@id\(\[([^\]]+)\]\)', body)
    compound_id = [x.strip() for x in table_id_m.group(1).split(',')] if table_id_m else []
    
    table_unique_matches = re.findall(r'@@unique\(\[([^\]]+)\]\)', body)
    compound_uniques = [[x.strip() for x in u.split(',')] for u in table_unique_matches]
    
    # Store relation definitions: relation_field -> {target_model, fields, references}
    relations = {}
    
    # First pass: collect relations
    for line in lines:
        line = line.strip()
        if not line or line.startswith('//') or line.startswith('@@'):
            continue
        rel_m = re.search(r'@relation\(([^)]+)\)', line)
        if rel_m:
            rel_args = rel_m.group(1)
            f_m = re.search(r'fields:\s*\[([^\]]+)\]', rel_args)
            r_m = re.search(r'references:\s*\[([^\]]+)\]', rel_args)
            parts = line.split()
            f_field = parts[0]
            f_type = parts[1].rstrip('?[]')
            if f_m and r_m:
                src_cols = [x.strip() for x in f_m.group(1).split(',')]
                tgt_cols = [x.strip() for x in r_m.group(1).split(',')]
                for sc, tc in zip(src_cols, tgt_cols):
                    relations[sc] = (f_type, tc)
    
    # Second pass: collect columns
    columns = []
    for line in lines:
        line = line.strip()
        if not line or line.startswith('//') or line.startswith('@@'):
            continue
        
        parts = line.split()
        field_name = parts[0]
        raw_type = parts[1]
        
        # Check if this is a relation field (type is another model or model array)
        clean_type = raw_type.rstrip('?[]')
        if clean_type in all_model_names:
            # This is a Prisma relation navigation property, not a DB column
            continue
        
        # If type ends with [] but is scalar (like String[]), PostgreSQL supports TEXT[]
        is_array = raw_type.endswith('[]')
        is_nullable = raw_type.endswith('?')
        
        # Extract DB column name from @map
        map_m = re.search(r'@map\("([^"]+)"\)', line)
        db_col_name = map_m.group(1) if map_m else field_name
        
        # Extract default value
        default_val = ""
        def_m = re.search(r'@default\(([^)]+)\)', line)
        if def_m:
            raw_def = def_m.group(1).strip()
            if raw_def == "now()":
                default_val = "CURRENT_TIMESTAMP"
            elif raw_def in ["uuid()", "cuid()"]:
                default_val = raw_def
            elif raw_def.startswith('"') and raw_def.endswith('"'):
                default_val = f"'{raw_def[1:-1]}'"
            else:
                default_val = raw_def
        elif is_nullable:
            default_val = "NULL"
        else:
            default_val = ""
        
        # Map Prisma type to DB type
        db_type = clean_type
        if clean_type == "String":
            # Check db annotations
            if "@db.Text" in line:
                db_type = "text"
            elif "@db.VarChar" in line:
                vm = re.search(r'@db\.VarChar\((\d+)\)', line)
                db_type = f"varchar({vm.group(1)})" if vm else "varchar"
            else:
                db_type = "text"  # standard postgres prisma String
        elif clean_type == "Int":
            db_type = "int"
        elif clean_type == "BigInt":
            db_type = "bigint"
        elif clean_type == "Float":
            db_type = "float"
        elif clean_type == "Decimal":
            dm = re.search(r'@db\.Decimal\((\d+),\s*(\d+)\)', line)
            db_type = f"decimal({dm.group(1)},{dm.group(2)})" if dm else "decimal(10,2)"
        elif clean_type == "Boolean":
            db_type = "boolean"
        elif clean_type == "DateTime":
            db_type = "timestamp"
        elif clean_type == "Json":
            db_type = "jsonb"
        elif clean_type in all_enums:
            db_type = f"enum({clean_type})"
        
        if is_array:
            db_type += "[]"
        
        # Determine constraints
        constraints = []
        if "@id" in line or field_name in compound_id:
            constraints.append("PRIMARY KEY")
        
        if field_name in relations:
            tgt_model, tgt_col = relations[field_name]
            constraints.append(f"FOREIGN KEY → {tgt_model}({tgt_col})")
        
        if "@unique" in line or any(field_name == cu[0] and len(cu) == 1 for cu in compound_uniques):
            constraints.append("UNIQUE")
        
        # Format constraints string
        constraints_str = ", ".join(constraints) if constraints else ""
        
        # Nullable string
        allow_null_str = "CÓ" if is_nullable else "KHÔNG"
        
        columns.append({
            "col_name": db_col_name,
            "prisma_field": field_name,
            "db_type": db_type,
            "constraint": constraints_str,
            "default": default_val,
            "allow_null": allow_null_str
        })
    
    parsed_tables[mname] = {
        "model_name": mname,
        "db_table_name": db_table_name,
        "compound_id": compound_id,
        "compound_uniques": compound_uniques,
        "columns": columns
    }

print(f"Successfully parsed {len(parsed_tables)} tables.")
with open('scripts/parsed_tables.json', 'w', encoding='utf-8') as f:
    json.dump(parsed_tables, f, ensure_ascii=False, indent=2)
print("Saved to scripts/parsed_tables.json")

