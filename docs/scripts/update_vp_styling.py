import os
import re

puml_dir = r"d:\HTTT18B\KLTN\NovaCare\NovaCare_PlantUML"
files = sorted([f for f in os.listdir(puml_dir) if f.endswith(".puml")])
print(f"Total files: {len(files)}")
for f in files:
    full_path = os.path.join(puml_dir, f)
    with open(full_path, "r", encoding="utf-8") as fp:
        lines = fp.readlines()
    titles = [l.strip() for l in lines if l.strip().startswith("title")]
    print(f"{f}: {len(lines)} lines | Title: {titles[0] if titles else 'None'}")

