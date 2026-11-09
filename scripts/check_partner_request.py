import re

schema_path = 'nova-care-backend/prisma/schema.prisma'
with open(schema_path, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'model\s+PartnerRequest\s*\{([\s\S]*?)\n\}', content)
if match:
    print(match.group(1))

