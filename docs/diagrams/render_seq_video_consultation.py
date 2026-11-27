from pathlib import Path
from playwright.sync_api import sync_playwright

OUT_DIR = Path(r"d:\HTTT18B\KLTN\NovaCare\docs\diagrams")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Optimized for A4 Word reports: compact width (1580px) + LARGE 15px-16px bold typography
SVG = """<svg xmlns="http://www.w3.org/2000/svg" width="1580" height="2920" viewBox="0 0 1580 2920">
  <defs>
    <style>
      .lifeline-label { font-family: 'Segoe UI', Arial, sans-serif; font-size: 15.5px; font-weight: 800; fill: #0f172a; text-anchor: middle; }
      .lifeline-sub { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12.2px; font-weight: 600; fill: #334155; text-anchor: middle; }
      .msg { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14.8px; font-weight: 600; fill: #0f172a; paint-order: stroke; stroke: #FFFFFF; stroke-width: 7px; stroke-linejoin: round; }
      .guard { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14.8px; font-weight: 800; fill: #0f172a; paint-order: stroke; stroke: #FFFFFF; stroke-width: 7px; stroke-linejoin: round; }
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
  <rect x="0" y="0" width="1580" height="2920" fill="#FFFFFF"/>

  <!-- Frame -->
  <rect x="14" y="14" width="1552" height="2892" fill="none" stroke="#64748b" stroke-width="1.6"/>
  <polygon points="14,14 410,14 410,46 392,62 14,62" fill="#F1F5F9" stroke="#64748b" stroke-width="1.6"/>
  <text x="30" y="45" class="frag-tag" style="font-size:17px;">sd Tư vấn trực tuyến (NovaCare)</text>

  <!-- ================= LIFELINES (7) ================= -->
  <!-- X: Patient=90, GD_TuVanVideo=330, CTR_Consult=595, CTR_Video=860, E_sessions=1100, LiveKit=1315, Doctor=1495 -->

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
  <line x1="90" y1="204" x2="90" y2="2885" class="lifeline"/>

  <!-- 2. Boundary: GD_TuVanVideo -->
  <g transform="translate(330, 124)">
    <line x1="-28" y1="-19" x2="-28" y2="19" class="icon-stroke"/>
    <line x1="-28" y1="0" x2="-17" y2="0" class="icon-stroke"/>
    <circle cx="3" cy="0" r="20" class="icon-fill"/>
    <text x="0" y="48" class="lifeline-label">GD_TuVanVideo</text>
    <text x="0" y="66" class="lifeline-sub">&lt;&lt;boundary&gt;&gt;</text>
  </g>
  <line x1="330" y1="204" x2="330" y2="2885" class="lifeline"/>

  <!-- 3. Control: CTR_ConsultationsService -->
  <g transform="translate(595, 124)">
    <circle cx="0" cy="0" r="20" class="icon-fill"/>
    <path d="M -5,-26 L 5,-20 L -5,-14" fill="none" stroke="#0f172a" stroke-width="2"/>
    <text x="0" y="45" class="lifeline-label" style="font-size:14.5px;">CTR_Consultations</text>
    <text x="0" y="62" class="lifeline-label" style="font-size:14.5px;">Service</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;control&gt;&gt;</text>
  </g>
  <line x1="595" y1="204" x2="595" y2="2885" class="lifeline"/>

  <!-- 4. Control: CTR_ConsultationVideoService -->
  <g transform="translate(860, 124)">
    <circle cx="0" cy="0" r="20" class="icon-fill"/>
    <path d="M -5,-26 L 5,-20 L -5,-14" fill="none" stroke="#0f172a" stroke-width="2"/>
    <text x="0" y="45" class="lifeline-label" style="font-size:14.5px;">CTR_Consultation</text>
    <text x="0" y="62" class="lifeline-label" style="font-size:14.5px;">VideoService</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;control&gt;&gt;</text>
  </g>
  <line x1="860" y1="204" x2="860" y2="2885" class="lifeline"/>

  <!-- 5. Entity: E_consultation_sessions -->
  <g transform="translate(1100, 124)">
    <circle cx="0" cy="-2" r="20" class="icon-fill"/>
    <line x1="-22" y1="20" x2="22" y2="20" class="icon-stroke"/>
    <text x="0" y="45" class="lifeline-label" style="font-size:14.2px;">E_consultation_</text>
    <text x="0" y="62" class="lifeline-label" style="font-size:14.2px;">sessions</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="1100" y1="204" x2="1100" y2="2885" class="lifeline"/>

  <!-- 6. Secondary Actor: Hệ thống LiveKit -->
  <g transform="translate(1315, 112)">
    <circle cx="0" cy="-18" r="12" class="icon-fill"/>
    <line x1="0" y1="-6" x2="0" y2="20" class="icon-stroke"/>
    <line x1="-18" y1="3" x2="18" y2="3" class="icon-stroke"/>
    <line x1="0" y1="20" x2="-14" y2="38" class="icon-stroke"/>
    <line x1="0" y1="20" x2="14" y2="38" class="icon-stroke"/>
    <text x="0" y="57" class="lifeline-label" style="font-size:14.5px;">Hệ thống LiveKit</text>
    <text x="0" y="73" class="lifeline-sub">(RoomServiceClient)</text>
  </g>
  <line x1="1315" y1="204" x2="1315" y2="2885" class="lifeline"/>

  <!-- 7. Actor: Bác sĩ -->
  <g transform="translate(1495, 112)">
    <circle cx="0" cy="-18" r="12" class="icon-fill"/>
    <line x1="0" y1="-6" x2="0" y2="20" class="icon-stroke"/>
    <line x1="-18" y1="3" x2="18" y2="3" class="icon-stroke"/>
    <line x1="0" y1="20" x2="-14" y2="38" class="icon-stroke"/>
    <line x1="0" y1="20" x2="14" y2="38" class="icon-stroke"/>
    <text x="0" y="58" class="lifeline-label">Bác sĩ</text>
    <text x="0" y="75" class="lifeline-sub">(DOCTOR)</text>
  </g>
  <line x1="1495" y1="204" x2="1495" y2="2885" class="lifeline"/>

  <!-- ================= ACTIVATION BARS ================= -->
  <!-- Bệnh nhân -->
  <rect x="82" y="228" width="16" height="2624" class="act"/>

  <!-- GD_TuVanVideo -->
  <rect x="322" y="242" width="16" height="2600" class="act"/>
  <rect x="330" y="950" width="14" height="22" class="act"/>
  <rect x="330" y="2666" width="14" height="22" class="act"/>

  <!-- CTR_ConsultationsService -->
  <rect x="587" y="278" width="16" height="162" class="act"/>
  <rect x="587" y="622" width="16" height="166" class="act"/>
  <rect x="587" y="2496" width="16" height="84" class="act"/>

  <!-- CTR_ConsultationVideoService -->
  <rect x="852" y="1096" width="16" height="474" class="act"/>
  <rect x="860" y="1210" width="14" height="22" class="act"/>
  <rect x="852" y="2530" width="16" height="50" class="act"/>

  <!-- E_consultation_sessions -->
  <rect x="1092" y="314" width="16" height="42" class="act"/>
  <rect x="1092" y="656" width="16" height="42" class="act"/>
  <rect x="1092" y="1134" width="16" height="42" class="act"/>

  <!-- Hệ thống LiveKit -->
  <rect x="1307" y="1304" width="16" height="90" class="act"/>
  <rect x="1307" y="1772" width="16" height="812" class="act"/>

  <!-- Bác sĩ -->
  <rect x="1487" y="1912" width="16" height="624" class="act"/>

  <!-- ================= PHASE 1: DANH SÁCH & CHI TIẾT PHIÊN (Steps 1-4, Alt 2.1, 4.1) ================= -->
  <line x1="98" y1="244" x2="322" y2="244" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="110" y="235" class="msg">1: Chọn "Lịch gọi video"</text>

  <line x1="338" y1="280" x2="587" y2="280" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="350" y="271" class="msg">1.1: findAll(userId)</text>

  <line x1="603" y1="316" x2="1092" y2="316" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="616" y="307" class="msg">1.2: findMany({ where: { patientProfile.userId: userId } })</text>

  <line x1="1092" y1="356" x2="603" y2="356" class="ret" marker-end="url(#openArrow)"/>
  <text x="800" y="347" class="msg">1.3: consultationSessions[]</text>

  <!-- ALT 1: Tải danh sách phiên (Alt 2.1) -->
  <rect x="28" y="374" width="1522" height="172" class="frag-box"/>
  <polygon points="28,374 90,374 90,398 76,410 28,410" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="45" y="398" class="frag-tag">alt</text>
  <text x="110" y="399" class="guard">[tải danh sách phiên tư vấn thành công]</text>

  <line x1="587" y1="436" x2="338" y2="436" class="ret" marker-end="url(#openArrow)"/>
  <text x="350" y="427" class="msg">1.4: Hiển thị danh sách phiên tư vấn video</text>

  <line x1="28" y1="464" x2="1550" y2="464" class="frag-div"/>
  <text x="110" y="488" class="guard">[không tải được danh sách phiên tư vấn (Alt 2.1)]</text>

  <line x1="322" y1="526" x2="98" y2="526" class="ret" marker-end="url(#openArrow)"/>
  <text x="110" y="517" class="msg">1.5: Báo lỗi &amp; nút "Thử lại" (quay lại bước 2)</text>

  <!-- Step 3-4: Chọn phiên & chi tiết -->
  <line x1="98" y1="588" x2="322" y2="588" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="110" y="579" class="msg">2: Chọn phiên tư vấn (id)</text>

  <line x1="338" y1="624" x2="587" y2="624" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="350" y="615" class="msg">2.1: findOne(id, userId) &amp; listMessages(id)</text>

  <line x1="603" y1="658" x2="1092" y2="658" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="616" y="649" class="msg">2.2: findUnique({ id, include: { appointment, messages } })</text>

  <line x1="1092" y1="698" x2="603" y2="698" class="ret" marker-end="url(#openArrow)"/>
  <text x="790" y="689" class="msg">2.3: session, messages[]</text>

  <!-- ALT 2: Trạng thái phiên (Alt 4.1) -->
  <rect x="28" y="716" width="1522" height="168" class="frag-box"/>
  <polygon points="28,716 90,716 90,740 76,752 28,752" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="45" y="740" class="frag-tag">alt</text>
  <text x="110" y="741" class="guard">[session.status ∈ { "ACCEPTED", "ACTIVE" }]</text>

  <line x1="587" y1="778" x2="338" y2="778" class="ret" marker-end="url(#openArrow)"/>
  <text x="350" y="769" class="msg">2.4: Hiển thị chi tiết phiên, nội dung trò chuyện &amp; nút "Tham gia video"</text>

  <line x1="28" y1="802" x2="1550" y2="802" class="frag-div"/>
  <text x="110" y="826" class="guard">[chưa tiếp nhận / đã hoàn thành / bị hủy / hết hạn (Alt 4.1)]</text>

  <line x1="322" y1="864" x2="98" y2="864" class="ret" marker-end="url(#openArrow)"/>
  <text x="110" y="855" class="msg">2.5: Ẩn nút "Tham gia video" hoặc từ chối mở phòng (quay lại bước 3)</text>

  <!-- ================= PHASE 2: QUYỀN CAMERA/MIC, XÁC THỰC & TẠO PHÒNG LIVEKIT (Steps 5-11, Alt 7.1, 8.1-8.3, 9.1, 10.1, 11.1) ================= -->
  <line x1="98" y1="928" x2="322" y2="928" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="110" y="919" class="msg">3: Nhấn "Tham gia video"</text>

  <path d="M 338 944 L 382 944 L 382 966 L 344 966" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="392" y="961" class="msg">3.1: checkCameraAndMicPermissions()</text>

  <line x1="98" y1="1008" x2="322" y2="1008" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="110" y="999" class="msg">4: Cấp quyền camera &amp; micro (nếu từ chối → báo vào Cài đặt - Alt 7.1)</text>

  <!-- ALT 3: Kiểm tra quyền thiết bị (Alt 7.1) & gọi join() -->
  <line x1="338" y1="1098" x2="852" y2="1098" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="350" y="1089" class="msg">4.1: join(id, userId)</text>

  <line x1="868" y1="1136" x2="1092" y2="1136" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="880" y="1127" class="msg">4.2: authorize(id, userId)</text>

  <line x1="1092" y1="1176" x2="868" y2="1176" class="ret" marker-end="url(#openArrow)"/>
  <text x="900" y="1167" class="msg">4.3: session, appointment</text>

  <path d="M 868 1204 L 912 1204 L 912 1226 L 874 1226" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="922" y="1221" class="msg">4.4: requireConfigured() &amp; checkRole/Schedule/AppointmentStatus</text>

  <!-- ALT 4: Kết quả authorize() & LiveKit createRoom (Alt 8.1-8.3, 9.1, 10.1) -->
  <rect x="28" y="1248" width="1522" height="476" class="frag-box"/>
  <polygon points="28,1248 90,1248 90,1272 76,1284 28,1284" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="45" y="1272" class="frag-tag">alt</text>
  <text x="110" y="1273" class="guard">[hợp lệ: đúng user, ACCEPTED/ACTIVE, appointment CONFIRMED/PAID, đúng giờ &amp; LiveKit sẵn sàng]</text>

  <line x1="868" y1="1306" x2="1307" y2="1306" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="880" y="1297" class="msg">4.5: createRoom({ name: "novacare-consultation-" + id, maxParticipants: 2 })</text>

  <!-- ALT 4.1: LiveKit phản hồi (Alt 10.1) -->
  <rect x="44" y="1324" width="1490" height="226" class="frag-box"/>
  <polygon points="44,1324 106,1324 106,1346 92,1358 44,1358" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="61" y="1347" class="frag-tag">alt</text>
  <text x="118" y="1348" class="guard">[tạo/mở phòng thành công &amp;&amp; cấp AccessToken]</text>

  <line x1="1307" y1="1392" x2="868" y2="1392" class="ret" marker-end="url(#openArrow)"/>
  <text x="990" y="1383" class="msg">4.6: roomCreated, AccessToken(jwt)</text>

  <line x1="852" y1="1434" x2="338" y2="1434" class="ret" marker-end="url(#openArrow)"/>
  <text x="350" y="1425" class="msg">4.7: { serverUrl, participantToken, roomName, endsAt }</text>

  <line x1="44" y1="1462" x2="1534" y2="1462" class="frag-div"/>
  <text x="118" y="1486" class="guard">[không thể tạo phòng hoặc cấp token (Alt 10.1)]</text>

  <line x1="322" y1="1526" x2="98" y2="1526" class="ret" marker-end="url(#openArrow)"/>
  <text x="110" y="1517" class="msg">4.8: Thông báo không thể kết nối dịch vụ video + "Thử lại" (quay lại bước 5)</text>

  <!-- ELSE của ALT 4: Các lỗi kiểm tra (Alt 8.1, 8.2, 8.3, 9.1) -->
  <line x1="28" y1="1572" x2="1550" y2="1572" class="frag-div"/>
  <text x="110" y="1596" class="guard">[không có quyền (8.1) | sai giờ/trạng thái phiên (8.2) | lịch chưa xác nhận/thanh toán (8.3) | chưa cấu hình video (9.1)]</text>

  <line x1="852" y1="1636" x2="338" y2="1636" class="ret" marker-end="url(#openArrow)"/>
  <text x="350" y="1627" class="msg">4.9: ForbiddenException (8.1) / BadRequestException (8.2, 8.3) / ServiceUnavailableException (9.1)</text>

  <line x1="322" y1="1690" x2="98" y2="1690" class="ret" marker-end="url(#openArrow)"/>
  <text x="110" y="1681" class="msg">4.10: Hiển thị thông báo từ chối tương ứng (8.1: kết thúc UC; 8.2/8.3/9.1: quay lại bước 3)</text>

  <!-- ================= PHASE 3: KẾT NỐI PHÒNG VIDEO & TRAO ĐỔI (Steps 11-15, Alt 11.1, 12.1, 14.1-14.3, 15.1) ================= -->
  <line x1="338" y1="1774" x2="1307" y2="1774" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="350" y="1765" class="msg">5: connect(serverUrl, participantToken) &amp; bật camera, micro (lỗi → báo kiểm tra thiết bị/mạng - Alt 11.1)</text>

  <line x1="1307" y1="1820" x2="338" y2="1820" class="ret" marker-end="url(#openArrow)"/>
  <text x="640" y="1811" class="msg">5.1: Connected (hiển thị giao diện cuộc gọi)</text>

  <line x1="1487" y1="1914" x2="1323" y2="1914" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="1335" y="1905" class="msg">6: Tham gia phòng video</text>

  <!-- ALT 5: Bác sĩ tham gia hay chưa (Alt 12.1) -->
  <rect x="28" y="1934" width="1522" height="170" class="frag-box"/>
  <polygon points="28,1934 90,1934 90,1958 76,1970 28,1970" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="45" y="1958" class="frag-tag">alt</text>
  <text x="110" y="1959" class="guard">[bác sĩ đã tham gia phòng video]</text>

  <line x1="1307" y1="1994" x2="338" y2="1994" class="ret" marker-end="url(#openArrow)"/>
  <text x="560" y="1985" class="msg">6.1: participant_joined → hiển thị hình ảnh bác sĩ &amp; khung hình bệnh nhân</text>

  <line x1="28" y1="2020" x2="1550" y2="2020" class="frag-div"/>
  <text x="110" y="2044" class="guard">[bác sĩ chưa tham gia phòng video (Alt 12.1)]</text>

  <line x1="322" y1="2082" x2="98" y2="2082" class="ret" marker-end="url(#openArrow)"/>
  <text x="110" y="2073" class="msg">6.2: Hiển thị trạng thái chờ bác sĩ (tiếp tục chờ hoặc kết thúc)</text>

  <!-- Trao đổi trực tuyến & các sự cố trong cuộc gọi (Steps 14-15, Alt 14.1-14.3) -->
  <line x1="98" y1="2152" x2="1307" y2="2152" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="110" y="2143" class="msg">7: Trao đổi video/audio (bật/tắt mic, camera, đổi camera, chọn loa, mở trò chuyện)</text>

  <line x1="1487" y1="2198" x2="1323" y2="2198" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="1335" y="2189" class="msg">7.1: Thực hiện tư vấn</text>

  <!-- OPT: Sự cố mạng / đưa ứng dụng xuống nền (Alt 14.1, 14.2, 14.3) -->
  <rect x="28" y="2224" width="1522" height="190" class="frag-box"/>
  <polygon points="28,2224 90,2224 90,2248 76,2260 28,2260" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="45" y="2248" class="frag-tag">opt</text>
  <text x="110" y="2249" class="guard">[sự cố kết nối mạng (Alt 14.1, 14.2) hoặc đưa ứng dụng xuống nền (Alt 14.3)]</text>

  <line x1="322" y1="2294" x2="98" y2="2294" class="ret" marker-end="url(#openArrow)"/>
  <text x="110" y="2285" class="msg">7.2: Hiển thị "Đang kết nối lại" (14.1) → nếu thất bại báo lỗi &amp; cho tham gia lại (14.2)</text>

  <line x1="28" y1="2322" x2="1550" y2="2322" class="frag-div"/>
  <text x="110" y="2346" class="guard">[đưa ứng dụng xuống nền trong khi gọi (Alt 14.3)]</text>

  <line x1="338" y1="2388" x2="1307" y2="2388" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="350" y="2379" class="msg">7.3: disconnect() tự động ngắt phòng (mở lại app quay lại bước 5 nếu phiên còn hiệu lực)</text>

  <!-- ================= PHASE 4: KẾT THÚC CUỘC GỌI / PHIÊN (Steps 16-19, Alt 15.1, 18.1) ================= -->
  <rect x="28" y="2440" width="1522" height="404" class="frag-box"/>
  <polygon points="28,2440 90,2440 90,2464 76,2476 28,2476" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="45" y="2464" class="frag-tag">alt</text>
  <text x="110" y="2465" class="guard">[bác sĩ kết thúc / hoàn thành phiên tư vấn (Alt 15.1)]</text>

  <line x1="1487" y1="2498" x2="603" y2="2498" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="1080" y="2489" class="msg">8: complete(id, doctorUserId)</text>

  <line x1="603" y1="2534" x2="852" y2="2534" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="616" y="2525" class="msg">8.1: close(id)</text>

  <line x1="868" y1="2568" x2="1307" y2="2568" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="880" y="2559" class="msg">8.2: deleteRoom(roomName) → đóng phòng &amp; báo phiên kết thúc</text>

  <line x1="28" y1="2594" x2="1550" y2="2594" class="frag-div"/>
  <text x="110" y="2618" class="guard">[bệnh nhân chọn kết thúc cuộc gọi (Steps 16-19)]</text>

  <line x1="98" y1="2656" x2="322" y2="2656" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="110" y="2647" class="msg">9: Chọn kết thúc cuộc gọi</text>

  <path d="M 338 2662 L 382 2662 L 382 2684 L 344 2684" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="392" y="2679" class="msg">9.1: showConfirmEndCallDialog()</text>

  <line x1="98" y1="2726" x2="322" y2="2726" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="110" y="2717" class="msg">10: Xác nhận kết thúc (nếu chọn tiếp tục → quay lại bước 14 - Alt 18.1)</text>

  <line x1="338" y1="2772" x2="1307" y2="2772" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="350" y="2763" class="msg">10.1: disconnect() (không tự động hoàn thành consultation_sessions)</text>

  <line x1="322" y1="2820" x2="98" y2="2820" class="ret" marker-end="url(#openArrow)"/>
  <text x="110" y="2811" class="msg">10.2: Quay lại màn hình chi tiết phiên tư vấn</text>
</svg>
"""

svg_path = OUT_DIR / "seq_tu_van_truc_tuyen.svg"
png_path = OUT_DIR / "seq_tu_van_truc_tuyen.png"
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
    page = browser.new_page(viewport={"width": 1580, "height": 2920}, device_scale_factor=2)
    page.set_content(html)
    page.locator("svg").screenshot(path=str(png_path))
    browser.close()

print(f"Rendered: {svg_path}")
print(f"Rendered: {png_path}")
