import docx

doc = docx.Document('d:/HTTT18B/KLTN/NovaCare/docs/N16_KLTN_NovaCare_Final.docx')
t0 = doc.tables[0]
for i in range(len(t0.rows)):
    row = t0.rows[i]
    c0 = row.cells[0].paragraphs[0]
    c1 = row.cells[1].paragraphs[0]
    f0 = c0.runs[0].font.name if c0.runs else 'N/A'
    s0 = c0.runs[0].font.size.pt if (c0.runs and c0.runs[0].font.size) else 'N/A'
    b0 = c0.runs[0].bold if c0.runs else False
    f1 = c1.runs[0].font.name if c1.runs else 'N/A'
    s1 = c1.runs[0].font.size.pt if (c1.runs and c1.runs[0].font.size) else 'N/A'
    b1 = c1.runs[0].bold if c1.runs else False
    print(f"Row {i:2d}: [{row.cells[0].text.strip():<8}] ({f0}, {s0}pt, bold={b0}) | [{row.cells[1].text.strip():<35}] ({f1}, {s1}pt, bold={b1})")
