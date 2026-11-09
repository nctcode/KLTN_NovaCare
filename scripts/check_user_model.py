import re

schema_path = 'nova-care-backend/prisma/schema.prisma'
with open(schema_path, 'r', encoding='utf-8') as f:
    content = f.read()

m = re.search(r'model User\s*\{([\s\S]*?)\n\}', content)
if m:
    print(m.group(1))

