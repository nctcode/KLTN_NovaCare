import json

with open('scripts/parsed_tables.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total tables: {len(data)}")
for idx, (mname, tinfo) in enumerate(data.items(), 1):
    cols = tinfo['columns']
    pk_cols = [c['col_name'] for c in cols if 'PRIMARY KEY' in c['constraint']]
    fk_cols = [c['col_name'] for c in cols if 'FOREIGN KEY' in c['constraint']]
    print(f"{idx:2d}. {mname:<25} (DB: {tinfo['db_table_name']:<30}) | Cols: {len(cols):2d} | PK: {','.join(pk_cols)} | FKs: {len(fk_cols)}")

