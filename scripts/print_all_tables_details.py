import json

with open('scripts/parsed_tables.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for mname, tinfo in data.items():
    print(f"\n==========================================")
    print(f"TABLE: {mname} (DB: {tinfo['db_table_name']})")
    print(f"==========================================")
    for col in tinfo['columns']:
        print(f"  {col['col_name']:<28} | {col['db_type']:<18} | {col['constraint']:<32} | {col['default']:<18} | {col['allow_null']}")

