with open(r'd:\HTTT18B\KLTN\NovaCare\nova-care-backend\prisma\seed.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

specialties = []
for i, l in enumerate(lines):
    if 'specialty' in l.lower() or 'specialties' in l.lower():
        print(f"{i+1}: {l.strip()}")

