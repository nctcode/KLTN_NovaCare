import re
import glob

puml_files = sorted(glob.glob('NovaCare_PlantUML/[0-9]*.puml'))
for pf in puml_files:
    with open(pf, 'r', encoding='utf-8') as f:
        text = f.read()
    rels = re.findall(r'(\w+)\s+[\-\|\.\<\>o\+]+(?:\s+[\-\|\.\<\>o\+]+\s+|\s+)(\w+)\s*:\s*"?([^"\n]+)"?', text)
    print(f"{pf} -> {len(rels)} relations")

