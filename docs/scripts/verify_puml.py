with open('nova-care-backend/prisma/schema.prisma', 'r', encoding='utf-8') as f:
    schema_models = set([l.split()[1] for l in f if l.strip().startswith('model ')])

with open('NovaCare_PlantUML/02_ERD_Tong_The.puml', 'r', encoding='utf-8') as f:
    erd_text = f.read()

missing_in_full = [m for m in schema_models if f'entity "{m}"' not in erd_text]
print(f'Total Schema Models: {len(schema_models)}')
print(f'Missing in 02_ERD_Tong_The.puml: {missing_in_full}')

# Also check detailed files
detailed_files = [
    'NovaCare_PlantUML/03_ERD_Tai_Khoan.puml',
    'NovaCare_PlantUML/04_ERD_Ho_So_Nguoi_Benh.puml',
    'NovaCare_PlantUML/05_ERD_Co_So_Y_Te.puml',
    'NovaCare_PlantUML/06_ERD_Bac_Si_Lich_Truc.puml',
    'NovaCare_PlantUML/07_ERD_Lich_Hen_Thanh_Toan.puml',
    'NovaCare_PlantUML/08_ERD_AI_Sang_Loc.puml',
    'NovaCare_PlantUML/09_ERD_Telemedicine.puml',
    'NovaCare_PlantUML/10_ERD_EMR.puml',
    'NovaCare_PlantUML/11_ERD_Danh_Gia.puml'
]

detailed_models = set()
for df in detailed_files:
    with open(df, 'r', encoding='utf-8') as f:
        txt = f.read()
    for m in schema_models:
        if f'entity "{m}"' in txt:
            detailed_models.add(m)

missing_in_detailed = schema_models - detailed_models
print(f'Total Models in Detailed ERDs: {len(detailed_models)}')
print(f'Missing in Detailed ERDs: {list(missing_in_detailed)}')

