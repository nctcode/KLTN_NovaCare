from pathlib import Path
from playwright.sync_api import sync_playwright

OUT_DIR = Path(r"d:\HTTT18B\KLTN\NovaCare\docs\diagrams")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Optimized for A4 Word reports: compact width (1580px) + LARGE 15px-16.5px bold typography
SVG = """<svg xmlns="http://www.w3.org/2000/svg" width="1580" height="2740" viewBox="0 0 1580 2740">
  <defs>
    <style>
      .lifeline-label { font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; font-weight: 800; fill: #0f172a; text-anchor: middle; }
      .lifeline-sub { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12.5px; font-weight: 600; fill: #334155; text-anchor: middle; }
      .msg { font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 600; fill: #0f172a; paint-order: stroke; stroke: #FFFFFF; stroke-width: 7px; stroke-linejoin: round; }
      .guard { font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 800; fill: #0f172a; paint-order: stroke; stroke: #FFFFFF; stroke-width: 7px; stroke-linejoin: round; }
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
  <rect x="0" y="0" width="1580" height="2740" fill="#FFFFFF"/>

  <!-- Frame -->
  <rect x="14" y="14" width="1552" height="2712" fill="none" stroke="#64748b" stroke-width="1.6"/>
  <polygon points="14,14 430,14 430,46 412,62 14,62" fill="#F1F5F9" stroke="#64748b" stroke-width="1.6"/>
  <text x="30" y="45" class="frag-tag" style="font-size:17px;">sd Sàng lọc triệu chứng AI (NovaCare)</text>

  <!-- ================= LIFELINES ================= -->
  <!-- X: Actor=95, GD_SangLocAI=340, CTR_PreExamV2Service=620, CTR_AiOrchestrator=880, E_hospitals=1095, E_pre_exam_sessions=1290, AI=1480 -->

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
  <line x1="95" y1="204" x2="95" y2="2705" class="lifeline"/>

  <!-- 2. Boundary: GD_SangLocAI -->
  <g transform="translate(340, 124)">
    <line x1="-30" y1="-19" x2="-30" y2="19" class="icon-stroke"/>
    <line x1="-30" y1="0" x2="-18" y2="0" class="icon-stroke"/>
    <circle cx="3" cy="0" r="21" class="icon-fill"/>
    <text x="0" y="48" class="lifeline-label">GD_SangLocAI</text>
    <text x="0" y="66" class="lifeline-sub">&lt;&lt;boundary&gt;&gt;</text>
  </g>
  <line x1="340" y1="204" x2="340" y2="2705" class="lifeline"/>

  <!-- 3. Control: CTR_PreExamV2Service -->
  <g transform="translate(620, 124)">
    <circle cx="0" cy="0" r="21" class="icon-fill"/>
    <path d="M -5,-27 L 5,-21 L -5,-15" fill="none" stroke="#0f172a" stroke-width="2"/>
    <text x="0" y="45" class="lifeline-label" style="font-size:15px;">CTR_PreExamV2</text>
    <text x="0" y="62" class="lifeline-label" style="font-size:15px;">Service</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;control&gt;&gt;</text>
  </g>
  <line x1="620" y1="204" x2="620" y2="2705" class="lifeline"/>

  <!-- 4. Control: CTR_AiScreeningOrchestrator -->
  <g transform="translate(880, 124)">
    <circle cx="0" cy="0" r="21" class="icon-fill"/>
    <path d="M -5,-27 L 5,-21 L -5,-15" fill="none" stroke="#0f172a" stroke-width="2"/>
    <text x="0" y="45" class="lifeline-label" style="font-size:14.5px;">CTR_AiScreening</text>
    <text x="0" y="62" class="lifeline-label" style="font-size:14.5px;">Orchestrator</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;control&gt;&gt;</text>
  </g>
  <line x1="880" y1="204" x2="880" y2="2705" class="lifeline"/>

  <!-- 5. Entity: E_hospitals -->
  <g transform="translate(1095, 124)">
    <circle cx="0" cy="-2" r="21" class="icon-fill"/>
    <line x1="-23" y1="21" x2="23" y2="21" class="icon-stroke"/>
    <text x="0" y="48" class="lifeline-label">E_hospitals</text>
    <text x="0" y="66" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="1095" y1="204" x2="1095" y2="2705" class="lifeline"/>

  <!-- 6. Entity: E_pre_exam_sessions -->
  <g transform="translate(1290, 124)">
    <circle cx="0" cy="-2" r="21" class="icon-fill"/>
    <line x1="-23" y1="21" x2="23" y2="21" class="icon-stroke"/>
    <text x="0" y="45" class="lifeline-label" style="font-size:14.5px;">E_pre_exam_</text>
    <text x="0" y="62" class="lifeline-label" style="font-size:14.5px;">sessions</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="1290" y1="204" x2="1290" y2="2705" class="lifeline"/>

  <!-- 7. Secondary Actor: Dịch vụ AI -->
  <g transform="translate(1480, 112)">
    <circle cx="0" cy="-18" r="12" class="icon-fill"/>
    <line x1="0" y1="-6" x2="0" y2="20" class="icon-stroke"/>
    <line x1="-18" y1="3" x2="18" y2="3" class="icon-stroke"/>
    <line x1="0" y1="20" x2="-14" y2="38" class="icon-stroke"/>
    <line x1="0" y1="20" x2="14" y2="38" class="icon-stroke"/>
    <text x="0" y="57" class="lifeline-label" style="font-size:15.5px;">Dịch vụ AI</text>
    <text x="0" y="73" class="lifeline-sub">(ScreeningLLM</text>
    <text x="0" y="87" class="lifeline-sub">Service)</text>
  </g>
  <line x1="1480" y1="204" x2="1480" y2="2705" class="lifeline"/>

  <!-- ================= ACTIVATION BARS ================= -->
  <!-- Actor -->
  <rect x="87" y="228" width="16" height="2450" class="act"/>

  <!-- GD_SangLocAI -->
  <rect x="332" y="242" width="16" height="2428" class="act"/>
  <rect x="340" y="456" width="14" height="22" class="act"/>
  <rect x="340" y="622" width="14" height="22" class="act"/>
  <rect x="340" y="718" width="14" height="22" class="act"/>
  <rect x="340" y="902" width="14" height="22" class="act"/>
  <rect x="340" y="1024" width="14" height="22" class="act"/>
  <rect x="340" y="1384" width="14" height="22" class="act"/>
  <rect x="340" y="1478" width="14" height="22" class="act"/>

  <!-- CTR_PreExamV2Service -->
  <rect x="612" y="278" width="16" height="162" class="act"/>
  <rect x="612" y="1100" width="16" height="176" class="act"/>
  <rect x="620" y="1238" width="14" height="22" class="act"/>
  <rect x="612" y="1590" width="16" height="190" class="act"/>
  <rect x="612" y="1892" width="16" height="360" class="act"/>

  <!-- CTR_AiScreeningOrchestrator -->
  <rect x="872" y="1932" width="16" height="170" class="act"/>
  <rect x="880" y="1968" width="14" height="22" class="act"/>

  <!-- E_hospitals -->
  <rect x="1087" y="314" width="16" height="44" class="act"/>
  <rect x="1087" y="2018" width="16" height="42" class="act"/>

  <!-- E_pre_exam_sessions -->
  <rect x="1282" y="2164" width="16" height="44" class="act"/>

  <!-- Dịch vụ AI -->
  <rect x="1472" y="1132" width="16" height="58" class="act"/>
  <rect x="1472" y="1624" width="16" height="62" class="act"/>

  <!-- ================= PHASE 1: KHỞI TẠO & BƯỚC 1 ================= -->
  <line x1="103" y1="244" x2="332" y2="244" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="114" y="235" class="msg">1: Chọn "Sàng lọc AI"</text>

  <line x1="348" y1="280" x2="612" y2="280" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="360" y="271" class="msg">1.1: getScreeningCatalog() &amp; getHospitals()</text>

  <line x1="628" y1="316" x2="1087" y2="316" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="640" y="307" class="msg">1.2: findMany({ isActive: true, include: specialties })</text>

  <line x1="1087" y1="358" x2="628" y2="358" class="ret" marker-end="url(#openArrow)"/>
  <text x="770" y="349" class="msg">1.3: hospitals, specialties</text>

  <!-- ALT 1: Mất kết nối tải danh mục (Alt 2.1) -->
  <rect x="28" y="376" width="1522" height="190" class="frag-box"/>
  <polygon points="28,376 92,376 92,400 78,412 28,412" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="46" y="400" class="frag-tag">alt</text>
  <text x="114" y="401" class="guard">[tải danh mục &amp; cơ sở y tế thành công]</text>

  <line x1="612" y1="436" x2="348" y2="436" class="ret" marker-end="url(#openArrow)"/>
  <text x="364" y="427" class="msg">1.4: { SCREENING_CATALOG, hospitals }</text>

  <path d="M 348 448 L 392 448 L 392 470 L 354 470" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="402" y="465" class="msg">1.5: showStep1(regions, age, symptoms)</text>

  <line x1="28" y1="490" x2="1550" y2="490" class="frag-div"/>
  <text x="114" y="514" class="guard">[mất kết nối / lỗi tải danh mục (Alt 2.1)]</text>

  <line x1="332" y1="552" x2="103" y2="552" class="ret" marker-end="url(#openArrow)"/>
  <text x="114" y="543" class="msg">1.6: Báo lỗi kết nối + "Thử lại" (quay lại bước 1)</text>

  <!-- Step 3: Chọn vùng cơ thể, tuổi -->
  <line x1="103" y1="600" x2="332" y2="600" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="114" y="591" class="msg">2: Chọn regions, nhập age, nhấn "Tiếp tục"</text>

  <path d="M 348 614 L 392 614 L 392 636 L 354 636" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="402" y="631" class="msg">2.1: validateStep1(regions, age)</text>

  <!-- ALT 2: Kiểm tra vùng cơ thể & tuổi (Alt 2.2) -->
  <rect x="28" y="656" width="1522" height="174" class="frag-box"/>
  <polygon points="28,656 92,656 92,680 78,692 28,692" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="46" y="680" class="frag-tag">alt</text>
  <text x="114" y="681" class="guard">[regions.length &gt; 0 &amp;&amp; age ∈ [0..120]]</text>

  <path d="M 348 710 L 392 710 L 392 732 L 354 732" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="402" y="727" class="msg">2.2: loadQuestions(regions) &amp; showStep2(painLevel, duration)</text>

  <line x1="28" y1="754" x2="1550" y2="754" class="frag-div"/>
  <text x="114" y="778" class="guard">[chưa chọn vùng hoặc age ngoài 0–120 (Alt 2.2)]</text>

  <line x1="332" y1="816" x2="103" y2="816" class="ret" marker-end="url(#openArrow)"/>
  <text x="114" y="807" class="msg">2.3: Báo lỗi yêu cầu bổ sung (tiếp tục bước 3)</text>

  <!-- ================= PHASE 2: BƯỚC 2 (TRẮC NGHIỆM) & BƯỚC 3 (ẢNH) ================= -->
  <line x1="103" y1="870" x2="332" y2="870" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="114" y="861" class="msg">3: Trả lời trắc nghiệm, chọn painLevel, nhấn "Tiếp tục"</text>

  <path d="M 348 894 L 392 894 L 392 916 L 354 916" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="402" y="911" class="msg">3.1: showStep3_Images(max=3, mediaConsent)</text>

  <line x1="103" y1="960" x2="332" y2="960" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="114" y="951" class="msg">4: Tải ảnh (hoặc "Bỏ qua"), xác nhận consent, "Tiếp tục"</text>

  <!-- OPT 1: Có tải ảnh tổn thương -->
  <rect x="28" y="980" width="1522" height="384" class="frag-box"/>
  <polygon points="28,980 92,980 92,1004 78,1016 28,1016" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="46" y="1004" class="frag-tag">opt</text>
  <text x="114" y="1005" class="guard">[bệnh nhân có tải ảnh tổn thương]</text>

  <path d="M 348 1018 L 392 1018 L 392 1040 L 354 1040" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="402" y="1035" class="msg">4.1: validateImages(size &lt;= 5MB, JPEG/PNG/WebP)</text>

  <!-- ALT 3: Kiểm tra tệp ảnh (Alt 6.1) -->
  <rect x="44" y="1054" width="1490" height="296" class="frag-box"/>
  <polygon points="44,1054 106,1054 106,1076 92,1088 44,1088" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="61" y="1077" class="frag-tag">alt</text>
  <text x="118" y="1078" class="guard">[tệp ảnh hợp lệ]</text>

  <line x1="348" y1="1102" x2="612" y2="1102" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="360" y="1094" class="msg">4.2: submitImages(imageFiles, mediaConsent)</text>

  <line x1="628" y1="1134" x2="1472" y2="1134" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="640" y="1126" class="msg">4.3: inspectImage(imageFiles)</text>

  <!-- ALT 3.1: Kết quả Vision AI (Alt 9.1) -->
  <rect x="580" y="1148" width="938" height="122" class="frag-box"/>
  <polygon points="580,1148 636,1148 636,1168 624,1178 580,1178" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.5"/>
  <text x="595" y="1168" class="frag-tag" style="font-size:14.5px;">alt</text>
  <text x="646" y="1169" class="guard" style="font-size:14px;">[phân tích ảnh thành công]</text>

  <line x1="1472" y1="1192" x2="628" y2="1192" class="ret" marker-end="url(#openArrow)"/>
  <text x="920" y="1184" class="msg">4.4: imageAssessments, imageAnalysisFindings</text>

  <line x1="580" y1="1206" x2="1518" y2="1206" class="frag-div"/>
  <text x="646" y="1225" class="guard" style="font-size:14px;">[lỗi phân tích ảnh (Alt 9.1)]</text>
  <path d="M 628 1236 L 668 1236 L 668 1256 L 634 1256" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="678" y="1252" class="msg" style="font-size:14.5px;">4.5: markImageUnprocessed() (giữ dữ liệu &amp; tiếp tục)</text>

  <line x1="44" y1="1282" x2="1534" y2="1282" class="frag-div"/>
  <text x="118" y="1305" class="guard">[ảnh &gt; 5MB hoặc sai định dạng (Alt 6.1)]</text>
  <line x1="332" y1="1338" x2="103" y2="1338" class="ret" marker-end="url(#openArrow)"/>
  <text x="114" y="1329" class="msg">4.6: Báo lỗi tệp ảnh (chọn lại hoặc bỏ qua)</text>

  <!-- ================= PHASE 3: BƯỚC 4 (PPG) & BƯỚC 5 (GIỌNG NÓI) ================= -->
  <path d="M 348 1378 L 392 1378 L 392 1400 L 354 1400" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="402" y="1395" class="msg">5: showStep4_PpgHeartRate()</text>

  <line x1="103" y1="1436" x2="332" y2="1436" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="114" y="1427" class="msg">6: Đo nhịp tim PPG (hoặc "Bỏ qua"), nhấn "Tiếp tục"</text>

  <path d="M 348 1470 L 392 1470 L 392 1492 L 354 1492" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="402" y="1487" class="msg">6.1: showStep5_VoiceSymptom()</text>

  <line x1="103" y1="1528" x2="332" y2="1528" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="114" y="1519" class="msg">7: Ghi âm lời kể triệu chứng &amp; gửi (hoặc bỏ qua)</text>

  <!-- OPT 2: Ghi âm giọng nói (Alt 15.1) -->
  <rect x="28" y="1546" width="1522" height="270" class="frag-box"/>
  <polygon points="28,1546 92,1546 92,1570 78,1582 28,1582" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="46" y="1570" class="frag-tag">opt</text>
  <text x="114" y="1571" class="guard">[có tệp âm thanh &amp;&amp; consent == "true"]</text>

  <line x1="348" y1="1592" x2="612" y2="1592" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="360" y="1584" class="msg">7.1: transcribe(file, { consent: "true" })</text>

  <line x1="628" y1="1626" x2="1472" y2="1626" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="640" y="1618" class="msg">7.2: ScreeningLLMService.transcribe(file)</text>

  <!-- ALT 4: Kết quả STT (Alt 15.1) -->
  <rect x="44" y="1642" width="1490" height="162" class="frag-box"/>
  <polygon points="44,1642 106,1642 106,1664 92,1676 44,1676" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="61" y="1665" class="frag-tag">alt</text>
  <text x="118" y="1666" class="guard">[nhận diện giọng nói thành công]</text>

  <line x1="1472" y1="1688" x2="628" y2="1688" class="ret" marker-end="url(#openArrow)"/>
  <text x="900" y="1680" class="msg">7.3: { transcript, status: "NEEDS_CONFIRMATION" }</text>

  <line x1="612" y1="1718" x2="348" y2="1718" class="ret" marker-end="url(#openArrow)"/>
  <text x="360" y="1710" class="msg">7.4: showTranscriptForEdit(transcript)</text>

  <line x1="44" y1="1732" x2="1534" y2="1732" class="frag-div"/>
  <text x="118" y="1756" class="guard">[lỗi nhận diện giọng nói (Alt 15.1)]</text>
  <line x1="332" y1="1792" x2="103" y2="1792" class="ret" marker-end="url(#openArrow)"/>
  <text x="114" y="1783" class="msg">7.5: Báo lỗi STT, cho phép nhập thủ công / ghi âm lại</text>

  <!-- ================= PHASE 4: PHÂN TÍCH ĐA PHƯƠNG THỨC, RED FLAG & LƯU PHIÊN ================= -->
  <line x1="103" y1="1858" x2="332" y2="1858" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="114" y="1849" class="msg">8: Xác nhận transcript, nhấn "Phân tích và xem gợi ý"</text>

  <line x1="348" y1="1894" x2="612" y2="1894" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="360" y="1885" class="msg">8.1: analyzeSmartphoneInputs(userId, dto, files)</text>

  <line x1="628" y1="1934" x2="872" y2="1934" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="640" y="1925" class="msg">8.2: orchestrateScreening(sessionId, input)</text>

  <path d="M 888 1962 L 932 1962 L 932 1984 L 894 1984" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="942" y="1978" class="msg">8.3: RedFlagEngineService.evaluate(facts, ppg, transcript)</text>

  <line x1="888" y1="2020" x2="1087" y2="2020" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="900" y="2011" class="msg">8.4: findMany({ specialties, isActive: true })</text>

  <line x1="1087" y1="2060" x2="888" y2="2060" class="ret" marker-end="url(#openArrow)"/>
  <text x="902" y="2051" class="msg">8.5: matchedSpecialties, hospitals</text>

  <line x1="872" y1="2100" x2="628" y2="2100" class="ret" marker-end="url(#openArrow)"/>
  <text x="640" y="2091" class="msg">8.6: result { riskLevel, redFlags, nextAction, specialties }</text>

  <!-- ALT 5: Kết quả phân tích & Lưu phiên (Alt 18.1, Alt 18.2, Alt 20.1) -->
  <rect x="28" y="2118" width="1522" height="564" class="frag-box"/>
  <polygon points="28,2118 92,2118 92,2142 78,2154 28,2154" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="46" y="2142" class="frag-tag">alt</text>
  <text x="114" y="2143" class="guard">[phân tích thành công &amp;&amp; máy chủ ổn định]</text>

  <line x1="628" y1="2166" x2="1282" y2="2166" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="640" y="2158" class="msg">8.7: create({ id, userId, structuredData, recommendations, riskLevel, questions, media })</text>

  <line x1="1282" y1="2208" x2="628" y2="2208" class="ret" marker-end="url(#openArrow)"/>
  <text x="840" y="2199" class="msg">8.8: preExamSession { screeningSessionId }</text>

  <line x1="612" y1="2246" x2="348" y2="2246" class="ret" marker-end="url(#openArrow)"/>
  <text x="360" y="2237" class="msg">8.9: { ...result, screeningSessionId }</text>

  <!-- ALT 5.1: Red Flag Emergency vs Normal (Alt 18.1) -->
  <rect x="44" y="2264" width="1490" height="316" class="frag-box"/>
  <polygon points="44,2264 106,2264 106,2286 92,2298 44,2298" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="61" y="2287" class="frag-tag">alt</text>
  <text x="118" y="2288" class="guard">[riskLevel == "EMERGENCY" (phát hiện Red Flags - Alt 18.1)]</text>

  <line x1="332" y1="2328" x2="103" y2="2328" class="ret" marker-end="url(#openArrow)"/>
  <text x="114" y="2319" class="msg">8.10: Hiển thị cảnh báo đỏ khẩn cấp, khuyến cáo gọi cấp cứu 115</text>

  <line x1="44" y1="2348" x2="1534" y2="2348" class="frag-div"/>
  <text x="118" y="2371" class="guard">[không có dấu hiệu cấp cứu (LOW / MODERATE / HIGH)]</text>

  <line x1="332" y1="2404" x2="103" y2="2404" class="ret" marker-end="url(#openArrow)"/>
  <text x="114" y="2395" class="msg">8.11: Hiển thị "Kết quả sàng lọc" (tóm tắt, chuyên khoa gợi ý)</text>

  <!-- ALT 5.2: Đặt khám vs Kiểm tra lại (Step 20-21 & Alt 20.1) -->
  <rect x="60" y="2420" width="1458" height="146" class="frag-box"/>
  <polygon points="60,2420 116,2420 116,2440 104,2450 60,2450" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.5"/>
  <text x="75" y="2440" class="frag-tag" style="font-size:14.5px;">alt</text>
  <text x="128" y="2442" class="guard" style="font-size:14.5px;">[nhấn "Đặt khám"]</text>

  <line x1="103" y1="2478" x2="332" y2="2478" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="114" y="2469" class="msg" style="font-size:14.5px;">9: Nhấn "Đặt khám" → điều hướng GD_DatKham(screeningSessionId, specialtyId)</text>

  <line x1="60" y1="2494" x2="1518" y2="2494" class="frag-div"/>
  <text x="128" y="2516" class="guard" style="font-size:14.5px;">[chọn "Kiểm tra lại thông tin" hoặc đóng (Alt 20.1)]</text>
  <line x1="103" y1="2552" x2="332" y2="2552" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="114" y="2543" class="msg" style="font-size:14.5px;">9.1: Quay lại các bước trước hoặc đóng màn hình sàng lọc</text>

  <!-- ELSE của ALT 5: Lỗi máy chủ (Alt 18.2) -->
  <line x1="28" y1="2598" x2="1550" y2="2598" class="frag-div"/>
  <text x="114" y="2624" class="guard">[lỗi tổng hợp dữ liệu / gián đoạn máy chủ (Alt 18.2)]</text>

  <line x1="332" y1="2666" x2="103" y2="2666" class="ret" marker-end="url(#openArrow)"/>
  <text x="114" y="2657" class="msg">8.12: Thông báo lỗi hệ thống + nút "Thử lại" (quay lại bước 17)</text>
</svg>
"""

svg_path = OUT_DIR / "seq_sang_loc_ai.svg"
png_path = OUT_DIR / "seq_sang_loc_ai.png"
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
    page = browser.new_page(viewport={"width": 1580, "height": 2740}, device_scale_factor=2)
    page.set_content(html)
    page.locator("svg").screenshot(path=str(png_path))
    browser.close()

print(f"Rendered: {svg_path}")
print(f"Rendered: {png_path}")
