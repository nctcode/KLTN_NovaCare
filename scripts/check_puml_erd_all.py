import re

puml_path = 'NovaCare_PlantUML/02_ERD_Tong_The.puml'
with open(puml_path, 'r', encoding='utf-8') as f:
    puml = f.read()

all_entities = re.findall(r'entity\s+["\']?(\w+)["\']?(?:\s+as\s+(\w+))?\s*\{', puml)
print(f"Total entities found: {len(all_entities)}")
for e in all_entities:
    print(e)

