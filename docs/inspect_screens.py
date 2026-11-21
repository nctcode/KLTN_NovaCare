import os
import re

def inspect_file(path, label):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    print(f"=== {label} ({path}) ===")
    texts = re.findall(r'Text\(\s*"([^"]+)"', content)
    buttons = re.findall(r'(?:Button|IconButton|OutlinedButton|TextButton)\s*\([^)]*\)', content)
    print("Sample texts:", texts[:15])

inspect_file('mobile/app/src/main/java/com/example/kltn_novacare/ui/screens/doctor/DoctorDetailScreen.kt', 'Doctor Detail')
inspect_file('mobile/app/src/main/java/com/example/kltn_novacare/ui/screens/booking/HospitalFacilityBookingScreen.kt', 'Hospital Facility Booking')
inspect_file('mobile/app/src/main/java/com/example/kltn_novacare/ui/screens/specialty/SpecialtyScreens.kt', 'Specialty Screens')
inspect_file('mobile/app/src/main/java/com/example/kltn_novacare/ui/screens/search/SearchScreen.kt', 'Search Screen')
