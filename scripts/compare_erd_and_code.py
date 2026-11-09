import re
import glob
import json

with open('scripts/parsed_tables.json', 'r', encoding='utf-8') as f:
    parsed_tables = json.load(f)

erd_files = sorted(glob.glob('NovaCare_PlantUML/[0-9]*.puml'))

erd_entities = {}

entity_pattern = re.compile(r'entity\s+["\']?(\w+)["\']?(?:\s+as\s+(\w+))?\s*\{([\s\S]*?)\n\}')

for ef in erd_files:
    if 'SiteMap' in ef or '01_Domain_Model' in ef:
        continue
    with open(ef, 'r', encoding='utf-8') as f:
        content = f.read()
    matches = entity_pattern.findall(content)
    for m in matches:
        ename = m[0]
        body = m[2]
        if ename not in erd_entities:
            erd_entities[ename] = []
        for line in body.split('\n'):
            line = line.strip()
            if not line or line.startswith('--') or line.startswith('//') or line.startswith('..'):
                continue
            # e.g. * id : String <<PK>> or colName : Type <<FK>>
            m_col = re.match(r'[\*\+\-]?\s*(\w+)\s*:\s*([^<\s]+)(?:\s*<<([^>]+)>>)?', line)
            if m_col:
                erd_entities[ename].append({
                    "col": m_col.group(1),
                    "type": m_col.group(2),
                    "constraint": m_col.group(3) or ""
                })

print(f"Entities collected from ERD files: {len(erd_entities)}")

discrepancies = {}

for mname, tinfo in parsed_tables.items():
    code_cols = {c['prisma_field']: c for c in tinfo['columns']}
    code_db_cols = {c['col_name']: c for c in tinfo['columns']}
    
    erd_cols_list = erd_entities.get(mname, [])
    erd_col_names = [c['col'] for c in erd_cols_list]
    
    only_in_erd = []
    for ec in erd_col_names:
        if ec not in code_cols and ec not in code_db_cols:
            only_in_erd.append(ec)
            
    only_in_code = []
    for cc in code_cols.keys():
        if cc not in erd_col_names and code_cols[cc]['col_name'] not in erd_col_names:
            only_in_code.append(cc)
            
    if only_in_erd or only_in_code:
        discrepancies[mname] = {
            "only_in_erd": only_in_erd,
            "only_in_code": only_in_code,
            "code_col_count": len(tinfo['columns']),
            "erd_col_count": len(erd_cols_list)
        }

print(f"Tables with discrepancies between ERD and Code: {len(discrepancies)}")
with open('scripts/erd_vs_code_discrepancies.json', 'w', encoding='utf-8') as f:
    json.dump(discrepancies, f, ensure_ascii=False, indent=2)
print("Saved to scripts/erd_vs_code_discrepancies.json")

