from pathlib import Path
from playwright.sync_api import sync_playwright

OUT_DIR = Path(r"d:\HTTT18B\KLTN\NovaCare\docs\diagrams")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Optimized for A4 Word reports: compact width (1560px) + LARGE 15.5px-16.5px bold typography
SVG = """<svg xmlns="http://www.w3.org/2000/svg" width="1560" height="2380" viewBox="0 0 1560 2380">
  <defs>
    <style>
      .lifeline-label { font-family: 'Segoe UI', Arial, sans-serif; font-size: 15.5px; font-weight: 800; fill: #0f172a; text-anchor: middle; }
      .lifeline-sub { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12.4px; font-weight: 600; fill: #334155; text-anchor: middle; }
      .msg { font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 600; fill: #0f172a; paint-order: stroke; stroke: #FFFFFF; stroke-width: 7px; stroke-linejoin: round; }
      .guard { font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 800; fill: #0f172a; paint-order: stroke; stroke: #FFFFFF; stroke-width: 7px; stroke-linejoin: round; }
      .frag-tag { font-family: 'Segoe UI', Arial, sans-serif; font-size: 15.5px; font-weight: 800; fill: #0f172a; }
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
  <rect x="0" y="0" width="1560" height="2380" fill="#FFFFFF"/>

  <!-- Frame -->
  <rect x="14" y="14" width="1532" height="2352" fill="none" stroke="#64748b" stroke-width="1.6"/>
  <polygon points="14,14 450,14 450,46 432,62 14,62" fill="#F1F5F9" stroke="#64748b" stroke-width="1.6"/>
  <text x="30" y="45" class="frag-tag" style="font-size:17px;">sd Chia sẻ hồ sơ bệnh án cũ (NovaCare)</text>

  <!-- ================= LIFELINES (7) ================= -->
  <!-- X: Patient=90, GD=335, CTR_Consent=615, E_prof=870, E_enc=1090, E_cons=1305, TargetHosp=1480 -->

  <!-- 1. Actor: Bệnh nhân -->
  <g transform="translate(90, 112)">
    <circle cx="0" cy="-18" r="12" class="icon-fill"/>
    <line x1="0" y1="-6" x2="0" y2="20" class="icon-stroke"/>
    <line x1="-18" y1="3" x2="18" y2="3" class="icon-stroke"/>
    <line x1="0" y1="20" x2="-14" y2="38" class="icon-stroke"/>
    <line x1="0" y1="20" x2="14" y2="38" class="icon-stroke"/>
    <text x="0" y="58" class="lifeline-label">Bệnh nhân</text>
    <text x="0" y="75" class="lifeline-sub">(PATIENT)</text>
  </g>
  <line x1="90" y1="204" x2="90" y2="2345" class="lifeline"/>

  <!-- 2. Boundary: GD_ChiaSeBenhAn -->
  <g transform="translate(335, 124)">
    <line x1="-28" y1="-19" x2="-28" y2="19" class="icon-stroke"/>
    <line x1="-28" y1="0" x2="-17" y2="0" class="icon-stroke"/>
    <circle cx="3" cy="0" r="20" class="icon-fill"/>
    <text x="0" y="48" class="lifeline-label">GD_ChiaSeBenhAn</text>
    <text x="0" y="66" class="lifeline-sub">&lt;&lt;boundary&gt;&gt;</text>
  </g>
  <line x1="335" y1="204" x2="335" y2="2345" class="lifeline"/>

  <!-- 3. Control: CTR_ConsentService -->
  <g transform="translate(615, 124)">
    <circle cx="0" cy="0" r="20" class="icon-fill"/>
    <path d="M -5,-26 L 5,-20 L -5,-14" fill="none" stroke="#0f172a" stroke-width="2"/>
    <text x="0" y="48" class="lifeline-label">CTR_ConsentService</text>
    <text x="0" y="66" class="lifeline-sub">&lt;&lt;control&gt;&gt;</text>
  </g>
  <line x1="615" y1="204" x2="615" y2="2345" class="lifeline"/>

  <!-- 4. Entity: E_patient_profiles -->
  <g transform="translate(870, 124)">
    <circle cx="0" cy="-2" r="20" class="icon-fill"/>
    <line x1="-22" y1="20" x2="22" y2="20" class="icon-stroke"/>
    <text x="0" y="45" class="lifeline-label" style="font-size:14.5px;">E_patient_</text>
    <text x="0" y="62" class="lifeline-label" style="font-size:14.5px;">profiles</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="870" y1="204" x2="870" y2="2345" class="lifeline"/>

  <!-- 5. Entity: E_medical_encounters -->
  <g transform="translate(1090, 124)">
    <circle cx="0" cy="-2" r="20" class="icon-fill"/>
    <line x1="-22" y1="20" x2="22" y2="20" class="icon-stroke"/>
    <text x="0" y="45" class="lifeline-label" style="font-size:14.5px;">E_medical_</text>
    <text x="0" y="62" class="lifeline-label" style="font-size:14.5px;">encounters</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="1090" y1="204" x2="1090" y2="2345" class="lifeline"/>

  <!-- 6. Entity: E_patient_consents -->
  <g transform="translate(1305, 124)">
    <circle cx="0" cy="-2" r="20" class="icon-fill"/>
    <line x1="-22" y1="20" x2="22" y2="20" class="icon-stroke"/>
    <text x="0" y="45" class="lifeline-label" style="font-size:14.5px;">E_patient_</text>
    <text x="0" y="62" class="lifeline-label" style="font-size:14.5px;">consents</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="1305" y1="204" x2="1305" y2="2345" class="lifeline"/>

  <!-- 7. Secondary Actor: Cơ sở y tế tiếp nhận -->
  <g transform="translate(1480, 112)">
    <circle cx="0" cy="-18" r="12" class="icon-fill"/>
    <line x1="0" y1="-6" x2="0" y2="20" class="icon-stroke"/>
    <line x1="-18" y1="3" x2="18" y2="3" class="icon-stroke"/>
    <line x1="0" y1="20" x2="-14" y2="38" class="icon-stroke"/>
    <line x1="0" y1="20" x2="14" y2="38" class="icon-stroke"/>
    <text x="0" y="56" class="lifeline-label" style="font-size:14px;">Cơ sở y tế</text>
    <text x="0" y="72" class="lifeline-label" style="font-size:14px;">tiếp nhận</text>
    <text x="0" y="87" class="lifeline-sub">(targetHospital)</text>
  </g>
  <line x1="1480" y1="204" x2="1480" y2="2345" class="lifeline"/>

  <!-- ================= ACTIVATION BARS ================= -->
  <!-- Bệnh nhân -->
  <rect x="82" y="228" width="16" height="2092" class="act"/>

  <!-- GD_ChiaSeBenhAn -->
  <rect x="327" y="242" width="16" height="2066" class="act"/>
  <rect x="335" y="264" width="14" height="22" class="act"/>
  <rect x="335" y="660" width="14" height="22" class="act"/>
  <rect x="335" y="998" width="14" height="22" class="act"/>
  <rect x="335" y="1142" width="14" height="22" class="act"/>

  <!-- CTR_ConsentService -->
  <rect x="607" y="360" width="16" height="278" class="act"/>
  <rect x="607" y="1352" width="16" height="656" class="act"/>

  <!-- E_patient_profiles -->
  <rect x="862" y="396" width="16" height="44" class="act"/>

  <!-- E_medical_encounters -->
  <rect x="1082" y="482" width="16" height="44" class="act"/>
  <rect x="1082" y="1390" width="16" height="44" class="act"/>

  <!-- E_patient_consents -->
  <rect x="1297" y="1526" width="16" height="44" class="act"/>
  <rect x="1297" y="1668" width="16" height="44" class="act"/>

  <!-- Cơ sở y tế tiếp nhận -->
  <rect x="1472" y="1828" width="16" height="42" class="act"/>

  <!-- ================= PHASE 1: MỞ MỤC CHIA SẺ & TẢI BỆNH ÁN KHẢ DỤNG (Steps 1-5, Alt 4.1, 4.2) ================= -->
  <line x1="98" y1="244" x2="327" y2="244" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="110" y="235" class="msg">1: Mở xác nhận đặt khám / chi tiết lịch hẹn</text>

  <path d="M 343 260 L 386 260 L 386 282 L 349 282" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="396" y="277" class="msg">1.1: showShareRecordsPanel(patientProfileId, targetHospitalId)</text>

  <line x1="98" y1="322" x2="327" y2="322" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="110" y="313" class="msg">2: Bật công tắc "Chia sẻ hồ sơ bệnh án cũ"</text>

  <line x1="343" y1="362" x2="607" y2="362" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="356" y="353" class="msg">2.1: getShareableRecords(userId, patientProfileId, targetHospitalId)</text>

  <line x1="623" y1="398" x2="862" y2="398" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="636" y="389" class="msg">2.2: assertProfileOwner(userId, patientProfileId)</text>

  <line x1="862" y1="440" x2="623" y2="440" class="ret" marker-end="url(#openArrow)"/>
  <text x="710" y="431" class="msg">2.3: patientProfile</text>

  <line x1="623" y1="484" x2="1082" y2="484" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="636" y="475" class="msg">2.4: findMany({ patientProfileId, hospitalId: { not: targetHospitalId }, status: "PUBLISHED" })</text>

  <line x1="1082" y1="526" x2="623" y2="526" class="ret" marker-end="url(#openArrow)"/>
  <text x="790" y="517" class="msg">2.5: shareableEncounters[]</text>

  <!-- ALT 1: Kết quả tải bệnh án khả dụng (Alt 4.1, 4.2) -->
  <rect x="28" y="546" width="1504" height="330" class="frag-box"/>
  <polygon points="28,546 90,546 90,570 76,582 28,582" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="45" y="570" class="frag-tag">alt</text>
  <text x="112" y="571" class="guard">[tải thành công &amp;&amp; shareableEncounters.length &gt; 0]</text>

  <line x1="607" y1="620" x2="343" y2="620" class="ret" marker-end="url(#openArrow)"/>
  <text x="356" y="611" class="msg">2.6: { data: shareableEncounters }</text>

  <path d="M 343 654 L 386 654 L 386 676 L 349 676" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="396" y="671" class="msg">2.7: selectDefaults(allEncounters, 4 allowedSections, duration = 7 ngày)</text>

  <line x1="28" y1="704" x2="1532" y2="704" class="frag-div"/>
  <text x="112" y="728" class="guard">[không có bệnh án đã công bố tại cơ sở khác (Alt 4.1)]</text>

  <line x1="327" y1="766" x2="98" y2="766" class="ret" marker-end="url(#openArrow)"/>
  <text x="110" y="757" class="msg">2.8: Thông báo chưa có bệnh án điện tử khả dụng (tắt chia sẻ / kết thúc)</text>

  <line x1="28" y1="790" x2="1532" y2="790" class="frag-div"/>
  <text x="112" y="814" class="guard">[không tải được danh sách bệnh án (Alt 4.2)]</text>

  <line x1="327" y1="854" x2="98" y2="854" class="ret" marker-end="url(#openArrow)"/>
  <text x="110" y="845" class="msg">2.9: Hiển thị thông báo lỗi tải bệnh án (bật lại công tắc quay lại bước 4)</text>

  <!-- ================= PHASE 2: TÙY CHỈNH PHẠM VI (Alt 5.1) ================= -->
  <rect x="28" y="900" width="1504" height="332" class="frag-box"/>
  <polygon points="28,900 90,900 90,924 76,936 28,936" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="45" y="924" class="frag-tag">opt</text>
  <text x="112" y="925" class="guard">[bệnh nhân chọn "Tùy chỉnh danh sách hồ sơ &amp; phạm vi" (Alt 5.1)]</text>

  <line x1="98" y1="974" x2="327" y2="974" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="110" y="965" class="msg">3: Nhấn "Tùy chỉnh danh sách hồ sơ &amp; phạm vi"</text>

  <path d="M 343 992 L 386 992 L 386 1014 L 349 1014" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="396" y="1009" class="msg">3.1: showConsentConfigModal()</text>

  <line x1="98" y1="1062" x2="327" y2="1062" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="110" y="1053" class="msg">3.2: Chọn encounterIds, allowedSections, thời hạn 1–365 ngày &amp; đồng ý điều khoản</text>

  <path d="M 343 1136 L 386 1136 L 386 1158 L 349 1158" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="396" y="1153" class="msg">3.3: validateConfig(encounterIds &gt;= 1, allowedSections &gt;= 1, days ∈ [1..365], agreed)</text>

  <line x1="98" y1="1208" x2="327" y2="1208" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="110" y="1199" class="msg">3.4: Nhấn "Xác nhận &amp; Cấp quyền chia sẻ"</text>

  <!-- ================= PHASE 3: NHÓM THEO CƠ SỞ NGUỒN, TẠO & CẤP QUYỀN (Steps 6-7, Alt 6.1, 6.2) ================= -->
  <rect x="28" y="1256" width="1504" height="1068" class="frag-box"/>
  <polygon points="28,1256 96,1256 96,1280 82,1292 28,1292" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="43" y="1280" class="frag-tag">loop</text>
  <text x="114" y="1281" class="guard">[với mỗi sourceHospitalId sau khi nhóm bệnh án theo cơ sở nguồn]</text>

  <line x1="343" y1="1348" x2="607" y2="1348" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="356" y="1339" class="msg">4: createConsent(userId, CreateConsentDto)</text>

  <line x1="623" y1="1392" x2="1082" y2="1392" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="636" y="1383" class="msg">4.1: findMany({ id: { in: encounterIds }, patientProfileId, hospitalId: sourceHospitalId, status: "PUBLISHED" })</text>

  <line x1="1082" y1="1434" x2="623" y2="1434" class="ret" marker-end="url(#openArrow)"/>
  <text x="800" y="1425" class="msg">4.2: selectedEncounters[]</text>

  <!-- ALT 2: Kiểm tra bệnh án hợp lệ (Alt 6.1) -->
  <rect x="44" y="1456" width="1472" height="848" class="frag-box"/>
  <polygon points="44,1456 106,1456 106,1478 92,1490 44,1490" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="61" y="1479" class="frag-tag">alt</text>
  <text x="118" y="1480" class="guard">[selectedEncounters.length == encounterIds.length &amp;&amp; expiresAt &gt;= appointmentDate]</text>

  <line x1="623" y1="1528" x2="1297" y2="1528" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="636" y="1519" class="msg">4.3: create/update({ status: "PENDING", scope: { encounterIds, allowedSections }, expiresAt })</text>

  <line x1="1297" y1="1570" x2="623" y2="1570" class="ret" marker-end="url(#openArrow)"/>
  <text x="900" y="1561" class="msg">4.4: consent { id, status: "PENDING" }</text>

  <line x1="343" y1="1624" x2="607" y2="1624" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="356" y="1615" class="msg">4.5: grantConsent(userId, consent.id)</text>

  <line x1="623" y1="1670" x2="1297" y2="1670" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="636" y="1661" class="msg">4.6: update({ id: consent.id, status: "GRANTED", grantedAt, confirmedAt })</text>

  <line x1="1297" y1="1712" x2="623" y2="1712" class="ret" marker-end="url(#openArrow)"/>
  <text x="880" y="1703" class="msg">4.7: grantedConsent { status: "GRANTED", expiresAt }</text>

  <!-- ALT 2.1: Kết quả tạo & cấp quyền (Alt 6.2) -->
  <rect x="60" y="1736" width="1440" height="398" class="frag-box"/>
  <polygon points="60,1736 122,1736 122,1758 108,1770 60,1770" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="77" y="1759" class="frag-tag">alt</text>
  <text x="134" y="1760" class="guard">[tạo và xác nhận cấp quyền thành công]</text>

  <line x1="623" y1="1830" x2="1472" y2="1830" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="636" y="1821" class="msg">4.8: Cấp quyền truy xuất hồ sơ liên thông (status: "GRANTED", scope, expiresAt)</text>

  <line x1="1472" y1="1870" x2="623" y2="1870" class="ret" marker-end="url(#openArrow)"/>
  <text x="980" y="1861" class="msg">4.9: Đã ghi nhận quyền xem bệnh án</text>

  <line x1="607" y1="1926" x2="343" y2="1926" class="ret" marker-end="url(#openArrow)"/>
  <text x="356" y="1917" class="msg">4.10: { status: "GRANTED", expiresAt }</text>

  <line x1="327" y1="1980" x2="98" y2="1980" class="ret" marker-end="url(#openArrow)"/>
  <text x="110" y="1971" class="msg">4.11: Thông báo cấp quyền thành công (bảo đảm thời hạn không kết thúc trước ngày hẹn)</text>

  <line x1="60" y1="2008" x2="1500" y2="2008" class="frag-div"/>
  <text x="134" y="2034" class="guard">[không tạo hoặc không xác nhận được quyền chia sẻ (Alt 6.2)]</text>

  <line x1="327" y1="2092" x2="98" y2="2092" class="ret" marker-end="url(#openArrow)"/>
  <text x="110" y="2083" class="msg">4.12: Thông báo lỗi (cơ sở đã cấp trước đó vẫn được ghi nhận) → nhấn xác nhận lại (bước 6)</text>

  <!-- ELSE của ALT 2: Bệnh án không hợp lệ (Alt 6.1) -->
  <line x1="44" y1="2156" x2="1516" y2="2156" class="frag-div"/>
  <text x="118" y="2182" class="guard">[bệnh án không thuộc hồ sơ, không thuộc cơ sở nguồn hoặc chưa công bố (Alt 6.1)]</text>

  <line x1="607" y1="2224" x2="343" y2="2224" class="ret" marker-end="url(#openArrow)"/>
  <text x="356" y="2215" class="msg">4.13: BadRequestException("Hồ sơ không thuộc cơ sở nguồn hoặc chưa được công bố")</text>

  <line x1="327" y1="2276" x2="98" y2="2276" class="ret" marker-end="url(#openArrow)"/>
  <text x="110" y="2267" class="msg">4.14: Từ chối tạo quyền &amp; báo lỗi (chọn lại bệnh án, quay lại bước 5.1.2)</text>
</svg>
"""

svg_path = OUT_DIR / "seq_chia_se_benh_an.svg"
png_path = OUT_DIR / "seq_chia_se_benh_an.png"
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
    page = browser.new_page(viewport={"width": 1560, "height": 2380}, device_scale_factor=2)
    page.set_content(html)
    page.locator("svg").screenshot(path=str(png_path))
    browser.close()

print(f"Rendered: {svg_path}")
print(f"Rendered: {png_path}")
