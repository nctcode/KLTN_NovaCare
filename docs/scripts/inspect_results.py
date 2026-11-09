import json

with open(r'd:\HTTT18B\KLTN\NovaCare\NovaCare_AI_Testing\test_results.json', 'r', encoding='utf-8') as f:
    res = json.load(f)

print('=== SPECIALTY MISMATCHES ===')
for r in res:
    if not r['is_specialty_correct']:
        print(f"{r['id']}: Expected [{r['expected_specialty']}], got [{r['returned_specialty']}] | Top: {r['top_scores']}")
        print(f"   Symptom: {r['chief_symptom']}")

print('\n=== RISK LEVEL MISMATCHES ===')
for r in res:
    if not r['is_risk_correct']:
        print(f"{r['id']}: Expected [{r['expected_risk']}], got [{r['returned_risk']}] | Symptom: {r['chief_symptom']}")

