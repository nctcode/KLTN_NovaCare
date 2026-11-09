import os

puml_dir = r"d:\HTTT18B\KLTN\NovaCare\NovaCare_PlantUML"
files = sorted([f for f in os.listdir(puml_dir) if f.endswith(".puml")])

for f in files:
    full_path = os.path.join(puml_dir, f)
    with open(full_path, "r", encoding="utf-8") as fp:
        lines = fp.readlines()
    header_lines = []
    for l in lines:
        if l.strip().startswith("entity ") or l.strip().startswith("class "):
            break
        header_lines.append(l.strip())
    print(f"=== {f} ===")
    print("\n".join(header_lines[:15]))

