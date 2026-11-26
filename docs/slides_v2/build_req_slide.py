import base64
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(r"d:\HTTT18B\KLTN\NovaCare")
OUT_DIR = ROOT / "docs" / "slides_v2"
ASSETS_DIR = OUT_DIR / "assets"

def b64(path: Path) -> str:
    data = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/png;base64,{data}"

IUH_LOGO = b64(ASSETS_DIR / "iuh_logo_transparent.png")

HTML = f"""<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<style>
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{
  font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  background: #111;
  color: #0F2922;
  -webkit-font-smoothing: antialiased;
}}
.slide {{
  width: 1920px;
  height: 1080px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #DDF7EB 0%, #EBFBF3 55%, #D8F5E8 100%);
  padding: 42px 64px 70px 84px;
  display: flex;
  flex-direction: column;
}}
.slide::before {{
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 16px;
  background: linear-gradient(180deg, #065F46 0%, #059669 55%, #10B981 100%);
}}
.slide-header {{
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
  border-bottom: 1.5px solid rgba(6, 95, 70, 0.12);
  padding-bottom: 12px;
}}
.kicker {{
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 2.2px;
  color: #059669;
  text-transform: uppercase;
  margin-bottom: 5px;
}}
.slide-title {{
  font-size: 38px;
  font-weight: 800;
  color: #0D2A24;
  line-height: 1.15;
  letter-spacing: -0.4px;
}}
.slide-subtitle {{
  font-size: 18px;
  color: #47645C;
  margin-top: 5px;
  font-weight: 500;
}}
.iuh-logo {{
  height: 60px;
  object-fit: contain;
  margin-left: 24px;
}}
.slide-footer {{
  position: absolute;
  left: 84px;
  right: 64px;
  bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13.5px;
  font-weight: 600;
  color: #4E6B63;
}}
.col-label {{
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 1.6px;
  color: #065F46;
  text-transform: uppercase;
  margin-bottom: 10px;
}}
.ev-card {{
  background: #FFFFFF;
  border-radius: 18px;
  border: 1.5px solid rgba(16, 185, 129, 0.18);
  box-shadow: 0 6px 18px rgba(6, 78, 59, 0.05);
  padding: 16px 20px;
  display: flex;
  gap: 18px;
  align-items: center;
  flex: 1;
}}
.ev-card.featured {{
  border: 2.2px solid #059669;
  background: linear-gradient(90deg, #FFFFFF 0%, #F2FDF8 100%);
  box-shadow: 0 10px 24px rgba(5, 150, 105, 0.12);
}}
.metric-box {{
  width: 148px;
  flex-shrink: 0;
  border-left: 5px solid #059669;
  padding-left: 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}}
.metric-box.dark {{
  border-left-color: #064E3B;
}}
.metric-val {{
  font-size: 32px;
  font-weight: 900;
  color: #065F46;
  line-height: 1.05;
}}
.metric-sub {{
  font-size: 13px;
  font-weight: 700;
  color: #64748B;
  margin-top: 3px;
}}
.ev-body {{
  flex: 1;
}}
.ev-title {{
  font-size: 18px;
  font-weight: 800;
  color: #0D2A24;
  display: flex;
  align-items: center;
  gap: 8px;
}}
.ev-desc {{
  font-size: 14.5px;
  color: #334155;
  margin-top: 4px;
  line-height: 1.42;
}}
.ev-cite {{
  font-size: 12.5px;
  color: #047857;
  font-weight: 700;
  margin-top: 5px;
}}
.req-panel {{
  background: #FFFFFF;
  border-radius: 20px;
  border: 1.5px solid rgba(16, 185, 129, 0.22);
  box-shadow: 0 8px 24px rgba(6, 78, 59, 0.06);
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}}
.req-item {{
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  padding: 13px 16px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  flex: 1;
}}
.req-item.featured {{
  background: #ECFDF5;
  border: 1.5px solid #A7F3D0;
}}
.num {{
  width: 34px; height: 34px;
  border-radius: 10px;
  background: #065F46;
  color: #FFFFFF;
  font-weight: 900;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}}
.pill {{
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}}
.pill-green {{ background: #DCFCE7; color: #065F46; border: 1px solid #A7F3D0; }}
.pill-dark {{ background: #064E3B; color: #FFFFFF; }}
.bottom-bar {{
  margin-top: 16px;
  background: #064E3B;
  color: #FFFFFF;
  border-radius: 14px;
  padding: 13px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16.5px;
  font-weight: 700;
}}
</style>
</head>
<body>
<div class="slide" id="slide-req">
  <div class="slide-header">
    <div>
      <div class="kicker">01 / THU THẬP &amp; CƠ SỞ YÊU CẦU</div>
      <h1 class="slide-title">Bằng chứng nghiên cứu khoa học → Yêu cầu hệ thống NovaCare</h1>
      <div class="slide-subtitle">Đối chiếu tài liệu thứ cấp quốc tế (Nature npj, JMIR, BMC, EJPC) cho cả 4 trụ cột: Đặt lịch · AI Sàng lọc · Camera PPG · Hồ sơ &amp; Bảo mật</div>
    </div>
    <img src="{IUH_LOGO}" class="iuh-logo" alt="IUH" />
  </div>

  <div style="flex:1; display:grid; grid-template-columns: 1.32fr 0.92fr; gap:24px; min-height:0;">
    <!-- Left Column: 4 Scientific Evidence Cards -->
    <div style="display:flex; flex-direction:column; min-height:0;">
      <div class="col-label">Cơ sở bằng chứng từ nghiên cứu đã công bố</div>
      <div style="flex:1; display:flex; flex-direction:column; gap:13px;">

        <!-- Evidence 1 (AI Triage - FEATURED) -->
        <div class="ev-card featured">
          <div class="metric-box dark">
            <div class="metric-val">19–38%</div>
            <div class="metric-sub">Chẩn đoán đơn lẻ<br/>vs ~90% phân luồng</div>
          </div>
          <div class="ev-body">
            <div class="ev-title">
              <span>★ Tổng quan hệ thống công cụ sàng lọc triệu chứng AI</span>
              <span class="pill pill-green">Trọng tâm AI</span>
            </div>
            <div class="ev-desc">
              AI chẩn đoán đơn thuần có độ chính xác thấp nhưng <strong>phân luồng chuyên khoa hiệu quả hơn rõ rệt</strong>; cần kiểm soát chặt an toàn cho ca khẩn cấp (Red Flag).
            </div>
            <div class="ev-cite">[1] Wallace et al. · npj Digital Medicine (Nature, 2022) &nbsp;|&nbsp; Riboli-Sasco et al. · JMIR (2023)</div>
          </div>
        </div>

        <!-- Evidence 2 (Camera PPG) -->
        <div class="ev-card">
          <div class="metric-box">
            <div class="metric-val">r ≥ 0.96</div>
            <div class="metric-sub">MAE ~2.0 BPM<br/>(108 bệnh nhân)</div>
          </div>
          <div class="ev-body">
            <div class="ev-title">Phân tích gộp &amp; kiểm chứng Camera PPG trên smartphone</div>
            <div class="ev-desc">
              <strong>Contact PPG</strong> (ngón tay trên camera sau + flash) tương quan rất cao với ECG, vượt trội rPPG khuôn mặt (MAE 7–8 BPM), nhưng cần bộ lọc nhiễu chuyển động &amp; phơi sáng.
            </div>
            <div class="ev-cite">[2] De Ridder et al. · JMIR Cardio (2018) &nbsp;|&nbsp; Coppetti et al. · Eur. J. Prev. Cardiol. (2017)</div>
          </div>
        </div>

        <!-- Evidence 3 (Appointment Booking) -->
        <div class="ev-card">
          <div class="metric-box">
            <div class="metric-val">36</div>
            <div class="metric-sub">bên liên quan<br/>(18 BN · 8 BS · 10 QL)</div>
          </div>
          <div class="ev-body">
            <div class="ev-title">Nghiên cứu định tính hệ thống đặt lịch khám điện tử</div>
            <div class="ev-desc">
              Chỉ ra các điểm nghẽn thực tế: <strong>lệch lịch hẹn với ca trực bác sĩ</strong>, quá tải trùng suất khám và thiếu liên thông dữ liệu giữa các kênh đặt lịch.
            </div>
            <div class="ev-cite">[3] BMC Health Services Research (2025) · doi:10.1186/s12913-025-12289-5</div>
          </div>
        </div>

        <!-- Evidence 4 (Virtual Clinic & Patient Portals) -->
        <div class="ev-card">
          <div class="metric-box">
            <div class="metric-val">3 + 5</div>
            <div class="metric-sub">Nhóm chức năng &amp;<br/>phi chức năng</div>
          </div>
          <div class="ev-body">
            <div class="ev-title">Tổng quan yêu cầu phòng khám số &amp; cổng bệnh nhân</div>
            <div class="ev-desc">
              Xác định 3 trụ chức năng (Hồ sơ, EMR, Giao diện trao đổi) &amp; 5 yêu cầu phi chức năng (Dễ dùng, Tiếp cận, Đa nền tảng, Hiệu năng, <strong>Bảo mật dữ liệu y tế PHI</strong>).
            </div>
            <div class="ev-cite">[4] Parsaei et al. · Int. J. Telemed. Appl. (2024) &nbsp;|&nbsp; Antonio et al. · JMIR (2020)</div>
          </div>
        </div>

      </div>
    </div>

    <!-- Right Column: Mapped NovaCare Requirements -->
    <div style="display:flex; flex-direction:column; min-height:0;">
      <div class="col-label">Ánh xạ sang 4 nhóm yêu cầu thiết kế NovaCare</div>
      <div class="req-panel">
        <div class="req-item featured">
          <div class="num">01</div>
          <div>
            <div style="font-size:17px; font-weight:900; color:#064E3B;">AI Sàng lọc Safety-First &amp; Định hướng khoa <span style="font-size:13px; color:#059669;">[1]</span></div>
            <div style="font-size:14.5px; color:#2C4A42; margin-top:4px; line-height:1.45;">
              Đa phương thức (34 vùng 3D · 120 câu hỏi); <strong>Red Flag Engine 0ms</strong> gọi 115; <strong>Hybrid RAG + kiểm chứng trích dẫn</strong> chống ảo giác; không thay chẩn đoán bác sĩ.
            </div>
          </div>
        </div>

        <div class="req-item">
          <div class="num">02</div>
          <div>
            <div style="font-size:17px; font-weight:800; color:#0D2A24;">Sinh hiệu Camera PPG có cổng chất lượng <span style="font-size:13px; color:#059669;">[2]</span></div>
            <div style="font-size:14.5px; color:#475569; margin-top:4px; line-height:1.45;">
              Dùng <strong>Contact PPG (Camera2 + Flash)</strong> kèm khử trôi EMA &amp; bộ lọc ổn định RR (≥20s); tự loại tín hiệu nhiễu, không gây báo động giả.
            </div>
          </div>
        </div>

        <div class="req-item">
          <div class="num">03</div>
          <div>
            <div style="font-size:17px; font-weight:800; color:#0D2A24;">Đặt lịch đồng bộ ca trực &amp; Thanh toán số <span style="font-size:13px; color:#059669;">[3]</span></div>
            <div style="font-size:14.5px; color:#475569; margin-top:4px; line-height:1.45;">
              Đồng bộ lịch bác sĩ/CSYT, <strong>Redis TTL 10–15p</strong> chống overbooking, thanh toán VNPAY 2.1.0 &amp; cổng đồng bộ HIS chuẩn REST/JSON.
            </div>
          </div>
        </div>

        <div class="req-item">
          <div class="num">04</div>
          <div>
            <div style="font-size:17px; font-weight:800; color:#0D2A24;">Hồ sơ liên thông, Tư vấn &amp; Bảo mật PHI <span style="font-size:13px; color:#059669;">[4]</span></div>
            <div style="font-size:14.5px; color:#475569; margin-top:4px; line-height:1.45;">
              Đa nền tảng (Web + 2 App Android), <strong>Consent cấp/thu hồi quyền xem bệnh án</strong>, tư vấn LiveKit, bảo mật JWT + Argon2 + RBAC cô lập <code>hospitalId</code>.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom Result Strip -->
  <div class="bottom-bar">
    <div><span style="color:#6EE7B7;">ĐẦU RA PHÂN TÍCH YÊU CẦU:</span> &nbsp;4 nhóm tác nhân chính &nbsp;•&nbsp; 30 Modules API &nbsp;•&nbsp; 53 bảng CSDL &nbsp;•&nbsp; Yêu cầu chức năng &amp; phi chức năng chuẩn y tế số</div>
    <span class="pill pill-green" style="font-size:13px;">4 nguồn quốc tế peer-reviewed</span>
  </div>

  <div class="slide-footer">
    <div>Nguồn: [1] doi:10.1038/s41746-022-00667-w; 10.2196/43803 &nbsp; [2] doi:10.2196/cardio.8802; 10.1177/2047487317702044 &nbsp; [3] doi:10.1186/s12913-025-12289-5 &nbsp; [4] doi:10.1155/2024/7800321; 10.2196/23851</div>
    <div style="color:#065F46; font-weight:800;">THU THẬP YÊU CẦU</div>
  </div>
</div>
</body>
</html>
"""

html_path = OUT_DIR / "slide_req.html"
png_path = OUT_DIR / "slide_req.png"
html_path.write_text(HTML, encoding="utf-8")

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
    page = browser.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
    page.goto(html_path.as_uri(), wait_until="networkidle")
    page.locator("#slide-req").screenshot(path=str(png_path))
    browser.close()
print("Rendered:", png_path)
