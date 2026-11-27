from pathlib import Path
from playwright.sync_api import sync_playwright

OUT_DIR = Path(r"d:\HTTT18B\KLTN\NovaCare\docs\diagrams")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Optimized for A4 Word reports: compact width (1520px) + LARGE 15.5px-17px bold typography
SVG = """<svg xmlns="http://www.w3.org/2000/svg" width="1520" height="2220" viewBox="0 0 1520 2220">
  <defs>
    <style>
      .lifeline-label { font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; font-weight: 800; fill: #0f172a; text-anchor: middle; }
      .lifeline-sub { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12.8px; font-weight: 600; fill: #334155; text-anchor: middle; }
      .msg { font-family: 'Segoe UI', Arial, sans-serif; font-size: 15.5px; font-weight: 600; fill: #0f172a; paint-order: stroke; stroke: #FFFFFF; stroke-width: 7px; stroke-linejoin: round; }
      .guard { font-family: 'Segoe UI', Arial, sans-serif; font-size: 15.5px; font-weight: 800; fill: #0f172a; paint-order: stroke; stroke: #FFFFFF; stroke-width: 7px; stroke-linejoin: round; }
      .frag-tag { font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; font-weight: 800; fill: #0f172a; }
      .lifeline { stroke: #475569; stroke-width: 1.8; stroke-dasharray: 7 6; }
      .act { fill: #7DD3FC; stroke: #0f172a; stroke-width: 1.6; }
      .arrow { stroke: #0f172a; stroke-width: 2px; fill: none; }
      .ret { stroke: #0f172a; stroke-width: 1.8; stroke-dasharray: 7 5; fill: none; }
      .frag-box { fill: none; stroke: #1e293b; stroke-width: 2; }
      .frag-div { stroke: #1e293b; stroke-width: 1.6; stroke-dasharray: 8 5; }
      .icon-fill { fill: #7DD3FC; stroke: #0f172a; stroke-width: 2; }
      .icon-stroke { fill: none; stroke: #0f172a; stroke-width: 2; }
    </style>
    <marker id="solidArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a"/>
    </marker>
    <marker id="openArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
      <path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#0f172a" stroke-width="1.8"/>
    </marker>
  </defs>

  <!-- White Background -->
  <rect x="0" y="0" width="1520" height="2220" fill="#FFFFFF"/>

  <!-- Frame -->
  <rect x="14" y="14" width="1492" height="2192" fill="none" stroke="#64748b" stroke-width="1.6"/>
  <polygon points="14,14 420,14 420,46 402,62 14,62" fill="#F1F5F9" stroke="#64748b" stroke-width="1.6"/>
  <text x="30" y="45" class="frag-tag" style="font-size:17px;">sd Xem hồ sơ sức khỏe (NovaCare)</text>

  <!-- ================= LIFELINES (6) ================= -->
  <!-- X: Patient=95, GD_HoSoSucKhoe=365, CTR_Profiles=670, CTR_Appt=960, E_profiles=1205, E_encounters=1415 -->

  <!-- 1. Actor: Bệnh nhân -->
  <g transform="translate(95, 112)">
    <circle cx="0" cy="-18" r="12" class="icon-fill"/>
    <line x1="0" y1="-6" x2="0" y2="20" class="icon-stroke"/>
    <line x1="-18" y1="3" x2="18" y2="3" class="icon-stroke"/>
    <line x1="0" y1="20" x2="-14" y2="38" class="icon-stroke"/>
    <line x1="0" y1="20" x2="14" y2="38" class="icon-stroke"/>
    <text x="0" y="58" class="lifeline-label">Bệnh nhân</text>
    <text x="0" y="75" class="lifeline-sub">(PATIENT)</text>
  </g>
  <line x1="95" y1="204" x2="95" y2="2185" class="lifeline"/>

  <!-- 2. Boundary: GD_HoSoSucKhoe -->
  <g transform="translate(365, 124)">
    <line x1="-30" y1="-19" x2="-30" y2="19" class="icon-stroke"/>
    <line x1="-30" y1="0" x2="-18" y2="0" class="icon-stroke"/>
    <circle cx="3" cy="0" r="21" class="icon-fill"/>
    <text x="0" y="48" class="lifeline-label">GD_HoSoSucKhoe</text>
    <text x="0" y="66" class="lifeline-sub">&lt;&lt;boundary&gt;&gt;</text>
  </g>
  <line x1="365" y1="204" x2="365" y2="2185" class="lifeline"/>

  <!-- 3. Control: CTR_PatientProfilesService -->
  <g transform="translate(670, 124)">
    <circle cx="0" cy="0" r="21" class="icon-fill"/>
    <path d="M -5,-27 L 5,-21 L -5,-15" fill="none" stroke="#0f172a" stroke-width="2"/>
    <text x="0" y="45" class="lifeline-label" style="font-size:15px;">CTR_PatientProfiles</text>
    <text x="0" y="62" class="lifeline-label" style="font-size:15px;">Service</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;control&gt;&gt;</text>
  </g>
  <line x1="670" y1="204" x2="670" y2="2185" class="lifeline"/>

  <!-- 4. Control: CTR_AppointmentsService -->
  <g transform="translate(960, 124)">
    <circle cx="0" cy="0" r="21" class="icon-fill"/>
    <path d="M -5,-27 L 5,-21 L -5,-15" fill="none" stroke="#0f172a" stroke-width="2"/>
    <text x="0" y="45" class="lifeline-label" style="font-size:15px;">CTR_Appointments</text>
    <text x="0" y="62" class="lifeline-label" style="font-size:15px;">Service</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;control&gt;&gt;</text>
  </g>
  <line x1="960" y1="204" x2="960" y2="2185" class="lifeline"/>

  <!-- 5. Entity: E_patient_profiles -->
  <g transform="translate(1205, 124)">
    <circle cx="0" cy="-2" r="21" class="icon-fill"/>
    <line x1="-23" y1="21" x2="23" y2="21" class="icon-stroke"/>
    <text x="0" y="45" class="lifeline-label" style="font-size:15px;">E_patient_</text>
    <text x="0" y="62" class="lifeline-label" style="font-size:15px;">profiles</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="1205" y1="204" x2="1205" y2="2185" class="lifeline"/>

  <!-- 6. Entity: E_medical_encounters -->
  <g transform="translate(1415, 124)">
    <circle cx="0" cy="-2" r="21" class="icon-fill"/>
    <line x1="-23" y1="21" x2="23" y2="21" class="icon-stroke"/>
    <text x="0" y="45" class="lifeline-label" style="font-size:15px;">E_medical_</text>
    <text x="0" y="62" class="lifeline-label" style="font-size:15px;">encounters</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="1415" y1="204" x2="1415" y2="2185" class="lifeline"/>

  <!-- ================= ACTIVATION BARS ================= -->
  <!-- Bệnh nhân -->
  <rect x="87" y="228" width="16" height="1930" class="act"/>

  <!-- GD_HoSoSucKhoe -->
  <rect x="357" y="242" width="16" height="1904" class="act"/>
  <rect x="365" y="1772" width="14" height="24" class="act"/>
  <rect x="365" y="2064" width="14" height="24" class="act"/>

  <!-- CTR_PatientProfilesService -->
  <rect x="662" y="282" width="16" height="232" class="act"/>

  <!-- CTR_AppointmentsService -->
  <rect x="952" y="924" width="16" height="260" class="act"/>
  <rect x="952" y="1592" width="16" height="154" class="act"/>

  <!-- E_patient_profiles -->
  <rect x="1197" y="388" width="16" height="48" class="act"/>

  <!-- E_medical_encounters -->
  <rect x="1407" y="966" width="16" height="48" class="act"/>
  <rect x="1407" y="1634" width="16" height="48" class="act"/>

  <!-- ================= PHASE 1: TẢI DANH SÁCH HỒ SƠ BỆNH NHÂN (Steps 1-3, Alt 2.1, 2.2, 3.1) ================= -->
  <line x1="103" y1="244" x2="357" y2="244" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="116" y="235" class="msg">1: Chọn chức năng "Hồ sơ sức khỏe"</text>

  <line x1="373" y1="284" x2="662" y2="284" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="386" y="275" class="msg">1.1: findAll(userId) [JwtAuthGuard]</text>

  <!-- ALT 1: Phiên đăng nhập & Kết nối (Alt 2.1, 2.2, 3.1) -->
  <rect x="28" y="314" width="1464" height="510" class="frag-box"/>
  <polygon points="28,314 92,314 92,338 78,350 28,350" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="46" y="338" class="frag-tag">alt</text>
  <text x="114" y="339" class="guard">[JWT hợp lệ &amp;&amp; kết nối máy chủ thành công]</text>

  <line x1="678" y1="390" x2="1197" y2="390" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="692" y="381" class="msg">1.2: findMany({ where: { userId, deletedAt: null } })</text>

  <line x1="1197" y1="436" x2="678" y2="436" class="ret" marker-end="url(#openArrow)"/>
  <text x="870" y="427" class="msg">1.3: patientProfiles[]</text>

  <!-- ALT 1.1: Có hồ sơ hay chưa (Alt 3.1) -->
  <rect x="44" y="458" width="1432" height="180" class="frag-box"/>
  <polygon points="44,458 106,458 106,480 92,492 44,492" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="61" y="481" class="frag-tag">alt</text>
  <text x="118" y="482" class="guard">[patientProfiles.length &gt; 0]</text>

  <line x1="662" y1="514" x2="373" y2="514" class="ret" marker-end="url(#openArrow)"/>
  <text x="386" y="505" class="msg">1.4: { data: patientProfiles }</text>

  <line x1="357" y1="550" x2="103" y2="550" class="ret" marker-end="url(#openArrow)"/>
  <text x="116" y="541" class="msg">1.5: Hiển thị danh sách hồ sơ &amp; "Sổ sức khỏe điện tử &amp; Bệnh án"</text>

  <line x1="44" y1="570" x2="1476" y2="570" class="frag-div"/>
  <text x="118" y="594" class="guard">[patientProfiles.length == 0 (Alt 3.1)]</text>

  <line x1="357" y1="628" x2="103" y2="628" class="ret" marker-end="url(#openArrow)"/>
  <text x="116" y="619" class="msg">1.6: Thông báo "Chưa có hồ sơ bệnh nhân nào" &amp; nút "Thêm hồ sơ mới"</text>

  <!-- ELSE 1: Token hết hạn (Alt 2.1) -->
  <line x1="28" y1="658" x2="1492" y2="658" class="frag-div"/>
  <text x="114" y="684" class="guard">[phiên đăng nhập hết hạn / không hợp lệ - 401 Unauthorized (Alt 2.1)]</text>

  <line x1="357" y1="724" x2="103" y2="724" class="ret" marker-end="url(#openArrow)"/>
  <text x="116" y="715" class="msg">1.7: Yêu cầu bệnh nhân đăng nhập lại (kết thúc use case)</text>

  <!-- ELSE 2: Lỗi kết nối / máy chủ (Alt 2.2) -->
  <line x1="28" y1="744" x2="1492" y2="744" class="frag-div"/>
  <text x="114" y="770" class="guard">[mất kết nối hoặc lỗi máy chủ (Alt 2.2)]</text>

  <line x1="357" y1="810" x2="103" y2="810" class="ret" marker-end="url(#openArrow)"/>
  <text x="116" y="801" class="msg">1.8: Thông báo không thể tải hồ sơ + nút "Thử lại" (quay lại bước 2)</text>

  <!-- ================= PHASE 2: CHỌN HỒ SƠ & TẢI LỊCH SỬ KHÁM (Steps 4-6, Alt 5.1, 5.2) ================= -->
  <line x1="103" y1="884" x2="357" y2="884" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="116" y="875" class="msg">2: Chọn hồ sơ cần xem (patientProfileId)</text>

  <line x1="373" y1="926" x2="952" y2="926" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="386" y="917" class="msg">2.1: getHistory(userId) &amp; lọc theo patientProfileId</text>

  <line x1="968" y1="968" x2="1407" y2="968" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="982" y="959" class="msg">2.2: findMany({ where: { patientProfileId } })</text>

  <line x1="1407" y1="1014" x2="968" y2="1014" class="ret" marker-end="url(#openArrow)"/>
  <text x="1120" y="1005" class="msg">2.3: medicalEncounters[]</text>

  <!-- ALT 2: Kết quả tải lịch sử khám (Alt 5.1, 5.2) -->
  <rect x="28" y="1038" width="1464" height="456" class="frag-box"/>
  <polygon points="28,1038 92,1038 92,1062 78,1074 28,1074" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="46" y="1062" class="frag-tag">alt</text>
  <text x="114" y="1063" class="guard">[tải lịch sử khám thành công]</text>

  <!-- ALT 2.1: Có bệnh án hay chưa (Alt 5.2) -->
  <rect x="44" y="1088" width="1432" height="296" class="frag-box"/>
  <polygon points="44,1088 106,1088 106,1110 92,1122 44,1122" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="61" y="1111" class="frag-tag">alt</text>
  <text x="118" y="1112" class="guard">[filteredEncounters.length &gt; 0]</text>

  <line x1="952" y1="1156" x2="373" y2="1156" class="ret" marker-end="url(#openArrow)"/>
  <text x="490" y="1147" class="msg">2.4: { data: filteredEncounters }</text>

  <line x1="357" y1="1202" x2="103" y2="1202" class="ret" marker-end="url(#openArrow)"/>
  <text x="116" y="1193" class="msg">2.5: Hiển thị danh sách bệnh án (ngày khám, cơ sở y tế &amp; nút "Xem hồ sơ khám bệnh")</text>

  <line x1="44" y1="1280" x2="1476" y2="1280" class="frag-div"/>
  <text x="118" y="1306" class="guard">[hồ sơ được chọn chưa có bệnh án (Alt 5.2)]</text>

  <line x1="357" y1="1352" x2="103" y2="1352" class="ret" marker-end="url(#openArrow)"/>
  <text x="116" y="1343" class="msg">2.6: Thông báo "Chưa có bệnh án được trả về" (quay lại bước 4 chọn hồ sơ khác)</text>

  <!-- ELSE của ALT 2: Lỗi tải lịch sử khám (Alt 5.1) -->
  <line x1="28" y1="1406" x2="1492" y2="1406" class="frag-div"/>
  <text x="114" y="1432" class="guard">[không thể tải lịch sử khám (Alt 5.1)]</text>

  <line x1="357" y1="1474" x2="103" y2="1474" class="ret" marker-end="url(#openArrow)"/>
  <text x="116" y="1465" class="msg">2.7: Hiển thị thông báo lỗi &amp; nút "Làm mới" (quay lại bước 5)</text>

  <!-- ================= PHASE 3: XEM CHI TIẾT BỆNH ÁN & ĐÓNG (Steps 7-12, Alt 8.1, 11.1) ================= -->
  <line x1="103" y1="1552" x2="357" y2="1552" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="116" y="1543" class="msg">3: Nhấn "Xem hồ sơ khám bệnh" (encounterId)</text>

  <line x1="373" y1="1594" x2="952" y2="1594" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="386" y="1585" class="msg">3.1: ClinicalService.getEncounter(encounterId)</text>

  <line x1="968" y1="1636" x2="1407" y2="1636" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="982" y="1627" class="msg">3.2: findUnique({ id, include: diagnoses, observations, prescriptions })</text>

  <line x1="1407" y1="1682" x2="968" y2="1682" class="ret" marker-end="url(#openArrow)"/>
  <text x="1110" y="1673" class="msg">3.3: encounterDetail</text>

  <line x1="952" y1="1726" x2="373" y2="1726" class="ret" marker-end="url(#openArrow)"/>
  <text x="480" y="1717" class="msg">3.4: { data: encounterDetail }</text>

  <path d="M 373 1766 L 418 1766 L 418 1790 L 379 1790" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="428" y="1784" class="msg">3.5: filterAvailableSections(encounterDetail) (Alt 8.1: ẩn mục chưa có dữ liệu)</text>

  <line x1="357" y1="1848" x2="103" y2="1848" class="ret" marker-end="url(#openArrow)"/>
  <text x="116" y="1831" class="msg">3.6: Hiển thị chi tiết bệnh án (mã hồ sơ, ngày khám, bác sĩ, CSYT, chuyên khoa,</text>
  <text x="148" y="1868" class="msg">lý do, tóm tắt lâm sàng, chẩn đoán, sinh hiệu, cận lâm sàng, đơn thuốc, điều trị)</text>

  <!-- Step 11-12 & Alt 11.1: Đóng chi tiết -->
  <line x1="103" y1="1940" x2="357" y2="1940" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="116" y="1931" class="msg">4: Xem thông tin bệnh án (dữ liệu chỉ đọc, không thay đổi)</text>

  <line x1="103" y1="2012" x2="357" y2="2012" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="116" y="2003" class="msg">5: Nhấn "Đóng" (hoặc nút quay lại / vuốt đóng / nhấn ngoài cửa sổ - Alt 11.1)</text>

  <path d="M 373 2058 L 418 2058 L 418 2082 L 379 2082" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="428" y="2076" class="msg">5.1: closeEncounterDetailModal()</text>

  <line x1="357" y1="2136" x2="103" y2="2136" class="ret" marker-end="url(#openArrow)"/>
  <text x="116" y="2127" class="msg">5.2: Quay lại sổ sức khỏe điện tử của hồ sơ đã chọn (bước 6)</text>
</svg>
"""

svg_path = OUT_DIR / "seq_xem_ho_so_suc_khoe.svg"
png_path = OUT_DIR / "seq_xem_ho_so_suc_khoe.png"
svg_path.write_text(SVG, encoding="utf-8")

html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  html, body {{ margin: 0; padding: 0; background: #ffffff; }}
  svg {{ display: block; }}
</style>
</head>
<body>
{SVG}
</body>
</html>"""

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
    page = browser.new_page(viewport={"width": 1520, "height": 2220}, device_scale_factor=2)
    page.set_content(html)
    page.locator("svg").screenshot(path=str(png_path))
    browser.close()

print(f"Rendered: {svg_path}")
print(f"Rendered: {png_path}")
