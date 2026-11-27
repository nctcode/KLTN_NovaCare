from pathlib import Path
from playwright.sync_api import sync_playwright

OUT_DIR = Path(r"d:\HTTT18B\KLTN\NovaCare\docs\diagrams")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Optimized for A4 Word reports: compact width (1540px) + LARGE 15.5px-17.5px bold typography
SVG = """<svg xmlns="http://www.w3.org/2000/svg" width="1540" height="2260" viewBox="0 0 1540 2260">
  <defs>
    <style>
      .lifeline-label { font-family: 'Segoe UI', Arial, sans-serif; font-size: 16.5px; font-weight: 800; fill: #0f172a; text-anchor: middle; }
      .lifeline-sub { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12.8px; font-weight: 600; fill: #334155; text-anchor: middle; }
      .msg { font-family: 'Segoe UI', Arial, sans-serif; font-size: 15.5px; font-weight: 600; fill: #0f172a; paint-order: stroke; stroke: #FFFFFF; stroke-width: 7px; stroke-linejoin: round; }
      .guard { font-family: 'Segoe UI', Arial, sans-serif; font-size: 15.5px; font-weight: 800; fill: #0f172a; paint-order: stroke; stroke: #FFFFFF; stroke-width: 7px; stroke-linejoin: round; }
      .frag-tag { font-family: 'Segoe UI', Arial, sans-serif; font-size: 16.5px; font-weight: 800; fill: #0f172a; }
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
  <rect x="0" y="0" width="1540" height="2260" fill="#FFFFFF"/>

  <!-- Frame -->
  <rect x="14" y="14" width="1512" height="2232" fill="none" stroke="#64748b" stroke-width="1.6"/>
  <polygon points="14,14 410,14 410,46 392,62 14,62" fill="#F1F5F9" stroke="#64748b" stroke-width="1.6"/>
  <text x="30" y="45" class="frag-tag" style="font-size:17px;">sd UC-AUTH-04: Quên mật khẩu (NovaCare)</text>

  <!-- ================= LIFELINES ================= -->
  <!-- X: Actor=105, GD_QuenMatKhau=360, CTR_PasswordResetService=665, E_users=915, E_password_reset_challenges=1125, E_refresh_tokens=1305, SMS=1455 -->

  <!-- 1. Actor: Người dùng -->
  <g transform="translate(105, 112)">
    <circle cx="0" cy="-18" r="12" class="icon-fill"/>
    <line x1="0" y1="-6" x2="0" y2="20" class="icon-stroke"/>
    <line x1="-18" y1="3" x2="18" y2="3" class="icon-stroke"/>
    <line x1="0" y1="20" x2="-14" y2="38" class="icon-stroke"/>
    <line x1="0" y1="20" x2="14" y2="38" class="icon-stroke"/>
    <text x="0" y="58" class="lifeline-label">Người dùng</text>
    <text x="0" y="75" class="lifeline-sub">(Khách / PATIENT /</text>
    <text x="0" y="90" class="lifeline-sub">DOCTOR)</text>
  </g>
  <line x1="105" y1="212" x2="105" y2="2225" class="lifeline"/>

  <!-- 2. Boundary: GD_QuenMatKhau -->
  <g transform="translate(360, 124)">
    <line x1="-30" y1="-19" x2="-30" y2="19" class="icon-stroke"/>
    <line x1="-30" y1="0" x2="-18" y2="0" class="icon-stroke"/>
    <circle cx="3" cy="0" r="21" class="icon-fill"/>
    <text x="0" y="48" class="lifeline-label">GD_QuenMatKhau</text>
    <text x="0" y="66" class="lifeline-sub">&lt;&lt;boundary&gt;&gt;</text>
  </g>
  <line x1="360" y1="212" x2="360" y2="2225" class="lifeline"/>

  <!-- 3. Control: CTR_PasswordResetService -->
  <g transform="translate(665, 124)">
    <circle cx="0" cy="0" r="21" class="icon-fill"/>
    <path d="M -5,-27 L 5,-21 L -5,-15" fill="none" stroke="#0f172a" stroke-width="2"/>
    <text x="0" y="46" class="lifeline-label" style="font-size:15.5px;">CTR_PasswordReset</text>
    <text x="0" y="63" class="lifeline-label" style="font-size:15.5px;">Service</text>
    <text x="0" y="79" class="lifeline-sub">&lt;&lt;control&gt;&gt;</text>
  </g>
  <line x1="665" y1="212" x2="665" y2="2225" class="lifeline"/>

  <!-- 4. Entity: E_users -->
  <g transform="translate(915, 124)">
    <circle cx="0" cy="-2" r="21" class="icon-fill"/>
    <line x1="-23" y1="21" x2="23" y2="21" class="icon-stroke"/>
    <text x="0" y="48" class="lifeline-label">E_users</text>
    <text x="0" y="66" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="915" y1="212" x2="915" y2="2225" class="lifeline"/>

  <!-- 5. Entity: E_password_reset_challenges -->
  <g transform="translate(1125, 124)">
    <circle cx="0" cy="-2" r="21" class="icon-fill"/>
    <line x1="-23" y1="21" x2="23" y2="21" class="icon-stroke"/>
    <text x="0" y="44" class="lifeline-label" style="font-size:14.5px;">E_password_reset_</text>
    <text x="0" y="61" class="lifeline-label" style="font-size:14.5px;">challenges</text>
    <text x="0" y="78" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="1125" y1="212" x2="1125" y2="2225" class="lifeline"/>

  <!-- 6. Entity: E_refresh_tokens -->
  <g transform="translate(1305, 124)">
    <circle cx="0" cy="-2" r="21" class="icon-fill"/>
    <line x1="-23" y1="21" x2="23" y2="21" class="icon-stroke"/>
    <text x="0" y="48" class="lifeline-label" style="font-size:15.5px;">E_refresh_tokens</text>
    <text x="0" y="66" class="lifeline-sub">&lt;&lt;entity&gt;&gt;</text>
  </g>
  <line x1="1305" y1="212" x2="1305" y2="2225" class="lifeline"/>

  <!-- 7. Secondary Actor: Dịch vụ gửi SMS -->
  <g transform="translate(1455, 112)">
    <circle cx="0" cy="-18" r="12" class="icon-fill"/>
    <line x1="0" y1="-6" x2="0" y2="20" class="icon-stroke"/>
    <line x1="-18" y1="3" x2="18" y2="3" class="icon-stroke"/>
    <line x1="0" y1="20" x2="-14" y2="38" class="icon-stroke"/>
    <line x1="0" y1="20" x2="14" y2="38" class="icon-stroke"/>
    <text x="0" y="58" class="lifeline-label" style="font-size:15.5px;">Dịch vụ gửi SMS</text>
    <text x="0" y="75" class="lifeline-sub">(SmsService)</text>
  </g>
  <line x1="1455" y1="212" x2="1455" y2="2225" class="lifeline"/>

  <!-- ================= ACTIVATION BARS ================= -->
  <!-- Actor -->
  <rect x="97" y="232" width="16" height="1965" class="act"/>

  <!-- GD_QuenMatKhau -->
  <rect x="352" y="244" width="16" height="1940" class="act"/>
  <rect x="360" y="278" width="14" height="24" class="act"/>
  <rect x="360" y="782" width="14" height="24" class="act"/>
  <rect x="360" y="1248" width="14" height="24" class="act"/>
  <rect x="360" y="1394" width="14" height="24" class="act"/>
  <rect x="360" y="2132" width="14" height="26" class="act"/>

  <!-- CTR_PasswordResetService -->
  <rect x="657" y="376" width="16" height="400" class="act"/>
  <rect x="657" y="932" width="16" height="444" class="act"/>
  <rect x="665" y="1038" width="14" height="24" class="act"/>
  <rect x="657" y="1592" width="16" height="516" class="act"/>

  <!-- E_users -->
  <rect x="907" y="410" width="16" height="46" class="act"/>
  <rect x="907" y="1768" width="16" height="48" class="act"/>

  <!-- E_password_reset_challenges -->
  <rect x="1117" y="532" width="16" height="44" class="act"/>
  <rect x="1117" y="968" width="16" height="44" class="act"/>
  <rect x="1117" y="1152" width="16" height="38" class="act"/>
  <rect x="1117" y="1658" width="16" height="46" class="act"/>
  <rect x="1117" y="1882" width="16" height="42" class="act"/>

  <!-- E_refresh_tokens -->
  <rect x="1297" y="1986" width="16" height="44" class="act"/>

  <!-- SMS -->
  <rect x="1447" y="610" width="16" height="44" class="act"/>

  <!-- ================= PHASE 1: FORGOT PASSWORD REQUEST ================= -->
  <line x1="113" y1="246" x2="352" y2="246" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="124" y="237" class="msg">1: Chọn "Quên mật khẩu?"</text>

  <path d="M 368 264 L 414 264 L 414 288 L 374 288" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="424" y="282" class="msg">1.1: showForgotPasswordForm()</text>

  <line x1="113" y1="334" x2="352" y2="334" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="124" y="325" class="msg">2: Nhập phone, chọn "Nhận mã xác thực"</text>

  <line x1="368" y1="378" x2="657" y2="378" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="382" y="369" class="msg">2.1: request(ForgotPasswordDto { phone })</text>

  <line x1="673" y1="412" x2="907" y2="412" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="684" y="403" class="msg">2.2: findFirst({ phone, deletedAt: null, isActive: true })</text>

  <line x1="907" y1="456" x2="673" y2="456" class="ret" marker-end="url(#openArrow)"/>
  <text x="752" y="447" class="msg">2.3: user</text>

  <!-- ALT 1: USER CHECK (Alt 3.1) -->
  <rect x="30" y="476" width="1478" height="392" class="frag-box"/>
  <polygon points="30,476 96,476 96,500 82,512 30,512" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="48" y="500" class="frag-tag">alt</text>
  <text x="126" y="502" class="guard">[user != null &amp;&amp; phone hợp lệ]</text>

  <line x1="673" y1="534" x2="1117" y2="534" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="684" y="525" class="msg">2.4: upsert({ userId: user.id, otpHash, destination: phone, expiresAt: +5m })</text>

  <line x1="1117" y1="576" x2="673" y2="576" class="ret" marker-end="url(#openArrow)"/>
  <text x="935" y="567" class="msg">2.5: challenge</text>

  <line x1="673" y1="612" x2="1447" y2="612" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="684" y="603" class="msg">2.6: sendResetOtp(phone, otp)</text>

  <line x1="1447" y1="654" x2="673" y2="654" class="ret" marker-end="url(#openArrow)"/>
  <text x="1150" y="645" class="msg">2.7: Đã gửi SMS mã OTP (6 số)</text>

  <line x1="657" y1="686" x2="368" y2="686" class="ret" marker-end="url(#openArrow)"/>
  <text x="392" y="677" class="msg">2.8: { message, maskedPhone }</text>

  <!-- ALT 1 ELSE: Luồng 3.1 -->
  <line x1="30" y1="706" x2="1508" y2="706" class="frag-div"/>
  <text x="126" y="728" class="guard">[phone không tồn tại / không hợp lệ — Luồng 3.1]</text>

  <line x1="657" y1="772" x2="368" y2="772" class="ret" marker-end="url(#openArrow)"/>
  <text x="398" y="763" class="msg">3: BadRequestException (400)</text>

  <path d="M 368 784 L 414 784 L 414 806 L 374 806" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="424" y="800" class="msg">3.1: showError("Số điện thoại không hợp lệ")</text>

  <path d="M 113 822 L 158 822 L 158 844 L 113 844" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="170" y="838" class="msg">3.2: Quay về bước 2 (Nhập lại phone)</text>

  <!-- ================= PHASE 2: VERIFY OTP ================= -->
  <line x1="113" y1="896" x2="352" y2="896" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="124" y="887" class="msg">4: Nhập otpCode, chọn "Xác thực OTP"</text>

  <line x1="368" y1="934" x2="657" y2="934" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="382" y="925" class="msg">4.1: verify(VerifyOtpDto { phone, otpCode })</text>

  <line x1="673" y1="970" x2="1117" y2="970" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="684" y="961" class="msg">4.2: findUnique({ userId: user.id })</text>

  <line x1="1117" y1="1012" x2="673" y2="1012" class="ret" marker-end="url(#openArrow)"/>
  <text x="720" y="1003" class="msg">4.3: challenge (otpHash, destination, expiresAt, attempts)</text>

  <path d="M 673 1026 L 720 1026 L 720 1050 L 679 1050" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="730" y="1044" class="msg">4.4: argon2.verify(otpHash, otpCode) &amp; check expiresAt</text>

  <!-- ALT 2: VERIFY OTP RESULT (Alt 5.1) -->
  <rect x="30" y="1078" width="1478" height="410" class="frag-box"/>
  <polygon points="30,1078 96,1078 96,1102 82,1114 30,1114" fill="#F1F5F9" stroke="#1e293b" stroke-width="1.6"/>
  <text x="48" y="1102" class="frag-tag">alt</text>
  <text x="126" y="1104" class="guard">[otpValid == true &amp;&amp; expiresAt &gt; now]</text>

  <line x1="673" y1="1156" x2="1117" y2="1156" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="684" y="1134" class="msg">4.5: update({ otpHash: null, verificationTokenHash,</text>
  <text x="716" y="1151" class="msg">verificationExpiresAt })</text>

  <line x1="657" y1="1214" x2="368" y2="1214" class="ret" marker-end="url(#openArrow)"/>
  <text x="424" y="1205" class="msg">4.6: { resetToken }</text>

  <path d="M 368 1234 L 414 1234 L 414 1258 L 374 1258" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="424" y="1252" class="msg">4.7: showResetPasswordForm()</text>

  <!-- ALT 2 ELSE: Luồng 5.1 -->
  <line x1="30" y1="1294" x2="1508" y2="1294" class="frag-div"/>
  <text x="126" y="1318" class="guard">[otpValid == false || expiresAt &lt;= now — Luồng 5.1]</text>

  <line x1="657" y1="1358" x2="368" y2="1358" class="ret" marker-end="url(#openArrow)"/>
  <text x="394" y="1349" class="msg">5: BadRequestException (400)</text>

  <path d="M 368 1378 L 414 1378 L 414 1402 L 374 1402" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="424" y="1396" class="msg">5.1: showError("Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại")</text>

  <path d="M 113 1436 L 158 1436 L 158 1460 L 113 1460" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="170" y="1454" class="msg">5.2: Quay về bước 4 (Nhập lại otpCode)</text>

  <!-- ================= PHASE 3: RESET PASSWORD & REVOKE SESSIONS ================= -->
  <line x1="113" y1="1540" x2="352" y2="1540" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="124" y="1518" class="msg">6: Nhập newPassword, confirmPassword,</text>
  <text x="144" y="1535" class="msg">chọn "Đổi mật khẩu"</text>

  <line x1="368" y1="1596" x2="657" y2="1596" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="378" y="1574" class="msg">6.1: reset(ResetPasswordDto {</text>
  <text x="404" y="1591" class="msg">resetToken, newPassword })</text>

  <line x1="673" y1="1660" x2="1117" y2="1660" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="684" y="1638" class="msg">6.2: findFirst({ verificationTokenHash,</text>
  <text x="716" y="1655" class="msg">verificationExpiresAt &gt; now })</text>

  <line x1="1117" y1="1704" x2="673" y2="1704" class="ret" marker-end="url(#openArrow)"/>
  <text x="865" y="1695" class="msg">6.3: challenge (userId)</text>

  <line x1="673" y1="1770" x2="907" y2="1770" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="682" y="1748" class="msg">6.4: update({ id: userId, passwordHash,</text>
  <text x="712" y="1765" class="msg">authVersion: { increment: 1 } })</text>

  <line x1="907" y1="1816" x2="673" y2="1816" class="ret" marker-end="url(#openArrow)"/>
  <text x="742" y="1807" class="msg">6.5: updatedUser</text>

  <line x1="673" y1="1884" x2="1117" y2="1884" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="684" y="1862" class="msg">6.6: update({ userId, verificationTokenHash: null,</text>
  <text x="716" y="1879" class="msg">verificationExpiresAt: null })</text>

  <line x1="1117" y1="1924" x2="673" y2="1924" class="ret" marker-end="url(#openArrow)"/>
  <text x="885" y="1915" class="msg">6.7: clearedChallenge</text>

  <line x1="673" y1="1988" x2="1297" y2="1988" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="684" y="1966" class="msg">6.8: updateMany({ userId, isRevoked: false },</text>
  <text x="716" y="1983" class="msg">{ isRevoked: true })</text>

  <line x1="1297" y1="2030" x2="673" y2="2030" class="ret" marker-end="url(#openArrow)"/>
  <text x="990" y="2021" class="msg">6.9: revokedSessions</text>

  <line x1="657" y1="2092" x2="368" y2="2092" class="ret" marker-end="url(#openArrow)"/>
  <text x="410" y="2083" class="msg">6.10: { message }</text>

  <path d="M 368 2116 L 414 2116 L 414 2140 L 374 2140" class="arrow" marker-end="url(#solidArrow)"/>
  <text x="424" y="2134" class="msg">6.11: showToast("Đổi mật khẩu thành công") &amp; navigateToLogin()</text>
</svg>
"""

svg_path = OUT_DIR / "seq_quen_mat_khau.svg"
png_path = OUT_DIR / "seq_quen_mat_khau.png"
svg_path.write_text(SVG, encoding="utf-8")

html_path = OUT_DIR / "seq_quen_mat_khau.html"
html_path.write_text(f'<!DOCTYPE html><html><body style="margin:0;background:#fff;">{SVG}</body></html>', encoding="utf-8")

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
    page = browser.new_page(viewport={"width": 1540, "height": 2260}, device_scale_factor=2)
    page.goto(html_path.as_uri(), wait_until="networkidle")
    page.locator("svg").screenshot(path=str(png_path))
    browser.close()

print("Rendered:", png_path)
