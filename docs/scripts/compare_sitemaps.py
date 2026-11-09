import os
import re

backup_dir = r"d:\HTTT18B\KLTN\NovaCare\NovaCare_PlantUML\backup_sitemaps"
current_dir = r"d:\HTTT18B\KLTN\NovaCare\NovaCare_PlantUML"

files = [
    "12_SiteMap_Tong_The.puml",
    "13_SiteMap_Mobile_App.puml",
    "14_SiteMap_Web_Public_Patient.puml",
    "15_SiteMap_Hospital_Admin.puml",
    "16_SiteMap_Super_Admin.puml"
]

print("| File | Số node trước | Số node sau | Tỷ lệ giảm |")
print("|---|---:|---:|---:|")
for f in files:
    with open(os.path.join(backup_dir, f), "r", encoding="utf-8") as fp:
        b_text = fp.read()
    with open(os.path.join(current_dir, f), "r", encoding="utf-8") as fp:
        c_text = fp.read()
    
    b_nodes = len(re.findall(r"rectangle\s+\"", b_text))
    c_nodes = len(re.findall(r"rectangle\s+\"", c_text))
    reduction = round((1 - c_nodes / b_nodes) * 100, 1) if b_nodes > 0 else 0
    print(f"| {f} | {b_nodes} | {c_nodes} | -{reduction}% |")

