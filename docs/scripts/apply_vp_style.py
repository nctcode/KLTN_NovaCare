import os
import re

puml_dir = r"d:\HTTT18B\KLTN\NovaCare\NovaCare_PlantUML"

vp_skinparam = """!theme plain
skinparam backgroundColor #FFFFFF
skinparam shadowing false
skinparam roundcorner 0
skinparam defaultFontName Arial
skinparam defaultFontSize 12
skinparam defaultFontColor #000000

skinparam ArrowColor #000000
skinparam ArrowFontColor #000000
skinparam ArrowThickness 1

skinparam ClassBackgroundColor #87CEEB
skinparam ClassHeaderBackgroundColor #87CEEB
skinparam ClassBorderColor #000000
skinparam ClassBorderThickness 1
skinparam ClassFontColor #000000
skinparam ClassFontSize 12
skinparam ClassFontStyle bold
skinparam ClassAttributeFontColor #000000
skinparam ClassAttributeFontSize 11
skinparam ClassAttributeFontName Arial

skinparam EntityBackgroundColor #87CEEB
skinparam EntityHeaderBackgroundColor #87CEEB
skinparam EntityBorderColor #000000
skinparam EntityBorderThickness 1
skinparam EntityFontColor #000000
skinparam EntityFontSize 12
skinparam EntityFontStyle bold
skinparam EntityAttributeFontColor #000000
skinparam EntityAttributeFontSize 11
skinparam EntityAttributeFontName Arial

skinparam packageBackgroundColor #FFFFFF
skinparam packageBorderColor #000000
skinparam packageBorderThickness 1
skinparam packageFontColor #000000
skinparam packageFontSize 12
skinparam packageFontStyle bold
skinparam packageStyle rectangle

skinparam nodesep 50
skinparam ranksep 50
skinparam linetype ortho

hide circle
"""

vp_skinparam_erd_tong_the = """!theme plain
skinparam backgroundColor #FFFFFF
skinparam shadowing false
skinparam roundcorner 0
skinparam defaultFontName Arial
skinparam defaultFontSize 11
skinparam defaultFontColor #000000

skinparam ArrowColor #000000
skinparam ArrowFontColor #000000
skinparam ArrowThickness 1

skinparam ClassBackgroundColor #87CEEB
skinparam ClassHeaderBackgroundColor #87CEEB
skinparam ClassBorderColor #000000
skinparam ClassBorderThickness 1
skinparam ClassFontColor #000000
skinparam ClassFontSize 11
skinparam ClassFontStyle bold
skinparam ClassAttributeFontColor #000000
skinparam ClassAttributeFontSize 10
skinparam ClassAttributeFontName Arial

skinparam EntityBackgroundColor #87CEEB
skinparam EntityHeaderBackgroundColor #87CEEB
skinparam EntityBorderColor #000000
skinparam EntityBorderThickness 1
skinparam EntityFontColor #000000
skinparam EntityFontSize 11
skinparam EntityFontStyle bold
skinparam EntityAttributeFontColor #000000
skinparam EntityAttributeFontSize 10
skinparam EntityAttributeFontName Arial

skinparam packageBackgroundColor #FFFFFF
skinparam packageBorderColor #000000
skinparam packageBorderThickness 1
skinparam packageFontColor #000000
skinparam packageFontSize 12
skinparam packageFontStyle bold
skinparam packageStyle rectangle

skinparam nodesep 45
skinparam ranksep 50
skinparam linetype ortho

hide circle
"""

files = sorted([f for f in os.listdir(puml_dir) if f.endswith(".puml")])

for f in files:
    filepath = os.path.join(puml_dir, f)
    with open(filepath, "r", encoding="utf-8") as fp:
        content = fp.read()

    # Find the title line
    title_match = re.search(r"(title\s+[^\n]+)", content)
    title_line = title_match.group(1) if title_match else ""

    # Split into startuml line, and body after title or after skinparam
    startuml_match = re.search(r"(@startuml[^\n]*)", content)
    startuml_line = startuml_match.group(1) if startuml_match else "@startuml"

    # Everything after title (or find where body starts)
    if title_line and title_line in content:
        parts = content.split(title_line, 1)
        body = parts[1].lstrip("\r\n")
    else:
        # Fallback: find first entity or class or package
        first_kw = re.search(r"\n(package|entity|class|User|' )", content)
        if first_kw:
            body = content[first_kw.start():].lstrip("\r\n")
        else:
            raise ValueError(f"Cannot parse {f}")

    # Remove inline package colors like `package "..." #HEX {`
    body = re.sub(r'package\s+"([^"]+)"\s+#[0-9a-fA-F]{3,6}\s*\{', r'package "\1" {', body)

    chosen_skinparam = vp_skinparam_erd_tong_the if f == "02_ERD_Tong_The.puml" else vp_skinparam

    new_content = f"{startuml_line}\n{chosen_skinparam}\n{title_line}\n\n{body}"
    # Ensure ends with @enduml
    if not new_content.strip().endswith("@enduml"):
        new_content = new_content.strip() + "\n@enduml\n"

    with open(filepath, "w", encoding="utf-8") as fp:
        fp.write(new_content)
    print(f"Updated {f} successfully.")

