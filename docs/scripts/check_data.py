import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from data_part1_auth_profile_search import USECASES_PART1
from data_part2_booking_payment_screening import USECASES_PART2
from data_part3_tele_review_clinical import USECASES_PART3
from data_part4_hospital_admin_interop_noti import USECASES_PART4

for p_name, ucs in [('P1', USECASES_PART1), ('P2', USECASES_PART2), ('P3', USECASES_PART3), ('P4', USECASES_PART4)]:
    for uc in ucs:
        for i, s in enumerate(uc.get('main_flow', [])):
            if not isinstance(s, tuple) or len(s) != 2:
                print(p_name, uc.get('name'), 'main', i, type(s), len(s) if hasattr(s, '__len__') else s)
        for i, s in enumerate(uc.get('alt_flow', [])):
            if not isinstance(s, tuple) or len(s) != 2:
                print(p_name, uc.get('name'), 'alt', i, type(s), len(s) if hasattr(s, '__len__') else s)

print("Done check.")

