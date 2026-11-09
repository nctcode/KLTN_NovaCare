import json

with open('scripts/parsed_tables.json', 'r', encoding='utf-8') as f:
    parsed_tables = json.load(f)

for mname, tinfo in parsed_tables.items():
    for col in tinfo['columns']:
        # If constraint has FOREIGN KEY, print it
        if 'FOREIGN KEY' in col['constraint']:
            pass
        else:
            # Check if column ends with Id and might be an unmapped foreign key
            if col['col_name'].endswith('Id') or col['col_name'].endswith('_id'):
                print(f"Table: {mname:<25} | Column: {col['col_name']:<25} | Constraint: '{col['constraint']}'")

