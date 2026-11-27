from pathlib import Path
import subprocess
import tempfile

OUT_DIR = Path(__file__).resolve().parent
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Optimized for A4 Word reports: compact width (1600px) + LARGE 15px-17px bold typography
# Includes UML Create Message (<<create>>) and Destruction Occurrence (X) for ObjHospital_new & ObjUser_new
SVG = """<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="2740" viewBox="0 0 1600 2740">
  <defs>
    <style>
      .lifeline-label { font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 800; fill: #0f172a; text-anchor: middle; }
      .lifeline-sub { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12.4px; font-weight: 600; fill: #334155; text-anchor: middle; }
      .msg { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14.8px; font-weight: 600; fill: #0f172a; paint-order: stroke; stroke: #FFFFFF; stroke-width: 7px; stroke-linejoin: round; }
      .guard { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14.8px; font-weight: 800; fill: #0f172a; paint-order: stroke; stroke: #FFFFFF; stroke-width: 7px; stroke-linejoin: round; }
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
  <rect x="0" y="0" width="1600" height="2740" fill="#FFFFFF"/>

  <!-- Frame -->
  <rect x="14" y="14" width="1572" height="2712" fill="none" stroke="#64748b" stroke-width="1.6"/>
  <polygon points="14,14 430,14 430,46 412,62 14,62" fill="#F1F5F9" stroke="#64748b" stroke-width="1.6"/>
  <text x="30" y="45" class="frag-tag" style="font-size:17px;">sd Duyệt yêu cầu hợp tác (NovaCare)</text>

  <!-- ================= LIFELINES (7 top + dynamic ObjHospital_new & ObjUser_new at x=790) ================= -->
  <!-- X: Admin=85, GD=310, CTR=565, [Dynamic=790], E_partner_requests=1005, E_hospitals=1175, E_users=1300, E_audit_logs=1500 -->

  <!-- 1. Actor: Quản trị viên hệ thống -->
  <g transform="translate(85, 110)">
    <circle cx="0" cy="-18" r="12" class="icon-fill"/>
    <line x1="0" y1="-6" x2="0" y2="20" class="icon-stroke"/>
    <line x1="-18" y1="3" x2="18" y2="3" class="icon-stroke"/>
    <line x1="0" y1="20" x2="-14" y2="38" class="icon-stroke"/>
    <line x1="0" y1="20" x2="14" y2="38" class="icon-stroke"/>
    <text x="0" y="56" class="lifeline-label">Quản trị viên</text>
    <text x="0" y="73" class="lifeline-label">hệ thống</text>
    <text x="0" y="89" class="lifeline-sub">(ADMIN)</text>
  </g>
  <line x1="85" y1="208" x2="85" y2="2700" class="lifeline"/>

  <!-- 2. Boundary: GD_DuyetYeuCauHopTac -->
  <g transform="translate(310, 124)">
    <line x1="-29" y1="-19" x2="-29" y2="19" class="icon-stroke"/>
    <line x1="-29" y1="0" x2="-17" y2="0" class="icon-stroke"/>
    <circle cx="3" cy="0" r="20" class="icon-fill"/>
    <text x="0" y="45" class="lifeline-label">GD_DuyetYeuCau</text>
    <text x="0" y="62" class="lifeline-label">HopTac</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;boundary&gt;&gt;</text>
  </g>
  <line x1="310" y1="208" x2="310" y2="2700" class="lifeline"/>

  <!-- 3. Control: CTR_PartnerRequestsService -->
  <g transform="translate(565, 124)">
    <circle cx="0" cy="0" r="20" class="icon-fill"/>
    <path d="M -5,-26 L 5,-20 L -5,-14" fill="none" stroke="#0f172a" stroke-width="2"/>
    <text x="0" y="45" class="lifeline-label">CTR_PartnerRequests</text>
    <text x="0" y="62" class="lifeline-label">Service</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;control&gt;&gt;</text>
  </g>
  <line x1="565" y1="208" x2="565" y2="2700" class="lifeline"/>

  <!-- 4. Entity: E_partner_requests -->
  <g transform="translate(1005, 124)">
    <circle cx="0" cy="-2" r="20" class="icon-fill"/>
    <line x1="-22" y1="20" x2="22" y2="20" class="icon-stroke"/>
    <text x="0" y="45" class="lifeline-label">E_partner_</text>
    <text x="0" y="62" class="lifeline-label">requests</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="1005" y1="208" x2="1005" y2="2700" class="lifeline"/>

  <!-- 5. Entity: E_hospitals -->
  <g transform="translate(1175, 124)">
    <circle cx="0" cy="-2" r="20" class="icon-fill"/>
    <line x1="-22" y1="20" x2="22" y2="20" class="icon-stroke"/>
    <text x="0" y="48" class="lifeline-label">E_hospitals</text>
    <text x="0" y="66" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="1175" y1="208" x2="1175" y2="2700" class="lifeline"/>

  <!-- 6. Entity: E_users -->
  <g transform="translate(1300, 124)">
    <circle cx="0" cy="-2" r="20" class="icon-fill"/>
    <line x1="-22" y1="20" x2="22" y2="20" class="icon-stroke"/>
    <text x="0" y="48" class="lifeline-label">E_users</text>
    <text x="0" y="66" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="1300" y1="208" x2="1300" y2="2700" class="lifeline"/>

  <!-- 7. Entity: E_audit_logs -->
  <g transform="translate(1500, 124)">
    <circle cx="0" cy="-2" r="20" class="icon-fill"/>
    <line x1="-22" y1="20" x2="22" y2="20" class="icon-stroke"/>
    <text x="0" y="48" class="lifeline-label">E_audit_logs</text>
    <text x="0" y="66" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="1500" y1="208" x2="1500" y2="2700" class="lifeline"/>

  <!-- ================= ACTIVATION BARS ================= -->
  <!-- Quản trị viên hệ thống -->
  <rect x="77" y="232" width="16" height="2436" class="act"/>

  <!-- GD_DuyetYeuCauHopTac -->
  <rect x="302" y="248" width="16" height="2414" class="act"/>
  <rect x="310" y="280" width="14" height="24" class="act"/>
  <rect x="310" y="510" width="14" height="24" class="act"/>
  <rect x="310" y="598" width="14" height="24" class="act"/>
  <rect x="310" y="900" width="14" height="24" class="act"/>
  <rect x="310" y="2550" width="14" height="24" class="act"/>

  <!-- CTR_PartnerRequestsService -->
  <rect x="557" y="966" width="16" height="1394" class="act"/>
  <rect x="565" y="1148" width="14" height="24" class="act"/>
  <rect x="565" y="1652" width="14" height="24" class="act"/>
  <rect x="565" y="2274" width="14" height="24" class="act"/>

  <!-- E_partner_requests -->
  <rect x="997" y="1016" width="16" height="104" class="act"/>
  <rect x="1005" y="1048" width="14" height="24" class="act"/>
  <rect x="997" y="2032" width="16" height="104" class="act"/>
  <rect x="1005" y="2062" width="14" height="24" class="act"/>

  <!-- E_hospitals -->
  <rect x="1167" y="1214" width="16" height="52" class="act"/>
  <rect x="1167" y="1506" width="16" height="106" class="act"/>
  <rect x="1175" y="1532" width="14" height="24" class="act"/>

  <!-- E_users -->
  <rect x="1292" y="1872" width="16" height="110" class="act"/>
  <rect x="1300" y="1900" width="14" height="24" class="act"/>

  <!-- E_audit_logs -->
  <rect x="1492" y="2186" width="16" height="60" class="act"/>

  <!-- ================= PHASE 1: MỞ HỘP THOẠI PHÊ DUYỆT & KIỂM TRA THÔNG TIN (Steps 1-3) ================= -->
  <line x1="93" y1="250" x2="302" y2="250" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="104" y="240" class="msg">1: Nhấn nút "Chấp thuận" trên yêu cầu đang chờ xử lý</text>

  <path d="M 318 276 L 362 276 L 362 300 L 324 300" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="372" y="294" class="msg">1.1: handleOpenApprove(req)</text>

  <line x1="302" y1="338" x2="93" y2="338" class="ret" marker-end="url(#openArrow)"/>
  <text x="104" y="328" class="msg">1.2: Hiển thị hộp thoại phê duyệt (tên cơ sở, tệp PDF, email xác nhận, họ tên QTV, ghi chú)</text>

  <line x1="93" y1="388" x2="302" y2="388" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="104" y="378" class="msg">2: Kiểm tra / chỉnh sửa tên cơ sở y tế, email nhận thông báo và họ tên QTV</text>

  <!-- ================= PHASE 2: TẢI TỆP PDF & KIỂM TRA TỆP (Steps 4-5, Alt 4.1, 5.1) ================= -->
  <rect x="28" y="414" width="1544" height="366" class="frag-box"/>
  <polygon points="28,414 92,414 92,436 78,448 28,448" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="45" y="437" class="frag-tag">opt</text>
  <text x="112" y="438" class="guard">[Tải lên văn bản chấp thuận PDF và nhập ghi chú nội bộ (Bước 4)]</text>

  <line x1="93" y1="480" x2="302" y2="480" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="104" y="470" class="msg">3: Chọn tệp văn bản chấp thuận PDF và nhập ghi chú nội bộ</text>

  <path d="M 318 506 L 362 506 L 362 530 L 324 530" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="372" y="524" class="msg">3.1: checkPdfFile(file)</text>

  <!-- ALT 1: Kiểm tra định dạng & dung lượng PDF (Alt 4.1, 5.1) -->
  <rect x="44" y="550" width="1512" height="212" class="frag-box"/>
  <polygon points="44,550 106,550 106,572 92,584 44,584" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="61" y="573" class="frag-tag">alt</text>
  <text x="122" y="574" class="guard">[Định dạng application/pdf &amp;&amp; dung lượng &lt;= 5MB]</text>

  <path d="M 318 594 L 362 594 L 362 618 L 324 618" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="372" y="612" class="msg">3.2: readAsDataURL(file)</text>

  <line x1="302" y1="658" x2="93" y2="658" class="ret" marker-end="url(#openArrow)"/>
  <text x="104" y="648" class="msg">3.3: Hiển thị tên tệp PDF đã chọn</text>

  <line x1="44" y1="682" x2="1556" y2="682" class="frag-div"/>
  <text x="122" y="710" class="guard">[Không phải PDF hoặc dung lượng &gt; 5MB (Alt 4.1, 5.1)]</text>

  <line x1="302" y1="744" x2="93" y2="744" class="ret" marker-end="url(#openArrow)"/>
  <text x="104" y="734" class="msg">3.4: Xóa tệp vừa chọn và hiển thị lỗi "Chỉ chấp nhận file PDF tối đa 5MB"</text>

  <!-- ================= PHASE 3: XÁC NHẬN DUYỆT vs HỦY BỎ (Steps 6-11, Alt 6.1, 7.1) ================= -->
  <rect x="28" y="808" width="1544" height="1840" class="frag-box"/>
  <polygon points="28,808 92,808 92,832 78,844 28,844" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="46" y="832" class="frag-tag">alt</text>
  <text x="112" y="833" class="guard">[Nhấn nút "Xác nhận Duyệt &amp; Gửi mail" (Bước 6)]</text>

  <line x1="93" y1="870" x2="302" y2="870" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="104" y="860" class="msg">4: Nhấn nút "Xác nhận Duyệt &amp; Gửi mail"</text>

  <path d="M 318 896 L 362 896 L 362 920 L 324 920" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="372" y="914" class="msg">4.1: validateForm(approveForm)</text>

  <line x1="318" y1="968" x2="557" y2="968" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="342" y="958" class="msg">4.2: approveRequest(id, dto)</text>

  <line x1="573" y1="1018" x2="997" y2="1018" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="720" y="1008" class="msg">4.3: findUnique(id)</text>

  <path d="M 1013 1044 L 1053 1044 L 1053 1068 L 1019 1068" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="1063" y="1052" class="msg">4.4: Truy vấn yêu cầu</text>
  <text x="1095" y="1070" class="msg">hợp tác</text>

  <line x1="997" y1="1118" x2="573" y2="1118" class="ret" marker-end="url(#openArrow)"/>
  <text x="655" y="1108" class="msg">4.5: Trả về thông tin yêu cầu hợp tác</text>

  <path d="M 573 1144 L 618 1144 L 618 1168 L 579 1168" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="628" y="1162" class="msg">4.6: validateRequestAndPdf(request, dto)</text>

  <!-- Step 8a: Kiểm tra & tạo mới ObjHospital_new -->
  <line x1="573" y1="1216" x2="1167" y2="1216" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="750" y="1206" class="msg">4.7: findFirst(hospitalName)</text>

  <line x1="1167" y1="1264" x2="573" y2="1264" class="ret" marker-end="url(#openArrow)"/>
  <text x="715" y="1254" class="msg">4.8: Trả về cơ sở y tế (nếu đã tồn tại)</text>

  <!-- OPT 2: Khởi tạo ObjHospital_new nếu chưa tồn tại -->
  <rect x="44" y="1288" width="1512" height="338" class="frag-box"/>
  <polygon points="44,1288 106,1288 106,1310 92,1322 44,1322" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="60" y="1311" class="frag-tag">opt</text>
  <text x="122" y="1312" class="guard">[Chưa tồn tại cơ sở y tế trong hệ thống]</text>

  <!-- Dynamic Object Creation: ObjHospital_new -->
  <line x1="573" y1="1366" x2="760" y2="1366" class="ret" marker-end="url(#openArrow)"/>
  <text x="618" y="1340" class="msg">4.9: &laquo;create&raquo;</text>
  <text x="585" y="1358" class="msg">CreateObjHospital_new</text>

  <g transform="translate(790, 1366)">
    <circle cx="0" cy="-2" r="20" class="icon-fill"/>
    <line x1="-22" y1="20" x2="22" y2="20" class="icon-stroke"/>
    <text x="0" y="40" class="lifeline-label" style="font-size:14px;">ObjHospital_new</text>
    <text x="0" y="55" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="790" y1="1428" x2="790" y2="1554" class="lifeline"/>
  <rect x="782" y="1444" width="16" height="28" class="act"/>

  <line x1="782" y1="1460" x2="573" y2="1460" class="ret" marker-end="url(#openArrow)"/>
  <text x="584" y="1450" class="msg">4.10: Trả về ObjHospital_new</text>

  <line x1="573" y1="1508" x2="1167" y2="1508" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="840" y="1498" class="msg">4.11: create(ObjHospital_new)</text>

  <path d="M 1183 1528 L 1223 1528 L 1223 1552 L 1189 1552" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="1233" y="1536" class="msg">4.12: Lưu cơ sở</text>
  <text x="1268" y="1554" class="msg">y tế mới</text>

  <!-- UML Destruction X for ObjHospital_new -->
  <line x1="776" y1="1540" x2="804" y2="1568" stroke="#0f172a" stroke-width="2.4"/>
  <line x1="804" y1="1540" x2="776" y2="1568" stroke="#0f172a" stroke-width="2.4"/>

  <line x1="1167" y1="1608" x2="573" y2="1608" class="ret" marker-end="url(#openArrow)"/>
  <text x="720" y="1598" class="msg">4.13: Trả về thông tin cơ sở y tế mới tạo</text>

  <!-- Step 8b: Sinh activationToken & khởi tạo mới ObjUser_new (chờ kích hoạt) -->
  <path d="M 573 1648 L 618 1648 L 618 1672 L 579 1672" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="628" y="1666" class="msg">4.14: Sinh activationToken (48h) &amp; băm mật khẩu tạm</text>

  <!-- Dynamic Object Creation: ObjUser_new -->
  <line x1="573" y1="1732" x2="760" y2="1732" class="ret" marker-end="url(#openArrow)"/>
  <text x="615" y="1706" class="msg">4.15: &laquo;create&raquo;</text>
  <text x="598" y="1724" class="msg">CreateObjUser_new</text>

  <g transform="translate(790, 1732)">
    <circle cx="0" cy="-2" r="20" class="icon-fill"/>
    <line x1="-22" y1="20" x2="22" y2="20" class="icon-stroke"/>
    <text x="0" y="40" class="lifeline-label" style="font-size:14px;">ObjUser_new</text>
    <text x="0" y="55" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="790" y1="1794" x2="790" y2="1924" class="lifeline"/>
  <rect x="782" y="1810" width="16" height="28" class="act"/>

  <line x1="782" y1="1826" x2="573" y2="1826" class="ret" marker-end="url(#openArrow)"/>
  <text x="594" y="1816" class="msg">4.16: Trả về ObjUser_new</text>

  <line x1="573" y1="1874" x2="1292" y2="1874" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="845" y="1864" class="msg">4.17: create(ObjUser_new)</text>

  <path d="M 1308 1896 L 1344 1896 L 1344 1920 L 1314 1920" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="1354" y="1904" class="msg">4.18: Lưu tài khoản chờ</text>
  <text x="1378" y="1922" class="msg">kích hoạt (isActive=false)</text>

  <!-- UML Destruction X for ObjUser_new -->
  <line x1="776" y1="1910" x2="804" y2="1938" stroke="#0f172a" stroke-width="2.4"/>
  <line x1="804" y1="1910" x2="776" y2="1938" stroke="#0f172a" stroke-width="2.4"/>

  <line x1="1292" y1="1980" x2="573" y2="1980" class="ret" marker-end="url(#openArrow)"/>
  <text x="765" y="1970" class="msg">4.19: Trả về thông tin tài khoản quản trị cơ sở</text>

  <!-- Step 8c: Cập nhật trạng thái APPROVED -->
  <line x1="573" y1="2034" x2="997" y2="2034" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="695" y="2024" class="msg">4.20: update(id, APPROVED)</text>

  <path d="M 1013 2058 L 1053 2058 L 1053 2082 L 1019 2082" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="1063" y="2066" class="msg">4.21: Cập nhật trạng thái</text>
  <text x="1095" y="2084" class="msg">APPROVED &amp; lưu PDF</text>

  <line x1="997" y1="2134" x2="573" y2="2134" class="ret" marker-end="url(#openArrow)"/>
  <text x="680" y="2124" class="msg">4.22: Trả về yêu cầu đã duyệt</text>

  <!-- Step 9: Ghi nhật ký thao tác -->
  <line x1="573" y1="2188" x2="1492" y2="2188" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="860" y="2178" class="msg">4.23: logAction(APPROVE_PARTNER_REQUEST)</text>

  <line x1="1492" y1="2244" x2="573" y2="2244" class="ret" marker-end="url(#openArrow)"/>
  <text x="900" y="2234" class="msg">4.24: Trả về kết quả ghi nhật ký</text>

  <!-- Step 10: Gửi email chấp thuận & kích hoạt -->
  <path d="M 573 2270 L 618 2270 L 618 2294 L 579 2294" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="628" y="2288" class="msg">4.25: sendHospitalActivationEmail(email, hospitalName, activationUrl)</text>

  <!-- Step 11: Trả về & hiển thị kết quả -->
  <line x1="557" y1="2354" x2="318" y2="2354" class="ret" marker-end="url(#openArrow)"/>
  <text x="336" y="2326" class="msg">4.26: Trả về kết quả duyệt</text>
  <text x="370" y="2344" class="msg">hợp tác thành công</text>

  <line x1="302" y1="2426" x2="93" y2="2426" class="ret" marker-end="url(#openArrow)"/>
  <text x="104" y="2398" class="msg">4.27: Đóng hộp thoại, làm mới danh sách, thông báo duyệt thành công</text>
  <text x="138" y="2416" class="msg">và mở hộp thoại "Đã Phê Duyệt Thành Công"</text>

  <!-- ELSE của OUTER ALT: Nhấn Hủy hoặc đóng hộp thoại (Alt 6.1, 7.1) -->
  <line x1="28" y1="2456" x2="1572" y2="2456" class="frag-div"/>
  <text x="112" y="2484" class="guard">[Nhấn nút "Hủy" hoặc đóng hộp thoại phê duyệt (Alt 6.1, 7.1)]</text>

  <line x1="93" y1="2520" x2="302" y2="2520" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="104" y="2510" class="msg">5: Nhấn nút "Hủy" hoặc đóng hộp thoại phê duyệt</text>

  <path d="M 318 2546 L 362 2546 L 362 2570 L 324 2570" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="372" y="2564" class="msg">5.1: closeApproveDialog()</text>

  <line x1="302" y1="2624" x2="93" y2="2624" class="ret" marker-end="url(#openArrow)"/>
  <text x="104" y="2614" class="msg">5.2: Đóng biểu mẫu, không lưu thay đổi và giữ nguyên trạng thái chờ xử lý</text>
</svg>
"""

svg_path = OUT_DIR / "seq_duyet_yeu_cau_hop_tac.svg"
png_path = OUT_DIR / "seq_duyet_yeu_cau_hop_tac.png"
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

chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
try:
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=chrome_exe)
        page = browser.new_page(viewport={"width": 1600, "height": 2740}, device_scale_factor=2)
        page.set_content(html)
        page.locator("svg").screenshot(path=str(png_path))
        browser.close()
except ImportError:
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as tmp:
        tmp.write(html)
        tmp_path = Path(tmp.name)
    try:
        subprocess.run(
            [
                chrome_exe,
                "--headless=new",
                "--disable-gpu",
                "--hide-scrollbars",
                "--force-device-scale-factor=2",
                "--window-size=1600,2740",
                f"--screenshot={png_path}",
                tmp_path.as_uri(),
            ],
            check=True,
        )
    finally:
        tmp_path.unlink(missing_ok=True)

print(f"Rendered: {svg_path}")
print(f"Rendered: {png_path}")
