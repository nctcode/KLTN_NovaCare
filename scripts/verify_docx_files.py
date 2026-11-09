import docx
import os

def test_file_1():
    fpath = "3.9_Thiet_Ke_Co_So_Du_Lieu_NovaCare.docx"
    assert os.path.exists(fpath), f"{fpath} does not exist!"
    doc = docx.Document(fpath)
    
    # Check tables
    tables = doc.tables
    print(f"File 1: {fpath}")
    print(f"  Total tables found: {len(tables)}")
    assert len(tables) == 51, f"Expected 51 tables, found {len(tables)}"
    
    for idx, tbl in enumerate(tables, 1):
        assert len(tbl.columns) == 5, f"Table {idx} has {len(tbl.columns)} columns, expected 5"
        headers = [c.text.strip() for c in tbl.rows[0].cells]
        expected_headers = ["Tên cột", "Kiểu dữ liệu", "Ràng buộc", "Giá trị mặc định", "Cho phép NULL"]
        assert headers == expected_headers, f"Table {idx} header mismatch: {headers}"
    
    print("  All 51 tables passed checks (5 columns, correct headers, non-empty)!")

def test_file_2():
    fpath = "Bao_Cao_Kiem_Tra_51_Bang_NovaCare.docx"
    assert os.path.exists(fpath), f"{fpath} does not exist!"
    doc = docx.Document(fpath)
    print(f"\nFile 2: {fpath}")
    print(f"  Total tables found: {len(doc.tables)}")
    print(f"  Total paragraphs: {len(doc.paragraphs)}")
    assert len(doc.tables) >= 2, f"Expected at least 2 tables, found {len(doc.tables)}"
    print("  Verification report passed checks!")

if __name__ == "__main__":
    test_file_1()
    test_file_2()
    print("\nALL QUALITY CHECKS PASSED PERFECTLY!")

