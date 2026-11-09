import re
import os
import glob

# 1. Read schema.prisma
schema_path = 'nova-care-backend/prisma/schema.prisma'
with open(schema_path, 'r', encoding='utf-8') as f:
    schema_content = f.read()

# 2. Find all models in schema.prisma
# Prisma model format:
# model ModelName {
#   ...
# }
model_pattern = re.compile(r'model\s+(\w+)\s*\{([\s\S]*?)\n\}')
models = model_pattern.findall(schema_content)

print(f"Total models in schema.prisma: {len(models)}")

# 3. Read all migrations and track table creations and column alterations
mig_dir = 'nova-care-backend/prisma/migrations'
sql_files = sorted(glob.glob(os.path.join(mig_dir, '**/*.sql'), recursive=True))
print(f"Found {len(sql_files)} SQL migration files")

# Check which tables are created in migrations
tables_in_sql = {}
fk_in_sql = {}

create_table_pattern = re.compile(r'CREATE TABLE ["\']?(\w+)["\']?\s*\(([\s\S]*?)\n\);', re.IGNORECASE)
add_fk_pattern = re.compile(r'ALTER TABLE ["\']?(\w+)["\']?\s+ADD CONSTRAINT ["\']?\w+["\']?\s+FOREIGN KEY\s*\(([^)]+)\)\s+REFERENCES\s+["\']?(\w+)["\']?\s*\(([^)]+)\)', re.IGNORECASE)

for sf in sql_files:
    with open(sf, 'r', encoding='utf-8') as f:
        sql = f.read()
    for tname, tbody in create_table_pattern.findall(sql):
        tables_in_sql[tname] = tbody
    for src_tbl, src_col, tgt_tbl, tgt_col in add_fk_pattern.findall(sql):
        src_tbl = src_tbl.strip('"')
        src_col = src_col.replace('"', '').strip()
        tgt_tbl = tgt_tbl.strip('"')
        tgt_col = tgt_col.replace('"', '').strip()
        if src_tbl not in fk_in_sql:
            fk_in_sql[src_tbl] = {}
        fk_in_sql[src_tbl][src_col] = (tgt_tbl, tgt_col)

print(f"Tables found in migrations: {len(tables_in_sql)}")
print(f"Tables with FK in migrations: {len(fk_in_sql)}")

