from pathlib import Path
from playwright.sync_api import sync_playwright

OUT_DIR = Path(r"d:\HTTT18B\KLTN\NovaCare\docs\diagrams")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Optimized for A4 Word reports: compact width (1480px) + LARGE 15.5px-17px bold typography
SVG = """<svg xmlns="http://www.w3.org/2000/svg" width="1480" height="2020" viewBox="0 0 1480 2020">
  <defs>
    <style>
      .lifeline-label { font-family: 'Segoe UI', Arial, sans-serif; font-size: 16.5px; font-weight: 800; fill: #0f172a; text-anchor: middle; }
      .lifeline-sub { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; font-weight: 600; fill: #334155; text-anchor: middle; }
      .msg { font-family: 'Segoe UI', Arial, sans-serif; font-size: 15.5px; font-weight: 600; fill: #0f172a; paint-order: stroke; stroke: #FFFFFF; stroke-width: 7px; stroke-linejoin: round; }
      .guard { font-family: 'Segoe UI', Arial, sans-serif; font-size: 15.5px; font-weight: 800; fill: #0f172a; paint-order: stroke; stroke: #FFFFFF; stroke-width: 7px; stroke-linejoin: round; }
      .frag-tag { font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; font-weight: 800; fill: #0f172a; }
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
  <rect x="0" y="0" width="1480" height="2020" fill="#FFFFFF"/>

  <!-- Frame -->
  <rect x="14" y="14" width="1452" height="1992" fill="none" stroke="#64748b" stroke-width="1.6"/>
  <polygon points="14,14 555,14 555,46 537,62 14,62" fill="#F1F5F9" stroke="#64748b" stroke-width="1.6"/>
  <text x="30" y="45" class="frag-tag" style="font-size:17px;">sd Theo dõi lịch hẹn bệnh nhân được phân công (NovaCare)</text>

  <!-- ================= LIFELINES (5) ================= -->
  <!-- X: Doctor=95, GD=375, CTR_DoctorPortal=715, E_doctors=1045, E_appointments=1345 -->

  <!-- 1. Actor: Bác sĩ -->
  <g transform="translate(95, 112)">
    <circle cx="0" cy="-18" r="12" class="icon-fill"/>
    <line x1="0" y1="-6" x2="0" y2="20" class="icon-stroke"/>
    <line x1="-18" y1="3" x2="18" y2="3" class="icon-stroke"/>
    <line x1="0" y1="20" x2="-14" y2="38" class="icon-stroke"/>
    <line x1="0" y1="20" x2="14" y2="38" class="icon-stroke"/>
    <text x="0" y="58" class="lifeline-label">Bác sĩ</text>
    <text x="0" y="76" class="lifeline-sub">(DOCTOR)</text>
  </g>
  <line x1="95" y1="204" x2="95" y2="1985" class="lifeline"/>

  <!-- 2. Boundary: GD_LichHenBacSi -->
  <g transform="translate(375, 124)">
    <line x1="-30" y1="-19" x2="-30" y2="19" class="icon-stroke"/>
    <line x1="-30" y1="0" x2="-18" y2="0" class="icon-stroke"/>
    <circle cx="3" cy="0" r="21" class="icon-fill"/>
    <text x="0" y="48" class="lifeline-label">GD_LichHenBacSi</text>
    <text x="0" y="68" class="lifeline-sub">&lt;&lt;boundary&gt;&gt;</text>
  </g>
  <line x1="375" y1="204" x2="375" y2="1985" class="lifeline"/>

  <!-- 3. Control: CTR_DoctorPortalService -->
  <g transform="translate(715, 124)">
    <circle cx="0" cy="0" r="21" class="icon-fill"/>
    <path d="M -5,-27 L 5,-21 L -5,-15" fill="none" stroke="#0f172a" stroke-width="2"/>
    <text x="0" y="48" class="lifeline-label">CTR_DoctorPortalService</text>
    <text x="0" y="68" class="lifeline-sub">&lt;&lt;control&gt;&gt;</text>
  </g>
  <line x1="715" y1="204" x2="715" y2="1985" class="lifeline"/>

  <!-- 4. Entity: E_doctors -->
  <g transform="translate(1045, 124)">
    <circle cx="0" cy="-2" r="21" class="icon-fill"/>
    <line x1="-23" y1="21" x2="23" y2="21" class="icon-stroke"/>
    <text x="0" y="48" class="lifeline-label">E_doctors</text>
    <text x="0" y="68" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="1045" y1="204" x2="1045" y2="1985" class="lifeline"/>

  <!-- 5. Entity: E_appointments -->
  <g transform="translate(1345, 124)">
    <circle cx="0" cy="-2" r="21" class="icon-fill"/>
    <line x1="-23" y1="21" x2="23" y2="21" class="icon-stroke"/>
    <text x="0" y="48" class="lifeline-label">E_appointments</text>
    <text x="0" y="68" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="1345" y1="204" x2="1345" y2="1985" class="lifeline"/>

  <!-- ================= ACTIVATION BARS ================= -->
  <!-- Bác sĩ -->
  <rect x="87" y="228" width="16" height="1730" class="act"/>

  <!-- GD_LichHenBacSi -->
  <rect x="367" y="242" width="16" height="1704" class="act"/>
  <rect x="375" y="1878" width="14" height="24" class="act"/>

  <!-- CTR_DoctorPortalService -->
  <rect x="707" y="294" width="16" height="398" class="act"/>
  <rect x="707" y="1282" width="16" height="256" class="act"/>
  <rect x="715" y="1316" width="14" height="24" class="act"/>

  <!-- E_doctors -->
  <rect x="1037" y="408" width="16" height="48" class="act"/>

  <!-- E_appointments -->
  <rect x="1337" y="510" width="16" height="48" class="act"/>
  <rect x="1337" y="1386" width="16" height="48" class="act"/>

  <!-- ================= PHASE 1: TẢI LỊCH HẸN MẶC ĐỊNH (-7 NGÀY ĐẾN +30 NGÀY) (Steps 1-3, Alt 2.1, 2.2, 3.1) ================= -->
  <line x1="103" y1="244" x2="367" y2="244" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="116" y="235" class="msg">1: Chọn chức năng "Lịch hẹn"</text>

  <line x1="383" y1="296" x2="707" y2="296" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="396" y="279" class="msg">1.1: getAppointments(userId,</text>
  <text x="424" y="316" class="msg">{ startDate: -7d, endDate: +30d })</text>

  <!-- ALT 1: Phiên đăng nhập & Kết nối (Alt 2.1, 2.2, 3.1) -->
  <rect x="28" y="336" width="1424" height="802" class="frag-box"/>
  <polygon points="28,336 92,336 92,360 78,372 28,372" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="46" y="360" class="frag-tag">alt</text>
  <text x="114" y="361" class="guard">[JWT hợp lệ, role == "DOCTOR", hồ sơ hoạt động &amp;&amp; kết nối thành công]</text>

  <line x1="723" y1="410" x2="1037" y2="410" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="738" y="401" class="msg">1.2: getDoctorOrThrow(userId)</text>

  <line x1="1037" y1="456" x2="723" y2="456" class="ret" marker-end="url(#openArrow)"/>
  <text x="820" y="447" class="msg">1.3: doctor, workplaceIds</text>

  <line x1="723" y1="512" x2="1337" y2="512" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="738" y="503" class="msg">1.4: findMany({ doctorWorkplaceId ∈ workplaceIds, startTime ∈ [-7d..+30d] })</text>

  <line x1="1337" y1="558" x2="723" y2="558" class="ret" marker-end="url(#openArrow)"/>
  <text x="955" y="549" class="msg">1.5: appointments[], total</text>

  <line x1="707" y1="628" x2="383" y2="628" class="ret" marker-end="url(#openArrow)"/>
  <text x="430" y="619" class="msg">1.6: { data: { items: appointments, total } }</text>

  <!-- ALT 1.1: Có lịch hẹn hay không (Alt 3.1) -->
  <rect x="44" y="660" width="1392" height="276" class="frag-box"/>
  <polygon points="44,660 106,660 106,682 92,694 44,694" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="61" y="683" class="frag-tag">alt</text>
  <text x="118" y="684" class="guard">[appointments.length &gt; 0]</text>

  <line x1="367" y1="744" x2="103" y2="744" class="ret" marker-end="url(#openArrow)"/>
  <text x="116" y="727" class="msg">1.7: Hiển thị tổng số lịch hẹn (total) &amp; từng lịch gồm</text>
  <text x="150" y="764" class="msg">tên bệnh nhân, thời gian, trạng thái (chỉ đọc)</text>

  <line x1="44" y1="814" x2="1436" y2="814" class="frag-div"/>
  <text x="118" y="842" class="guard">[không có lịch hẹn trong phạm vi thời gian hiện tại (Alt 3.1)]</text>

  <line x1="367" y1="896" x2="103" y2="896" class="ret" marker-end="url(#openArrow)"/>
  <text x="116" y="887" class="msg">1.8: Hiển thị thông báo "Không có lịch hẹn phù hợp"</text>

  <!-- ELSE 1: Phiên hết hạn / không có quyền (Alt 2.1) -->
  <line x1="28" y1="958" x2="1452" y2="958" class="frag-div"/>
  <text x="114" y="984" class="guard">[phiên đăng nhập hết hạn hoặc không còn quyền truy cập - 401/403 (Alt 2.1)]</text>

  <line x1="367" y1="1028" x2="103" y2="1028" class="ret" marker-end="url(#openArrow)"/>
  <text x="116" y="1019" class="msg">1.9: Chuyển về màn hình đăng nhập (kết thúc use case)</text>

  <!-- ELSE 2: Lỗi kết nối / máy chủ (Alt 2.2) -->
  <line x1="28" y1="1048" x2="1452" y2="1048" class="frag-div"/>
  <text x="114" y="1074" class="guard">[không thể tải danh sách do mất kết nối hoặc lỗi máy chủ (Alt 2.2)]</text>

  <line x1="367" y1="1118" x2="103" y2="1118" class="ret" marker-end="url(#openArrow)"/>
  <text x="116" y="1109" class="msg">1.10: Hiển thị thông báo lỗi &amp; nút "Thử lại" (quay lại bước 2)</text>

  <!-- ================= PHASE 2: LỌC THEO TRẠNG THÁI & CHỌN LỊCH HẸN (Steps 4-8, Alt 6.1) ================= -->
  <line x1="103" y1="1220" x2="367" y2="1220" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="116" y="1211" class="msg">2: Chọn bộ lọc status (ALL / CONFIRMED / PAID / COMPLETED)</text>

  <line x1="383" y1="1284" x2="707" y2="1284" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="396" y="1275" class="msg">2.1: getAppointments(userId, { startDate, endDate, status })</text>

  <path d="M 723 1312 L 768 1312 L 768 1336 L 729 1336" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="778" y="1330" class="msg">2.2: validateStatusFilter(status)</text>

  <line x1="723" y1="1388" x2="1337" y2="1388" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="738" y="1379" class="msg">2.3: findMany({ doctorWorkplaceId ∈ workplaceIds, startTime, status })</text>

  <line x1="1337" y1="1434" x2="723" y2="1434" class="ret" marker-end="url(#openArrow)"/>
  <text x="955" y="1425" class="msg">2.4: filteredAppointments[]</text>

  <!-- ALT 2: Kết quả lọc theo trạng thái (Alt 6.1) -->
  <rect x="28" y="1464" width="1424" height="290" class="frag-box"/>
  <polygon points="28,1464 92,1464 92,1488 78,1500 28,1500" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="46" y="1488" class="frag-tag">alt</text>
  <text x="114" y="1489" class="guard">[filteredAppointments.length &gt; 0]</text>

  <line x1="707" y1="1536" x2="383" y2="1536" class="ret" marker-end="url(#openArrow)"/>
  <text x="430" y="1527" class="msg">2.5: { data: { items: filteredAppointments } }</text>

  <line x1="367" y1="1592" x2="103" y2="1592" class="ret" marker-end="url(#openArrow)"/>
  <text x="116" y="1583" class="msg">2.6: Hiển thị danh sách lịch hẹn phù hợp với trạng thái đã chọn</text>

  <line x1="28" y1="1632" x2="1452" y2="1632" class="frag-div"/>
  <text x="114" y="1660" class="guard">[không có lịch hẹn phù hợp với trạng thái đã chọn (Alt 6.1)]</text>

  <line x1="367" y1="1716" x2="103" y2="1716" class="ret" marker-end="url(#openArrow)"/>
  <text x="116" y="1707" class="msg">2.7: Hiển thị "Không có lịch hẹn phù hợp" (chọn bộ lọc khác quay lại bước 5)</text>

  <!-- Steps 7-8: Chọn một lịch hẹn -> Mở chi tiết -->
  <line x1="103" y1="1830" x2="367" y2="1830" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="116" y="1821" class="msg">3: Chọn một lịch hẹn (appointmentId)</text>

  <path d="M 383 1874 L 428 1874 L 428 1898 L 389 1898" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="438" y="1892" class="msg">3.1: navigateTo(GD_ChiTietLichHen, appointmentId)</text>

  <line x1="367" y1="1946" x2="103" y2="1946" class="ret" marker-end="url(#openArrow)"/>
  <text x="116" y="1937" class="msg">3.2: Mở màn hình chi tiết lịch hẹn đã chọn</text>
</svg>
"""

svg_path = OUT_DIR / "seq_theo_doi_lich_hen_bac_si.svg"
png_path = OUT_DIR / "seq_theo_doi_lich_hen_bac_si.png"
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
    page = browser.new_page(viewport={"width": 1480, "height": 2020}, device_scale_factor=2)
    page.set_content(html)
    page.locator("svg").screenshot(path=str(png_path))
    browser.close()

print(f"Rendered: {svg_path}")
print(f"Rendered: {png_path}")
