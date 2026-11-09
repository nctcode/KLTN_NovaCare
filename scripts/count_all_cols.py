import json

with open('scripts/parsed_tables.json', 'r', encoding='utf-8') as f:
    tables = json.load(f)

total_cols = sum(len(tinfo['columns']) for tinfo in tables.values())
print(f"Total columns across 51 tables: {total_cols}")
for idx, (mname, tinfo) in enumerate(tables.items(), 1):
    print(f"{idx:2d}. {mname:<25} : {len(tinfo['columns']):2d} columns")

