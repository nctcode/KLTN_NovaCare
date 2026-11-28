from pathlib import Path
import subprocess
import tempfile

OUT_DIR = Path(__file__).resolve().parent
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Visual Paradigm BCE UML Sequence Diagram - Thêm bác sĩ
# Width: 1600px, Height: 2220px, 2x PNG -> 3200 x 4440px
# Includes UML Create Message (<<create>>) and Destruction Occurrence (X) for ObjDoctor_new & ObjWorkplace_new
SVG = """<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="2220" viewBox="0 0 1600 2220">
  <defs>
    <style>
      .lifeline-label { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14.8px; font-weight: 800; fill: #0f172a; text-anchor: middle; }
      .lifeline-sub { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12.2px; font-weight: 600; fill: #334155; text-anchor: middle; }
      .msg { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14.6px; font-weight: 600; fill: #0f172a; paint-order: stroke; stroke: #FFFFFF; stroke-width: 7px; stroke-linejoin: round; }
      .guard { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14.6px; font-weight: 800; fill: #0f172a; paint-order: stroke; stroke: #FFFFFF; stroke-width: 7px; stroke-linejoin: round; }
      .frag-tag { font-family: 'Segoe UI', Arial, sans-serif; font-size: 15.8px; font-weight: 800; fill: #0f172a; }
      .lifeline { stroke: #475569; stroke-width: 1.8; stroke-dasharray: 7 6; }
      .act { fill: #7DD3FC; stroke: #0f172a; stroke-width: 1.6; }
      .arrow { stroke: #0f172a; stroke-width: 2.1px; fill: none; }
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
  <rect x="0" y="0" width="1600" height="2220" fill="#FFFFFF"/>

  <!-- Frame -->
  <rect x="14" y="14" width="1572" height="2192" fill="none" stroke="#64748b" stroke-width="1.6"/>
  <polygon points="14,14 360,14 360,46 342,62 14,62" fill="#F1F5F9" stroke="#64748b" stroke-width="1.6"/>
  <text x="30" y="45" class="frag-tag" style="font-size:17px;">sd Thêm bác sĩ (NovaCare)</text>

  <!-- ================= LIFELINES (7 top + dynamic ObjDoctor_new & ObjWorkplace_new at x=775) ================= -->
  <!-- X: Admin=85, GD=305, CTR=555, [Dynamic=775], E_specialties=995, E_doctors=1175, E_doctor_workplaces=1350, E_audit_logs=1510 -->

  <!-- 1. Actor: Quản trị viên cơ sở y tế -->
  <g transform="translate(85, 110)">
    <circle cx="0" cy="-18" r="12" class="icon-fill"/>
    <line x1="0" y1="-6" x2="0" y2="20" class="icon-stroke"/>
    <line x1="-18" y1="3" x2="18" y2="3" class="icon-stroke"/>
    <line x1="0" y1="20" x2="-14" y2="38" class="icon-stroke"/>
    <line x1="0" y1="20" x2="14" y2="38" class="icon-stroke"/>
    <text x="0" y="55" class="lifeline-label">Quản trị viên</text>
    <text x="0" y="72" class="lifeline-label">cơ sở y tế</text>
    <text x="0" y="88" class="lifeline-sub">(HOSPITAL_ADMIN)</text>
  </g>
  <line x1="85" y1="208" x2="85" y2="2180" class="lifeline"/>

  <!-- 2. Boundary: GD_ThemBacSi -->
  <g transform="translate(305, 124)">
    <line x1="-29" y1="-19" x2="-29" y2="19" class="icon-stroke"/>
    <line x1="-29" y1="0" x2="-17" y2="0" class="icon-stroke"/>
    <circle cx="3" cy="0" r="20" class="icon-fill"/>
    <text x="0" y="48" class="lifeline-label">GD_ThemBacSi</text>
    <text x="0" y="66" class="lifeline-sub">&lt;&lt;boundary&gt;&gt;</text>
  </g>
  <line x1="305" y1="208" x2="305" y2="2180" class="lifeline"/>

  <!-- 3. Control: CTR_AdminDoctorsService -->
  <g transform="translate(555, 124)">
    <circle cx="0" cy="0" r="20" class="icon-fill"/>
    <path d="M -5,-26 L 5,-20 L -5,-14" fill="none" stroke="#0f172a" stroke-width="2"/>
    <text x="0" y="45" class="lifeline-label">CTR_AdminDoctors</text>
    <text x="0" y="62" class="lifeline-label">Service</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;control&gt;&gt;</text>
  </g>
  <line x1="555" y1="208" x2="555" y2="2180" class="lifeline"/>

  <!-- 4. Entity: E_specialties -->
  <g transform="translate(995, 124)">
    <circle cx="0" cy="-2" r="20" class="icon-fill"/>
    <line x1="-22" y1="20" x2="22" y2="20" class="icon-stroke"/>
    <text x="0" y="45" class="lifeline-label">E_specialties</text>
    <text x="0" y="62" class="lifeline-sub">&amp; hospital_spec</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="995" y1="208" x2="995" y2="2180" class="lifeline"/>

  <!-- 5. Entity: E_doctors -->
  <g transform="translate(1175, 124)">
    <circle cx="0" cy="-2" r="20" class="icon-fill"/>
    <line x1="-22" y1="20" x2="22" y2="20" class="icon-stroke"/>
    <text x="0" y="48" class="lifeline-label">E_doctors</text>
    <text x="0" y="66" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="1175" y1="208" x2="1175" y2="2180" class="lifeline"/>

  <!-- 6. Entity: E_doctor_workplaces -->
  <g transform="translate(1350, 124)">
    <circle cx="0" cy="-2" r="20" class="icon-fill"/>
    <line x1="-22" y1="20" x2="22" y2="20" class="icon-stroke"/>
    <text x="0" y="45" class="lifeline-label">E_doctor_</text>
    <text x="0" y="62" class="lifeline-label">workplaces</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="1350" y1="208" x2="1350" y2="2180" class="lifeline"/>

  <!-- 7. Entity: E_audit_logs -->
  <g transform="translate(1510, 124)">
    <circle cx="0" cy="-2" r="20" class="icon-fill"/>
    <line x1="-22" y1="20" x2="22" y2="20" class="icon-stroke"/>
    <text x="0" y="48" class="lifeline-label">E_audit_logs</text>
    <text x="0" y="66" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="1510" y1="208" x2="1510" y2="2180" class="lifeline"/>

  <!-- ================= ACTIVATION BARS ================= -->
  <!-- Actor -->
  <rect x="77" y="234" width="16" height="1908" class="act"/>

  <!-- GD_ThemBacSi -->
  <rect x="297" y="248" width="16" height="1884" class="act"/>
  <rect x="305" y="280" width="14" height="24" class="act"/>
  <rect x="305" y="492" width="14" height="24" class="act"/>

  <!-- CTR_AdminDoctorsService -->
  <rect x="547" y="616" width="16" height="1200" class="act"/>
  <rect x="555" y="654" width="14" height="24" class="act"/>

  <!-- E_specialties -->
  <rect x="987" y="726" width="16" height="62" class="act"/>
  <rect x="987" y="1178" width="16" height="62" class="act"/>

  <!-- E_doctors -->
  <rect x="1167" y="998" width="16" height="126" class="act"/>
  <rect x="1175" y="1028" width="14" height="24" class="act"/>

  <!-- E_doctor_workplaces -->
  <rect x="1342" y="1450" width="16" height="126" class="act"/>
  <rect x="1350" y="1480" width="14" height="24" class="act"/>

  <!-- E_audit_logs -->
  <rect x="1502" y="1644" width="16" height="64" class="act"/>

  <!-- ================= PHASE 1: MỞ BIỂU MẪU & NHẬP THÔNG TIN (Steps 1 - 4) ================= -->
  <line x1="93" y1="250" x2="297" y2="250" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="104" y="240" class="msg">1: Nhấn nút "Thêm Bác sĩ Mới" tại trang "Đội ngũ Bác sĩ"</text>

  <path d="M 313 276 L 358 276 L 358 300 L 319 300" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="368" y="294" class="msg">1.1: openCreateDoctorDialog()</text>

  <line x1="297" y1="354" x2="93" y2="354" class="ret" marker-end="url(#openArrow)"/>
  <text x="104" y="330" class="msg">1.2: Hiển thị hộp thoại "Thêm Bác Sĩ Mới" (hồ sơ bác sĩ: họ tên, chức danh, giới tính, KN, bằng cấp, avatar, tiểu sử</text>
  <text x="138" y="348" class="msg">&amp; thông tin công tác: chuyên khoa, giá khám VNĐ, chức vụ, chi nhánh)</text>

  <line x1="93" y1="408" x2="297" y2="408" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="104" y="398" class="msg">2: Nhập thông tin hồ sơ bác sĩ và chọn chuyên khoa, giá khám, chức vụ/chi nhánh (nếu có)</text>

  <line x1="93" y1="460" x2="297" y2="460" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="104" y="450" class="msg">3: Nhấn nút "Lưu bác sĩ"</text>

  <path d="M 313 488 L 358 488 L 358 512 L 319 512" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="368" y="506" class="msg">3.1: validateCreateForm(createForm)</text>

  <!-- ================= PHASE 2: ALT KIỂM TRA HỢP LỆ & TẠO HỒ SƠ (Steps 5 - 6, Alt 3.1, 5.1) ================= -->
  <rect x="28" y="544" width="1544" height="1576" class="frag-box"/>
  <polygon points="28,544 92,544 92,568 78,580 28,580" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="46" y="568" class="frag-tag">alt</text>
  <text x="112" y="569" class="guard">[Dữ liệu hợp lệ (đủ họ tên, bằng cấp, chuyên khoa, số năm KN &amp; giá khám &gt;= 0)]</text>

  <line x1="313" y1="618" x2="547" y2="618" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="330" y="608" class="msg">3.2: create(createDoctorDto)</text>

  <path d="M 563 650 L 608 650 L 608 674 L 569 674" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="618" y="668" class="msg">3.3: validateDtoAndScope(dto, hospitalId)</text>

  <line x1="563" y1="728" x2="987" y2="728" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="690" y="718" class="msg">3.4: findUnique(specialtyId)</text>

  <line x1="987" y1="784" x2="563" y2="784" class="ret" marker-end="url(#openArrow)"/>
  <text x="655" y="774" class="msg">3.5: Trả về thông tin chuyên khoa hợp lệ</text>

  <!-- Dynamic Object Creation 1: ObjDoctor_new -->
  <line x1="563" y1="862" x2="745" y2="862" class="ret" marker-end="url(#openArrow)"/>
  <text x="602" y="836" class="msg">3.6: &laquo;create&raquo;</text>
  <text x="576" y="854" class="msg">CreateObjDoctor_new</text>

  <g transform="translate(775, 862)">
    <circle cx="0" cy="-2" r="20" class="icon-fill"/>
    <line x1="-22" y1="20" x2="22" y2="20" class="icon-stroke"/>
    <text x="0" y="40" class="lifeline-label" style="font-size:14px;">ObjDoctor_new</text>
    <text x="0" y="55" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="775" y1="924" x2="775" y2="1060" class="lifeline"/>
  <rect x="767" y="944" width="16" height="28" class="act"/>

  <line x1="767" y1="960" x2="563" y2="960" class="ret" marker-end="url(#openArrow)"/>
  <text x="576" y="950" class="msg">3.7: Trả về ObjDoctor_new</text>

  <line x1="563" y1="1002" x2="1167" y2="1002" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="840" y="992" class="msg">3.8: create(ObjDoctor_new)</text>

  <path d="M 1183 1024 L 1222 1024 L 1222 1048 L 1189 1048" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="1232" y="1032" class="msg">3.9: Lưu hồ sơ</text>
  <text x="1264" y="1050" class="msg">bác sĩ mới</text>

  <!-- UML Destruction X for ObjDoctor_new -->
  <line x1="761" y1="1046" x2="789" y2="1074" stroke="#0f172a" stroke-width="2.4"/>
  <line x1="789" y1="1046" x2="761" y2="1074" stroke="#0f172a" stroke-width="2.4"/>

  <line x1="1167" y1="1118" x2="563" y2="1118" class="ret" marker-end="url(#openArrow)"/>
  <text x="720" y="1108" class="msg">3.10: Trả về hồ sơ bác sĩ mới tạo (MANUAL)</text>

  <!-- Activate HospitalSpecialty -->
  <line x1="563" y1="1180" x2="987" y2="1180" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="615" y="1170" class="msg">3.11: upsertHospitalSpecialty(hospitalId, specialtyId)</text>

  <line x1="987" y1="1236" x2="563" y2="1236" class="ret" marker-end="url(#openArrow)"/>
  <text x="625" y="1226" class="msg">3.12: Trả về liên kết chuyên khoa đang hoạt động</text>

  <!-- Dynamic Object Creation 2: ObjWorkplace_new -->
  <line x1="563" y1="1314" x2="745" y2="1314" class="ret" marker-end="url(#openArrow)"/>
  <text x="598" y="1288" class="msg">3.13: &laquo;create&raquo;</text>
  <text x="568" y="1306" class="msg">CreateObjWorkplace_new</text>

  <g transform="translate(775, 1314)">
    <circle cx="0" cy="-2" r="20" class="icon-fill"/>
    <line x1="-22" y1="20" x2="22" y2="20" class="icon-stroke"/>
    <text x="0" y="40" class="lifeline-label" style="font-size:13.8px;">ObjWorkplace_new</text>
    <text x="0" y="55" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="775" y1="1376" x2="775" y2="1512" class="lifeline"/>
  <rect x="767" y="1396" width="16" height="28" class="act"/>

  <line x1="767" y1="1412" x2="563" y2="1412" class="ret" marker-end="url(#openArrow)"/>
  <text x="568" y="1402" class="msg">3.14: Trả về ObjWorkplace_new</text>

  <line x1="563" y1="1454" x2="1342" y2="1454" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="860" y="1444" class="msg">3.15: create(ObjWorkplace_new)</text>

  <path d="M 1358 1476 L 1396 1476 L 1396 1500 L 1364 1500" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="1406" y="1484" class="msg">3.16: Lưu nơi</text>
  <text x="1426" y="1502" class="msg">công tác chính</text>

  <!-- UML Destruction X for ObjWorkplace_new -->
  <line x1="761" y1="1498" x2="789" y2="1526" stroke="#0f172a" stroke-width="2.4"/>
  <line x1="789" y1="1498" x2="761" y2="1526" stroke="#0f172a" stroke-width="2.4"/>

  <line x1="1342" y1="1570" x2="563" y2="1570" class="ret" marker-end="url(#openArrow)"/>
  <text x="795" y="1560" class="msg">3.17: Trả về thông tin nơi công tác mới tạo</text>

  <!-- Audit Log -->
  <line x1="563" y1="1646" x2="1502" y2="1646" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="890" y="1636" class="msg">3.18: logAction(CREATE_DOCTOR)</text>

  <line x1="1502" y1="1704" x2="563" y2="1704" class="ret" marker-end="url(#openArrow)"/>
  <text x="900" y="1694" class="msg">3.19: Trả về kết quả ghi nhật ký</text>

  <!-- Return to GD & Display Success (Step 6) -->
  <line x1="547" y1="1800" x2="313" y2="1800" class="ret" marker-end="url(#openArrow)"/>
  <text x="328" y="1772" class="msg">3.20: Trả về hồ sơ bác sĩ</text>
  <text x="364" y="1790" class="msg">đầy đủ vừa tạo</text>

  <line x1="297" y1="1894" x2="93" y2="1894" class="ret" marker-end="url(#openArrow)"/>
  <text x="104" y="1868" class="msg">3.21: Đóng hộp thoại, đặt lại biểu mẫu, hiển thị "Thêm bác sĩ mới thành công!"</text>
  <text x="142" y="1886" class="msg">và làm mới bảng danh sách bác sĩ của cơ sở y tế</text>

  <!-- ELSE của ALT: Thiếu thông tin bắt buộc hoặc dữ liệu không hợp lệ (Alt 3.1, 5.1) -->
  <line x1="28" y1="1946" x2="1572" y2="1946" class="frag-div"/>
  <text x="112" y="1976" class="guard">[Thiếu thông tin bắt buộc hoặc dữ liệu không hợp lệ (Alt 3.1, 5.1)]</text>

  <line x1="297" y1="2056" x2="93" y2="2056" class="ret" marker-end="url(#openArrow)"/>
  <text x="104" y="2046" class="msg">3.22: Từ chối lưu, giữ nguyên hộp thoại và hiển thị thông báo lỗi tương ứng</text>
</svg>
"""

svg_path = OUT_DIR / "seq_them_bac_si.svg"
png_path = OUT_DIR / "seq_them_bac_si.png"
svg_path.write_text(SVG, encoding="utf-8")

try:
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1600, "height": 2220}, device_scale_factor=2)
        page.set_content(f'<html><body style="margin:0;padding:0;background:#fff;">{SVG}</body></html>')
        page.screenshot(path=str(png_path), full_page=True)
        browser.close()
except Exception:
    chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(f'<!doctype html><html><body style="margin:0;padding:0;background:#fff;overflow:hidden;">{SVG}</body></html>')
        html_path = f.name
    try:
        subprocess.run(
            [
                chrome,
                "--headless=new",
                "--disable-gpu",
                "--hide-scrollbars",
                "--force-device-scale-factor=2",
                "--window-size=1600,2220",
                f"--screenshot={png_path}",
                Path(html_path).as_uri(),
            ],
            check=True,
        )
    finally:
        Path(html_path).unlink(missing_ok=True)

print("Generated:", svg_path, png_path)
