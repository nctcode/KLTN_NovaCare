import re

puml_path = 'NovaCare_PlantUML/02_ERD_Tong_The.puml'
with open(puml_path, 'r', encoding='utf-8') as f:
    puml = f.read()

entities = re.findall(r'entity\s+"?(\w+)"?\s+as\s+(\w+)\s*\{([\s\S]*?)\n\}', puml)
print(f"Entities in 02_ERD_Tong_The.puml: {len(entities)}")
for label, alias, body in entities[:5]:
    print(f"Entity: {label} (alias: {alias})")

