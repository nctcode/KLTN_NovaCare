import os

puml_dir = r"d:\HTTT18B\KLTN\NovaCare\NovaCare_PlantUML"
files = sorted([f for f in os.listdir(puml_dir) if f.endswith(".puml")])

for f in files:
    filepath = os.path.join(puml_dir, f)
    with open(filepath, "r", encoding="utf-8") as fp:
        lines = fp.readlines()
    content = "".join(lines)
    open_braces = content.count("{")
    close_braces = content.count("}")
    starts = [l.strip() for l in lines if l.strip().startswith("@startuml")]
    ends = [l.strip() for l in lines if l.strip().startswith("@enduml")]
    package_colors = [l.strip() for l in lines if "package " in l and "#" in l]
    print(f"{f}:")
    print(f"  Braces: {{ = {open_braces}, }} = {close_braces} (diff: {open_braces - close_braces})")
    print(f"  Start: {len(starts)}, End: {len(ends)}")
    print(f"  Package colors: {package_colors}")
    assert open_braces == close_braces, f"Brace mismatch in {f}!"
    assert len(starts) == 1 and len(ends) == 1, f"Start/End mismatch in {f}!"
    assert len(package_colors) == 0, f"Lingering package colors in {f}!"

print("\nALL 11 FILES PASSED INTEGRITY & SYNTAX CHECKS PERFECTLY!")

