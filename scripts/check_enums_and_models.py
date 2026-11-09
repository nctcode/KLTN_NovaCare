import re
import os

schema_path = 'nova-care-backend/prisma/schema.prisma'
with open(schema_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Get all enums
enums = set(re.findall(r'enum\s+(\w+)\s*\{', content))
print("Enums found:", len(enums), sorted(list(enums)))

# Get all model names
model_names = set(re.findall(r'model\s+(\w+)\s*\{', content))
print("Models found:", len(model_names), sorted(list(model_names)))

