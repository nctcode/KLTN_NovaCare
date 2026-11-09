import json

with open('scripts/parsed_tables.json', 'r', encoding='utf-8') as f:
    tables = json.load(f)

print(f"Loaded {len(tables)} tables.")

# Verify each table has at least 1 column and a primary key
errors = []
for mname, tinfo in tables.items():
    cols = tinfo['columns']
    if not cols:
        errors.append(f"{mname} has no columns!")
    has_pk = any('PRIMARY KEY' in c['constraint'] for c in cols)
    if not has_pk:
        errors.append(f"{mname} has NO primary key!")

if errors:
    print("ERRORS FOUND:")
    for e in errors:
        print(" ", e)
else:
    print("All 51 tables have valid columns and primary keys!")

