import re

schema_path = 'nova-care-backend/prisma/schema.prisma'
with open(schema_path, 'r', encoding='utf-8') as f:
    content = f.read()

field_maps = re.findall(r'(\w+)\s+[\w\?\[\]]+\s+.*@map\("([^"]+)"\)', content)
print("Fields with @map:", len(field_maps), field_maps)

