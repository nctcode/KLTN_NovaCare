import re
import os
import glob

# Read all SQL files and parse all CREATE TABLE statements
mig_dir = 'nova-care-backend/prisma/migrations'
sql_files = sorted(glob.glob(os.path.join(mig_dir, '**/*.sql'), recursive=True))

sql_tables = {}
for sf in sql_files:
    with open(sf, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    # matches CREATE TABLE "tableName" (...)
    matches = re.finditer(r'CREATE TABLE ["\']?(\w+)["\']?\s*\(([\s\S]*?)\n\);', sql, re.IGNORECASE)
    for m in matches:
        tname = m.group(1)
        body = m.group(2)
        cols = {}
        for line in body.split('\n'):
            line = line.strip()
            if not line or line.startswith('--') or line.startswith('CONSTRAINT'):
                continue
            col_m = re.match(r'["\']?(\w+)["\']?\s+([^,]+)', line)
            if col_m:
                col_name = col_m.group(1)
                col_def = col_m.group(2).rstrip(',')
                cols[col_name] = col_def
        sql_tables[tname] = cols

print(f"Total tables parsed from SQL migrations: {len(sql_tables)}")
for tname in sorted(sql_tables.keys()):
    print(f"  {tname} ({len(sql_tables[tname])} columns)")

