import re

puml_path = 'NovaCare_PlantUML/02_ERD_Tong_The.puml'
with open(puml_path, 'r', encoding='utf-8') as f:
    puml = f.read()

# Find all relation lines: Entity1 ... Entity2 : "..."
rel_lines = re.findall(r'(\w+)\s+[\-\|\.\<\>o\+]+(?:\s+[\-\|\.\<\>o\+]+\s+|\s+)(\w+)\s*:\s*"?([^"\n]+)"?', puml)
print(f"Total relations found in ERD: {len(rel_lines)}")
for e1, e2, desc in rel_lines[:15]:
    print(f"{e1} -> {e2} : {desc}")

