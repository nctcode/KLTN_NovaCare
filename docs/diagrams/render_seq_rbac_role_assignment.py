from pathlib import Path
import subprocess
import tempfile

OUT_DIR = Path(__file__).resolve().parent
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Visual Paradigm BCE UML Sequence Diagram - Phân quyền và gán vai trò tài khoản (Finalized Spec)
# Width: 1600px, Height: 2520px, 2x PNG -> 3200 x 5040px
# Includes UML Create Message (<<create>>) and Destruction Occurrence (X) for ObjUser_new
SVG = """<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="2520" viewBox="0 0 1600 2520">
  <defs>
    <style>
      .lifeline-label { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14.6px; font-weight: 800; fill: #0f172a; text-anchor: middle; }
      .lifeline-sub { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12.2px; font-weight: 600; fill: #334155; text-anchor: middle; }
      .msg { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: 600; fill: #0f172a; paint-order: stroke; stroke: #FFFFFF; stroke-width: 7px; stroke-linejoin: round; }
      .guard { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14.2px; font-weight: 800; fill: #0f172a; paint-order: stroke; stroke: #FFFFFF; stroke-width: 7px; stroke-linejoin: round; }
      .frag-tag { font-family: 'Segoe UI', Arial, sans-serif; font-size: 15.5px; font-weight: 800; fill: #0f172a; }
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
  <rect x="0" y="0" width="1600" height="2520" fill="#FFFFFF"/>

  <!-- Frame -->
  <rect x="14" y="14" width="1572" height="2492" fill="none" stroke="#64748b" stroke-width="1.6"/>
  <polygon points="14,14 550,14 550,46 532,62 14,62" fill="#F1F5F9" stroke="#64748b" stroke-width="1.6"/>
  <text x="30" y="45" class="frag-tag" style="font-size:17px;">sd Phân quyền và gán vai trò tài khoản (NovaCare)</text>

  <!-- ================= LIFELINES (5 top + dynamic ObjUser_new at x=865) ================= -->
  <!-- X: Admin=85, GD=320, CTR=610, [ObjUser_new=865], E_users=1125, E_audit_logs=1385 -->

  <!-- 1. Actor: Quản trị viên hệ thống -->
  <g transform="translate(85, 110)">
    <circle cx="0" cy="-18" r="12" class="icon-fill"/>
    <line x1="0" y1="-6" x2="0" y2="20" class="icon-stroke"/>
    <line x1="-18" y1="3" x2="18" y2="3" class="icon-stroke"/>
    <line x1="0" y1="20" x2="-14" y2="38" class="icon-stroke"/>
    <line x1="0" y1="20" x2="14" y2="38" class="icon-stroke"/>
    <text x="0" y="55" class="lifeline-label">Quản trị viên</text>
    <text x="0" y="72" class="lifeline-label">hệ thống</text>
    <text x="0" y="88" class="lifeline-sub">(ADMIN)</text>
  </g>
  <line x1="85" y1="208" x2="85" y2="2480" class="lifeline"/>

  <!-- 2. Boundary: GD_PhanQuyenVaiTro -->
  <g transform="translate(320, 124)">
    <line x1="-29" y1="-19" x2="-29" y2="19" class="icon-stroke"/>
    <line x1="-29" y1="0" x2="-17" y2="0" class="icon-stroke"/>
    <circle cx="3" cy="0" r="20" class="icon-fill"/>
    <text x="0" y="45" class="lifeline-label">GD_PhanQuyen</text>
    <text x="0" y="62" class="lifeline-label">VaiTro</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;boundary&gt;&gt;</text>
  </g>
  <line x1="320" y1="208" x2="320" y2="2480" class="lifeline"/>

  <!-- 3. Control: CTR_AdminUsersService -->
  <g transform="translate(610, 124)">
    <circle cx="0" cy="0" r="20" class="icon-fill"/>
    <path d="M -5,-26 L 5,-20 L -5,-14" fill="none" stroke="#0f172a" stroke-width="2"/>
    <text x="0" y="45" class="lifeline-label">CTR_AdminUsers</text>
    <text x="0" y="62" class="lifeline-label">Service</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;control&gt;&gt;</text>
  </g>
  <line x1="610" y1="208" x2="610" y2="2480" class="lifeline"/>

  <!-- 4. Entity: E_users -->
  <g transform="translate(1125, 124)">
    <circle cx="0" cy="-2" r="20" class="icon-fill"/>
    <line x1="-22" y1="20" x2="22" y2="20" class="icon-stroke"/>
    <text x="0" y="48" class="lifeline-label">E_users</text>
    <text x="0" y="66" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="1125" y1="208" x2="1125" y2="2480" class="lifeline"/>

  <!-- 5. Entity: E_audit_logs -->
  <g transform="translate(1385, 124)">
    <circle cx="0" cy="-2" r="20" class="icon-fill"/>
    <line x1="-22" y1="20" x2="22" y2="20" class="icon-stroke"/>
    <text x="0" y="48" class="lifeline-label">E_audit_logs</text>
    <text x="0" y="66" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="1385" y1="208" x2="1385" y2="2480" class="lifeline"/>

  <!-- ================= ACTIVATION BARS ================= -->
  <!-- Actor -->
  <rect x="77" y="232" width="16" height="2198" class="act"/>

  <!-- GD_PhanQuyenVaiTro -->
  <rect x="312" y="244" width="16" height="2178" class="act"/>

  <!-- CTR_AdminUsersService -->
  <rect x="602" y="284" width="16" height="132" class="act"/>
  <rect x="602" y="616" width="16" height="690" class="act"/>
  <rect x="610" y="1094" width="14" height="24" class="act"/>
  <rect x="602" y="1420" width="16" height="40" class="act"/>
  <rect x="602" y="1696" width="16" height="486" class="act"/>
  <rect x="602" y="2308" width="16" height="40" class="act"/>

  <!-- E_users -->
  <rect x="1117" y="324" width="16" height="50" class="act"/>
  <rect x="1117" y="658" width="16" height="52" class="act"/>
  <rect x="1117" y="964" width="16" height="108" class="act"/>
  <rect x="1125" y="992" width="14" height="24" class="act"/>
  <rect x="1117" y="1738" width="16" height="52" class="act"/>
  <rect x="1117" y="1884" width="16" height="106" class="act"/>
  <rect x="1125" y="1912" width="14" height="24" class="act"/>

  <!-- E_audit_logs -->
  <rect x="1377" y="1160" width="16" height="100" class="act"/>
  <rect x="1385" y="1188" width="14" height="24" class="act"/>
  <rect x="1377" y="2030" width="16" height="102" class="act"/>
  <rect x="1385" y="2058" width="14" height="24" class="act"/>

  <!-- ================= PHASE 1: TRUY CẬP TRANG PHÂN QUYỀN (Steps 1 - 2) ================= -->
  <line x1="93" y1="246" x2="312" y2="246" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="106" y="236" class="msg">1: Truy cập mục "Quản lý vai trò và phân quyền người dùng"</text>

  <line x1="328" y1="286" x2="602" y2="286" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="342" y="276" class="msg">1.1: findAll(roles=[HOSPITAL_ADMIN, ADMIN])</text>

  <line x1="618" y1="326" x2="1117" y2="326" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="745" y="316" class="msg">1.2: findMany(roles, hospital)</text>

  <line x1="1117" y1="368" x2="618" y2="368" class="ret" marker-end="url(#openArrow)"/>
  <text x="685" y="358" class="msg">1.3: Trả về danh sách tài khoản quản trị &amp; phạm vi cơ sở</text>

  <line x1="602" y1="410" x2="328" y2="410" class="ret" marker-end="url(#openArrow)"/>
  <text x="342" y="400" class="msg">1.4: Trả về danh sách tài khoản quản trị</text>

  <line x1="312" y1="468" x2="93" y2="468" class="ret" marker-end="url(#openArrow)"/>
  <text x="106" y="440" class="msg">1.5: Hiển thị Tab "Ma trận phân quyền (RBAC)", Tab "Tài khoản quản trị &amp; Phạm vi cơ sở"</text>
  <text x="138" y="458" class="msg">và nút "Cấp tài khoản quản trị cơ sở"</text>

  <!-- ================= OUTER ALT: CẤP TÀI KHOẢN vs ĐIỀU CHUYỂN CƠ SỞ (Steps 3 - 6, Alt 3.1, 4.1) ================= -->
  <rect x="28" y="496" width="1544" height="1956" class="frag-box"/>
  <polygon points="28,496 92,496 92,520 78,532 28,532" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="46" y="520" class="frag-tag">alt</text>
  <text x="112" y="521" class="guard">[Chọn "Cấp tài khoản quản trị cơ sở" (HOSPITAL_ADMIN)]</text>

  <!-- Branch A: Cấp tài khoản HOSPITAL_ADMIN mới -->
  <line x1="93" y1="576" x2="312" y2="576" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="106" y="548" class="msg">2: Nhấn "Cấp tài khoản quản trị cơ sở", chọn cơ sở y tế, nhập họ tên,</text>
  <text x="124" y="566" class="msg">email và nhấn "Cấp tài khoản &amp; gửi email"</text>

  <line x1="328" y1="618" x2="602" y2="618" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="342" y="608" class="msg">2.1: createHospitalAdmin(hospitalId, fullName, email)</text>

  <line x1="618" y1="660" x2="1117" y2="660" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="720" y="650" class="msg">2.2: validateHospitalAndEmail(hospitalId, email)</text>

  <line x1="1117" y1="704" x2="618" y2="704" class="ret" marker-end="url(#openArrow)"/>
  <text x="700" y="694" class="msg">2.3: Trả về kết quả kiểm tra cơ sở y tế &amp; email</text>

  <!-- INNER ALT A: Hợp lệ vs Trùng email / Ngừng hợp tác -->
  <rect x="46" y="732" width="1508" height="794" class="frag-box"/>
  <polygon points="46,732 110,732 110,756 96,768 46,768" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="64" y="756" class="frag-tag">alt</text>
  <text x="130" y="757" class="guard">[Cơ sở y tế đang hợp tác và email chưa tồn tại trong hệ thống]</text>

  <!-- Dynamic Object Creation: ObjUser_new -->
  <line x1="618" y1="828" x2="835" y2="828" class="ret" marker-end="url(#openArrow)"/>
  <text x="676" y="802" class="msg">2.4: &laquo;create&raquo;</text>
  <text x="648" y="820" class="msg">CreateObjUser_new</text>

  <g transform="translate(865, 828)">
    <circle cx="0" cy="-2" r="20" class="icon-fill"/>
    <line x1="-22" y1="20" x2="22" y2="20" class="icon-stroke"/>
    <text x="0" y="40" class="lifeline-label" style="font-size:13.8px;">ObjUser_new</text>
    <text x="0" y="55" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="865" y1="888" x2="865" y2="1024" class="lifeline"/>
  <rect x="857" y="902" width="16" height="28" class="act"/>

  <line x1="857" y1="918" x2="618" y2="918" class="ret" marker-end="url(#openArrow)"/>
  <text x="652" y="908" class="msg">2.5: Trả về ObjUser_new</text>

  <line x1="618" y1="966" x2="1117" y2="966" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="905" y="956" class="msg">2.6: create(ObjUser_new)</text>

  <path d="M 1133 988 L 1170 988 L 1170 1012 L 1139 1012" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="1180" y="996" class="msg" style="font-size:13.4px;">2.7: Lưu tài khoản</text>
  <text x="1206" y="1014" class="msg" style="font-size:13.4px;">chờ kích hoạt</text>

  <!-- UML Destruction X for ObjUser_new -->
  <line x1="851" y1="1010" x2="879" y2="1038" stroke="#0f172a" stroke-width="2.4"/>
  <line x1="879" y1="1010" x2="851" y2="1038" stroke="#0f172a" stroke-width="2.4"/>

  <line x1="1117" y1="1066" x2="618" y2="1066" class="ret" marker-end="url(#openArrow)"/>
  <text x="760" y="1056" class="msg">2.8: Trả về tài khoản mới tạo (isActive=false)</text>

  <path d="M 618 1090 L 664 1090 L 664 1114 L 624 1114" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="674" y="1108" class="msg">2.9: sendHospitalActivationEmail(email, activationUrl)  // Hiệu lực 24 giờ</text>

  <line x1="618" y1="1162" x2="1377" y2="1162" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="845" y="1152" class="msg">2.10: logAction(CREATE_HOSPITAL_ADMIN, userId)</text>

  <path d="M 1393 1184 L 1428 1184 L 1428 1208 L 1399 1208" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="1436" y="1192" class="msg" style="font-size:13.4px;">2.11: Ghi nhật</text>
  <text x="1452" y="1210" class="msg" style="font-size:13.4px;">ký thao tác</text>

  <line x1="1377" y1="1254" x2="618" y2="1254" class="ret" marker-end="url(#openArrow)"/>
  <text x="875" y="1244" class="msg">2.12: Hoàn tất ghi nhật ký thao tác</text>

  <line x1="602" y1="1300" x2="328" y2="1300" class="ret" marker-end="url(#openArrow)"/>
  <text x="342" y="1290" class="msg">2.13: Trả về kết quả cấp tài khoản &amp; gửi email thành công</text>

  <line x1="312" y1="1352" x2="93" y2="1352" class="ret" marker-end="url(#openArrow)"/>
  <text x="106" y="1342" class="msg">2.14: Đóng hộp thoại, hiển thị thông báo thành công và làm mới danh sách tài khoản quản trị</text>

  <!-- INNER ELSE A (Alt 3.1, 4.1) -->
  <line x1="46" y1="1380" x2="1554" y2="1380" class="frag-div"/>
  <text x="130" y="1408" class="guard">[Email đã tồn tại trong hệ thống hoặc cơ sở y tế đã ngừng hợp tác (Alt 3.1, 4.1)]</text>

  <line x1="602" y1="1454" x2="328" y2="1454" class="ret" marker-end="url(#openArrow)"/>
  <text x="342" y="1444" class="msg">2.15: Trả về lỗi kiểm tra (409 Conflict / 400 Bad Request)</text>

  <line x1="312" y1="1502" x2="93" y2="1502" class="ret" marker-end="url(#openArrow)"/>
  <text x="106" y="1492" class="msg">2.16: Giữ nguyên hộp thoại và hiển thị thông báo lỗi tương ứng</text>

  <!-- ================= OUTER ELSE: ĐIỀU CHUYỂN CƠ SỞ PHỤ TRÁCH ================= -->
  <line x1="28" y1="1560" x2="1572" y2="1560" class="frag-div"/>
  <text x="112" y="1590" class="guard">[Chọn "Điều chuyển cơ sở" tại Tab "Tài khoản quản trị &amp; Phạm vi cơ sở"]</text>

  <line x1="93" y1="1652" x2="312" y2="1652" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="106" y="1624" class="msg">3: Chọn tài khoản HOSPITAL_ADMIN, nhấn "Điều chuyển cơ sở",</text>
  <text x="124" y="1642" class="msg">chọn cơ sở y tế phụ trách mới và nhấn "Xác nhận điều chuyển"</text>

  <line x1="328" y1="1698" x2="602" y2="1698" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="342" y="1688" class="msg">3.1: updateRole(userId, HOSPITAL_ADMIN, newHospitalId)</text>

  <line x1="618" y1="1740" x2="1117" y2="1740" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="720" y="1730" class="msg">3.2: validateScopeTransfer(userId, newHospitalId)</text>

  <line x1="1117" y1="1784" x2="618" y2="1784" class="ret" marker-end="url(#openArrow)"/>
  <text x="700" y="1774" class="msg">3.3: Trả về kết quả kiểm tra tài khoản &amp; cơ sở mới</text>

  <!-- INNER ALT B: Hợp lệ vs Lỗi -->
  <rect x="46" y="1812" width="1508" height="610" class="frag-box"/>
  <polygon points="46,1812 110,1812 110,1836 96,1848 46,1848" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="64" y="1836" class="frag-tag">alt</text>
  <text x="130" y="1837" class="guard">[Đúng tài khoản HOSPITAL_ADMIN, cơ sở mới đang hợp tác và khác cơ sở hiện tại]</text>

  <line x1="618" y1="1886" x2="1117" y2="1886" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="705" y="1876" class="msg">3.4: update(userId, newHospitalId, authVersion + 1)</text>

  <path d="M 1133 1908 L 1170 1908 L 1170 1932 L 1139 1932" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="1180" y="1916" class="msg" style="font-size:13.4px;">3.5: Cập nhật cơ sở &amp;</text>
  <text x="1206" y="1934" class="msg" style="font-size:13.4px;">thu hồi phiên cũ</text>

  <line x1="1117" y1="1984" x2="618" y2="1984" class="ret" marker-end="url(#openArrow)"/>
  <text x="750" y="1974" class="msg">3.6: Trả về tài khoản đã điều chuyển cơ sở</text>

  <line x1="618" y1="2032" x2="1377" y2="2032" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="860" y="2022" class="msg">3.7: logAction(UPDATE_USER_ROLE, userId)</text>

  <path d="M 1393 2054 L 1428 2054 L 1428 2078 L 1399 2078" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="1436" y="2062" class="msg" style="font-size:13.4px;">3.8: Ghi nhật</text>
  <text x="1450" y="2080" class="msg" style="font-size:13.4px;">ký điều chuyển</text>

  <line x1="1377" y1="2126" x2="618" y2="2126" class="ret" marker-end="url(#openArrow)"/>
  <text x="875" y="2116" class="msg">3.9: Hoàn tất ghi nhật ký điều chuyển</text>

  <line x1="602" y1="2174" x2="328" y2="2174" class="ret" marker-end="url(#openArrow)"/>
  <text x="342" y="2164" class="msg">3.10: Trả về kết quả điều chuyển cơ sở thành công</text>

  <line x1="312" y1="2224" x2="93" y2="2224" class="ret" marker-end="url(#openArrow)"/>
  <text x="106" y="2214" class="msg">3.11: Đóng hộp thoại, hiển thị thông báo thành công và làm mới danh sách tài khoản quản trị</text>

  <!-- INNER ELSE B (Alt 3.1, 4.1) -->
  <line x1="46" y1="2256" x2="1554" y2="2256" class="frag-div"/>
  <text x="130" y="2286" class="guard">[Cơ sở y tế đã ngừng hợp tác hoặc điều kiện không hợp lệ (Alt 3.1, 4.1)]</text>

  <line x1="602" y1="2342" x2="328" y2="2342" class="ret" marker-end="url(#openArrow)"/>
  <text x="342" y="2332" class="msg">3.12: Trả về lỗi kiểm tra (400 Bad Request)</text>

  <line x1="312" y1="2394" x2="93" y2="2394" class="ret" marker-end="url(#openArrow)"/>
  <text x="106" y="2384" class="msg">3.13: Giữ nguyên hộp thoại và hiển thị thông báo lỗi tương ứng</text>
</svg>
"""

svg_path = OUT_DIR / "seq_phan_quyen_gan_vai_tro.svg"
png_path = OUT_DIR / "seq_phan_quyen_gan_vai_tro.png"
svg_path.write_text(SVG, encoding="utf-8")

try:
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1600, "height": 2520}, device_scale_factor=2)
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
                "--window-size=1600,2520",
                f"--screenshot={png_path}",
                Path(html_path).as_uri(),
            ],
            check=True,
        )
    finally:
        Path(html_path).unlink(missing_ok=True)

print("Generated:", svg_path, png_path)
