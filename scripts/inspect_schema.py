import re
import os

schema_path = 'nova-care-backend/prisma/schema.prisma'
with open(schema_path, 'r', encoding='utf-8') as f:
    schema = f.read()

# Pattern for models
# Note: models can contain nested comments or brackets, but prisma models don't nest models.
model_blocks = re.findall(r'model\s+(\w+)\s*\{([\s\S]*?)\n\}', schema)

print(f"Total models parsed: {len(model_blocks)}")

for mname, mbody in model_blocks:
    map_match = re.search(r'@@map\("([^"]+)"\)', mbody)
    db_table = map_match.group(1) if map_match else mname
    print(f"Model: {mname:<25} | DB Table: {db_table}")

