from copy import deepcopy
from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn

PATH='Đặc tả admin Bệnh viện.docx'
def put(cell,text,center=False,bold=False):
    cell.text=''; p=cell.paragraphs[0]; p.alignment=WD_ALIGN_PARAGRAPH.CENTER if center else WD_ALIGN_PARAGRAPH.LEFT; p.paragraph_format.line_spacing=1.15; p.paragraph_format.space_after=Pt(0); r=p.add_run(text); r.bold=bold; r.font.name='Times New Roman'; r._element.rPr.rFonts.set(qn('w:eastAsia'),'Times New Roman'); r.font.size=Pt(13)
def remove_row(table, index):
    table.rows[index]._tr.getparent().remove(table.rows[index]._tr)
doc=Document(PATH)
src = open('rewrite_hospital_flows.py', encoding='utf-8').read().split('doc = Document(PATH)')[0]
ns = {}
exec(src, ns)
for table in doc.tables:
    alts=[i for i,r in enumerate(table.rows) if 'Luồng sự kiện thay thế' in r.cells[0].text]
    if not alts: continue
    if len(alts)==1:
        idx=alts[0]; clone=deepcopy(table.rows[idx]._tr); table.rows[idx]._tr.addprevious(clone); alts=[idx,idx+1]
    # The first label row is the extra row created by the previous expansion; use it as flow pair 4.
    extra, header = alts[0], alts[1]
    steps = ns['pairs'](table.cell(0,0).text.replace('Tên use case:', '').strip())
    put(table.rows[extra-1].cells[0], f'5. {steps[2][0]}')
    put(table.rows[extra-1].cells[1], f'6. {steps[2][1]}')
    put(table.rows[extra].cells[0], f'7. {steps[3][0]}')
    put(table.rows[extra].cells[1], f'8. {steps[3][1]}')
    put(table.rows[header].cells[0], 'Luồng sự kiện thay thế (alternate flow):', bold=True)
    put(table.rows[header].cells[1], 'Luồng sự kiện thay thế (alternate flow):', bold=True)
    if header+1 < len(table.rows):
        # Keep the existing alternate content, but ensure it has two parallel steps.
        if not table.rows[header+1].cells[0].text.strip():
            put(table.rows[header+1].cells[0], '2.1. Dữ liệu không hợp lệ hoặc không tìm thấy bản ghi phù hợp.')
            put(table.rows[header+1].cells[1], '3.1. Hệ thống thông báo nguyên nhân và không tiếp tục xử lý.')
for table in doc.tables:
    for row in table.rows:
        for cell in row.cells:
            for p in cell.paragraphs:
                p.paragraph_format.line_spacing=1.15
                for r in p.runs:
                    r.font.name='Times New Roman'; r._element.rPr.rFonts.set(qn('w:eastAsia'),'Times New Roman'); r.font.size=Pt(13)
doc.save(PATH)
print('repaired')
