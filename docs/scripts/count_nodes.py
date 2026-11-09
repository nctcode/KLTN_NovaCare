import os
import re

backup_dir = r"d:\HTTT18B\KLTN\NovaCare\NovaCare_PlantUML\backup_sitemaps"
for f in sorted(os.listdir(backup_dir)):
    if f.endswith(".puml"):
        p = os.path.join(backup_dir, f)
        with open(p, "r", encoding="utf-8") as fp:
            text = fp.read()
        rects = len(re.findall(r"rectangle\s+\"", text))
        lines = len(text.splitlines())
        print(f"{f}: {rects} nodes, {lines} lines")

