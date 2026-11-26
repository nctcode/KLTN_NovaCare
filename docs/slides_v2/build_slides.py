import base64
import os
from pathlib import Path
from PIL import Image
from pptx import Presentation
from pptx.util import Inches
from playwright.sync_api import sync_playwright

ROOT = Path(r"d:\HTTT18B\KLTN\NovaCare")
OUT_DIR = ROOT / "docs" / "slides_v2"
ASSETS_DIR = OUT_DIR / "assets"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def b64(path: Path) -> str:
    ext = path.suffix.lower().lstrip(".")
    mime = "image/jpeg" if ext in ("jpg", "jpeg") else f"image/{ext}"
    data = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{data}"


IUH_LOGO = b64(ASSETS_DIR / "iuh_logo_transparent.png")
NOVACARE_WHITE = b64(ROOT / "nova-care-web" / "public" / "novacare-logo-white.png")
NOVACARE_COLOR = b64(ROOT / "nova-care-web" / "public" / "novacare-logo.png")
IMG_QUEUE = b64(ASSETS_DIR / "p3_img_0.png")
IMG_TELE = b64(ASSETS_DIR / "p3_img_1.png")
IMG_BP = b64(ASSETS_DIR / "p3_img_2.png")
IMG_WRONG_SPEC = b64(ASSETS_DIR / "p3_img_3.png")

TOTAL = 12


def footer_html(num: int) -> str:
    return f"""
    <div class="slide-footer">
      <div class="footer-left">NOVACARE / KHÓA LUẬN TỐT NGHIỆP · 2026</div>
      <div class="footer-right">{num:02d} / {TOTAL:02d}</div>
    </div>
    """


def header_html(kicker: str, title: str, subtitle: str = "") -> str:
    sub = f'<div class="slide-subtitle">{subtitle}</div>' if subtitle else ""
    return f"""
    <div class="slide-header">
      <div class="header-text">
        <div class="kicker">{kicker}</div>
        <h1 class="slide-title">{title}</h1>
        {sub}
      </div>
      <img src="{IUH_LOGO}" class="iuh-logo" alt="IUH" />
    </div>
    """


SLIDE_CSS = """
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  background: #111;
  color: #0F2922;
  -webkit-font-smoothing: antialiased;
}
.slide {
  width: 1920px;
  height: 1080px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #DDF7EB 0%, #EBFBF3 55%, #D8F5E8 100%);
  padding: 44px 66px 72px 84px;
  display: flex;
  flex-direction: column;
}
.slide::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 16px;
  background: linear-gradient(180deg, #065F46 0%, #059669 55%, #10B981 100%);
}
.slide.dark {
  background: #172736;
  color: #FFFFFF;
  padding: 64px 96px;
}
.slide.dark::before {
  width: 18px;
  background: #0EA76B;
}

/* Header */
.slide-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 22px;
  border-bottom: 1.5px solid rgba(6, 95, 70, 0.12);
  padding-bottom: 14px;
}
.kicker {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 2.2px;
  color: #059669;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.slide-title {
  font-size: 40px;
  font-weight: 800;
  color: #0D2A24;
  line-height: 1.15;
  letter-spacing: -0.4px;
}
.slide-subtitle {
  font-size: 19px;
  color: #47645C;
  margin-top: 6px;
  font-weight: 500;
}
.iuh-logo {
  height: 62px;
  object-fit: contain;
  margin-left: 24px;
}

/* Footer */
.slide-footer {
  position: absolute;
  left: 84px;
  right: 66px;
  bottom: 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  font-weight: 700;
  color: #5C7B72;
  letter-spacing: 0.8px;
}
.footer-right {
  color: #065F46;
  font-weight: 800;
}

/* Cards & Common */
.card {
  background: #FFFFFF;
  border-radius: 20px;
  border: 1.5px solid rgba(16, 185, 129, 0.16);
  box-shadow: 0 8px 24px rgba(6, 78, 59, 0.06);
  padding: 22px 26px;
}
.card-highlight {
  background: #FFFFFF;
  border-radius: 20px;
  border: 2.5px solid #059669;
  box-shadow: 0 12px 28px rgba(5, 150, 105, 0.14);
  padding: 22px 26px;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
}
.pill-green { background: #DCFCE7; color: #065F46; border: 1px solid #A7F3D0; }
.pill-dark { background: #064E3B; color: #FFFFFF; }
.pill-red { background: #FEE2E2; color: #B91C1C; border: 1px solid #FECACA; }
.pill-amber { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
.pill-blue { background: #E0F2FE; color: #0369A1; border: 1px solid #BAE6FD; }
.pill-slate { background: #F1F5F9; color: #334155; border: 1px solid #CBD5E1; }

.bottom-strip {
  margin-top: auto;
  background: rgba(255, 255, 255, 0.86);
  border: 1.5px solid rgba(5, 150, 105, 0.25);
  border-radius: 16px;
  padding: 14px 26px;
  text-align: center;
  font-size: 19px;
  font-weight: 800;
  color: #065F46;
}
.num-badge {
  width: 38px; height: 38px;
  border-radius: 12px;
  background: #DCFCE7;
  color: #065F46;
  font-weight: 800;
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.num-badge-dark {
  width: 38px; height: 38px;
  border-radius: 12px;
  background: #065F46;
  color: #FFFFFF;
  font-weight: 800;
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.content-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 0;
}
"""

# =====================================================================
# SLIDE 1: COVER
# =====================================================================
SLIDE_01 = f"""
<div class="slide dark" id="slide-01">
  <!-- Right emerald geometric chevrons -->
  <svg style="position:absolute; right:0; top:0; height:1080px; width:620px; pointer-events:none;" viewBox="0 0 620 1080" fill="none">
    <polygon points="180,0 380,0 620,540 380,1080 180,1080 420,540" fill="#10B981" fill-opacity="0.72"/>
    <polygon points="90,40 260,40 480,540 260,1040 90,1040 310,540" fill="#059669" fill-opacity="0.45"/>
    <polygon points="320,0 620,0 620,1080 320,1080 560,540" fill="#047857" fill-opacity="0.28"/>
  </svg>

  <div style="position:relative; z-index:2; display:flex; flex-direction:column; height:100%;">
    <!-- Top IUH pill -->
    <div style="display:inline-flex; align-items:center; gap:20px; background:#FFFFFF; padding:10px 14px 10px 22px; border-radius:22px; width:fit-content; box-shadow:0 8px 24px rgba(0,0,0,0.22);">
      <img src="{IUH_LOGO}" style="height:48px; object-fit:contain;" alt="IUH" />
      <div style="background:#172736; color:#FFFFFF; font-weight:800; font-size:17px; letter-spacing:1.4px; padding:12px 22px; border-radius:14px;">
        KHÓA LUẬN TỐT NGHIỆP · 2026
      </div>
    </div>

    <!-- NovaCare Logo -->
    <div style="margin-top:68px; margin-bottom:24px;">
      <img src="{NOVACARE_WHITE}" style="height:104px; object-fit:contain;" alt="NovaCare" />
      <div style="width:168px; height:8px; background:#10B981; border-radius:99px; margin-top:20px;"></div>
    </div>

    <!-- Main Title -->
    <div style="max-width:1180px;">
      <h1 style="font-size:60px; font-weight:900; line-height:1.18; color:#FFFFFF; letter-spacing:-0.8px;">
        XÂY DỰNG NỀN TẢNG ĐẶT LỊCH KHÁM<br/>
        HỖ TRỢ CHẨN ĐOÁN BAN ĐẦU<br/>
        VỚI ĐA TRIỆU CHỨNG
      </h1>
      <p style="font-size:27px; color:#A7C7BE; margin-top:24px; font-weight:500; line-height:1.4;">
        NovaCare: A Digital Healthcare Platform Integrating<br/>
        Multimodal AI Pre-Screening &amp; Camera-Based PPG
      </p>
    </div>

    <!-- Key Highlights Badges -->
    <div style="display:flex; gap:14px; margin-top:34px; flex-wrap:wrap;">
      <span style="background:rgba(16,185,129,0.18); border:1.5px solid rgba(52,211,153,0.45); color:#6EE7B7; padding:9px 18px; border-radius:999px; font-size:16px; font-weight:700;">★ AI Sàng lọc đa phương thức &amp; Safety-First</span>
      <span style="background:rgba(255,255,255,0.08); border:1.5px solid rgba(255,255,255,0.2); color:#E2E8F0; padding:9px 18px; border-radius:999px; font-size:16px; font-weight:600;">Camera PPG Nhịp tim</span>
      <span style="background:rgba(255,255,255,0.08); border:1.5px solid rgba(255,255,255,0.2); color:#E2E8F0; padding:9px 18px; border-radius:999px; font-size:16px; font-weight:600;">Web + 2 Mobile Apps</span>
      <span style="background:rgba(255,255,255,0.08); border:1.5px solid rgba(255,255,255,0.2); color:#E2E8F0; padding:9px 18px; border-radius:999px; font-size:16px; font-weight:600;">Telemedicine &amp; Chia sẻ EMR</span>
    </div>

    <!-- Bottom Author Block -->
    <div style="margin-top:auto; border-top:1.5px solid rgba(255,255,255,0.16); padding-top:26px; max-width:1180px;">
      <div style="font-size:24px; font-weight:800; color:#FFFFFF; letter-spacing:0.6px;">
        NGUYỄN CHÍ THUẬN · 22685781 &nbsp;&nbsp;|&nbsp;&nbsp; TRỊNH VĂN VŨ · 22685821
      </div>
      <div style="font-size:20px; color:#9FB8B1; margin-top:10px; font-weight:500;">
        GVHD: <strong style="color:#E2F8EE;">ThS. Huỳnh Nam</strong> &nbsp;•&nbsp; Trường Đại học Công nghiệp TP.HCM – Khoa Công nghệ Thông tin
      </div>
    </div>
  </div>
</div>
"""

# =====================================================================
# SLIDE 2: AGENDA (5 CONCISE SECTIONS FOR 15-20 MIN WITH DEMO)
# =====================================================================
SLIDE_02 = f"""
<div class="slide" id="slide-02">
  {header_html("NỘI DUNG TRÌNH BÀY", "Mục lục thuyết trình", "Cấu trúc tinh gọn 5 phần (15–20 phút bao gồm Live Demo) · Trọng tâm vào AI sàng lọc gợi ý chuyên khoa")}
  <div class="content-body" style="justify-content:center; gap:22px;">
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:22px;">
      <div class="card" style="display:flex; gap:18px; align-items:flex-start; padding:26px 28px;">
        <div class="num-badge">01</div>
        <div>
          <div style="font-size:24px; font-weight:800; color:#0D2A24;">Bối cảnh &amp; Điểm nghẽn thực tiễn</div>
          <div style="font-size:17px; color:#526E66; margin-top:6px; line-height:1.45;">
            4 vấn đề trong quy trình khám bệnh hiện nay, đặc biệt là <strong>chọn sai chuyên khoa</strong> và thiếu dữ liệu tiền khám.
          </div>
          <div style="margin-top:10px;"><span class="pill pill-slate">Slide 03 · ~1 phút</span></div>
        </div>
      </div>

      <div class="card" style="display:flex; gap:18px; align-items:flex-start; padding:26px 28px;">
        <div class="num-badge">02</div>
        <div>
          <div style="font-size:24px; font-weight:800; color:#0D2A24;">Tổng quan &amp; Kiến trúc hệ thống</div>
          <div style="font-size:17px; color:#526E66; margin-top:6px; line-height:1.45;">
            3 tuyến nghiệp vụ giá trị, kiến trúc phân tầng Web + 2 Mobile Apps, <strong>53 bảng dữ liệu</strong> &amp; bảo mật RBAC.
          </div>
          <div style="margin-top:10px;"><span class="pill pill-slate">Slide 04–05 · ~2.5 phút</span></div>
        </div>
      </div>
    </div>

    <!-- Center Highlight Section 03 -->
    <div class="card-highlight" style="display:flex; gap:22px; align-items:center; padding:28px 32px; background:linear-gradient(90deg, #FFFFFF 0%, #F0FDF7 100%);">
      <div class="num-badge-dark" style="width:52px; height:52px; font-size:22px;">03</div>
      <div style="flex:1;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:27px; font-weight:900; color:#064E3B;">★ Trọng tâm: AI Sàng lọc gợi ý chuyên khoa &amp; Camera PPG</span>
          <span class="pill pill-green">Điểm nổi bật cốt lõi</span>
        </div>
        <div style="font-size:18px; color:#33544B; margin-top:8px; line-height:1.5;">
          Sàng lọc đa phương thức (<strong>Text · Voice · Ảnh · 34 vùng 3D · PPG</strong>) → <strong>Red Flag Engine 0ms</strong> → <strong>120 câu hỏi khu trú</strong> → <strong>Hybrid RAG chứng cứ &amp; kiểm chứng chống ảo giác</strong> → Giải thuật nhịp tim Camera PPG.
        </div>
      </div>
      <div style="text-align:right; flex-shrink:0;">
        <span class="pill pill-dark" style="font-size:15px; padding:8px 16px;">Slide 06–08 · ~4.5 phút</span>
      </div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:22px;">
      <div class="card" style="display:flex; gap:18px; align-items:flex-start; padding:26px 28px;">
        <div class="num-badge">04</div>
        <div>
          <div style="font-size:24px; font-weight:800; color:#0D2A24;">Thực nghiệm &amp; Đánh giá định lượng</div>
          <div style="font-size:17px; color:#526E66; margin-top:6px; line-height:1.45;">
            Kiểm thử <strong>106 test case AI v3.1</strong> (10/10 kịch bản quy tắc) &amp; đối chuẩn PPG thiết bị y tế <strong>Contec CMS50-Pro</strong>.
          </div>
          <div style="margin-top:10px;"><span class="pill pill-slate">Slide 09 · ~1.5 phút</span></div>
        </div>
      </div>

      <div class="card" style="display:flex; gap:18px; align-items:flex-start; padding:26px 28px;">
        <div class="num-badge">05</div>
        <div>
          <div style="font-size:24px; font-weight:800; color:#0D2A24;">Live Demo xuyên suốt &amp; Kết luận</div>
          <div style="font-size:17px; color:#526E66; margin-top:6px; line-height:1.45;">
            Trình diễn thực tế trên <strong>App Bệnh nhân → App Bác sĩ → Web Portal</strong>, tổng kết kết quả &amp; hướng phát triển.
          </div>
          <div style="margin-top:10px;"><span class="pill pill-green">Slide 10–12 · ~7.5 phút (gồm Demo)</span></div>
        </div>
      </div>
    </div>

    <div class="bottom-strip">
      Bối cảnh &nbsp;→&nbsp; Kiến trúc &nbsp;→&nbsp; <span style="color:#047857; text-decoration:underline;">★ AI Sàng lọc đa phương thức &amp; PPG</span> &nbsp;→&nbsp; Kiểm thử &nbsp;→&nbsp; Live Demo thực tế
    </div>
  </div>
  {footer_html(2)}
</div>
"""

# =====================================================================
# SLIDE 3: PROBLEM STATEMENT
# =====================================================================
SLIDE_03 = f"""
<div class="slide" id="slide-03">
  {header_html("01 / BỐI CẢNH VÀ VẤN ĐỀ", "Điểm nghẽn trong quy trình khám bệnh hiện nay", "Bốn vấn đề xuyên suốt từ bước tiền khám đến tư vấn từ xa — trọng tâm ở khâu định hướng chuyên khoa")}
  <div class="content-body">
    <div style="display:grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap:24px; flex:1;">
      <!-- Card 1 -->
      <div class="card" style="display:flex; gap:22px; align-items:center;">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
            <div class="num-badge">1</div>
            <div style="font-size:26px; font-weight:800; color:#0D2A24;">Tiếp đón thủ công</div>
          </div>
          <p style="font-size:19px; color:#4B635C; line-height:1.5;">
            Xếp hàng, lấy số thứ tự và kê khai giấy tại quầy làm kéo dài thời gian chờ đợi và quá tải khu vực tiếp nhận.
          </p>
        </div>
        <img src="{IMG_QUEUE}" style="width:360px; height:235px; object-fit:cover; border-radius:16px; border:1px solid #E2E8F0;" />
      </div>

      <!-- Card 2 (HIGHLIGHT) -->
      <div class="card-highlight" style="display:flex; gap:22px; align-items:center; background:linear-gradient(135deg,#FFFFFF 0%,#F0FDF7 100%);">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
            <div class="num-badge-dark">2</div>
            <div style="font-size:26px; font-weight:900; color:#064E3B;">Chọn sai chuyên khoa</div>
          </div>
          <div style="margin-bottom:10px;"><span class="pill pill-green">★ Vấn đề trọng tâm</span></div>
          <p style="font-size:19px; color:#2C4A42; line-height:1.5;">
            Người bệnh khó tự đánh giá đa triệu chứng, dễ đăng ký nhầm khoa hoặc chậm nhận diện dấu hiệu nguy hiểm cần cấp cứu.
          </p>
        </div>
        <img src="{IMG_WRONG_SPEC}" style="width:360px; height:235px; object-fit:cover; border-radius:16px; border:1.5px solid #A7F3D0;" />
      </div>

      <!-- Card 3 (HIGHLIGHT) -->
      <div class="card-highlight" style="display:flex; gap:22px; align-items:center; background:linear-gradient(135deg,#FFFFFF 0%,#F0FDF7 100%);">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
            <div class="num-badge-dark">3</div>
            <div style="font-size:26px; font-weight:900; color:#064E3B;">Thiếu dữ liệu tiền khám</div>
          </div>
          <div style="margin-bottom:10px;"><span class="pill pill-green">★ Vấn đề trọng tâm</span></div>
          <p style="font-size:19px; color:#2C4A42; line-height:1.5;">
            Lời kể triệu chứng, chỉ số nhịp tim và bệnh sử khám cũ chưa được tổng hợp nhất quán cho bác sĩ đọc trước buổi khám.
          </p>
        </div>
        <img src="{IMG_BP}" style="width:360px; height:235px; object-fit:cover; border-radius:16px; border:1.5px solid #A7F3D0;" />
      </div>

      <!-- Card 4 -->
      <div class="card" style="display:flex; gap:22px; align-items:center;">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
            <div class="num-badge">4</div>
            <div style="font-size:26px; font-weight:800; color:#0D2A24;">Rào cản chăm sóc liên thông</div>
          </div>
          <p style="font-size:19px; color:#4B635C; line-height:1.5;">
            Đặt hẹn, thanh toán, tư vấn trực tuyến và chia sẻ hồ sơ sức khỏe giữa các cơ sở còn rời rạc giữa nhiều kênh.
          </p>
        </div>
        <img src="{IMG_TELE}" style="width:360px; height:235px; object-fit:cover; border-radius:16px; border:1px solid #E2E8F0;" />
      </div>
    </div>

    <div class="bottom-strip">
      GIẢI PHÁP NOVACARE &nbsp;→&nbsp; AI Sàng lọc đa phương thức (Safety-First) &nbsp;+&nbsp; Camera PPG &nbsp;+&nbsp; Đặt khám &amp; VNPAY &nbsp;+&nbsp; Chia sẻ EMR &amp; Telemedicine
    </div>
  </div>
  {footer_html(3)}
</div>
"""

# =====================================================================
# SLIDE 4: 3 CORE VALUE WORKFLOWS + 4 ACTORS
# =====================================================================
SLIDE_04 = f"""
<div class="slide" id="slide-04">
  {header_html("02 / TỔNG QUAN HỆ THỐNG", "Ba tuyến nghiệp vụ cốt lõi tạo nên giá trị NovaCare", "Khép kín hành trình từ sàng lọc tiền khám an toàn đến đặt lịch, tư vấn và chia sẻ hồ sơ có kiểm soát")}
  <div class="content-body" style="flex-direction:row; gap:22px;">
    <!-- Left 3 Lanes -->
    <div style="flex:1; display:flex; flex-direction:column; gap:16px;">
      <!-- Lane 1 -->
      <div class="card-highlight" style="padding:20px 24px; background:linear-gradient(90deg,#FFFFFF 0%,#F2FDF7 100%);">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="num-badge-dark">01</div>
            <div style="font-size:22px; font-weight:900; color:#064E3B;">Sàng lọc tiền khám AI đa phương thức &amp; Rào chắn an toàn</div>
          </div>
          <span class="pill pill-green">★ Điểm nổi bật nhất</span>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="flex:1.15; background:#FFFFFF; border:1.5px solid #A7F3D0; border-radius:14px; padding:12px 14px;">
            <div style="font-size:15px; font-weight:800; color:#065F46;">Đầu vào đa kênh</div>
            <div style="font-size:14px; color:#475569; margin-top:4px;">Text · Voice (Whisper) · Ảnh (≤3) · 34 vùng 3D · PPG</div>
          </div>
          <div style="font-size:24px; color:#059669; font-weight:900;">→</div>
          <div style="flex:1; background:#FEF2F2; border:1.5px solid #FCA5A5; border-radius:14px; padding:12px 14px;">
            <div style="font-size:15px; font-weight:800; color:#B91C1C;">Red Flag Engine (0ms)</div>
            <div style="font-size:14px; color:#7F1D1D; margin-top:4px;">Nguy hiểm → <strong>Cấp cứu 115</strong> (ngắt đặt lịch)</div>
          </div>
          <div style="font-size:24px; color:#059669; font-weight:900;">→</div>
          <div style="flex:1.15; background:#FFFFFF; border:1.5px solid #A7F3D0; border-radius:14px; padding:12px 14px;">
            <div style="font-size:15px; font-weight:800; color:#065F46;">RAG + Kiểm chứng LLM</div>
            <div style="font-size:14px; color:#475569; margin-top:4px;">120 câu hỏi khu trú → Top chuyên khoa + Trích dẫn</div>
          </div>
        </div>
      </div>

      <!-- Lane 2 -->
      <div class="card" style="padding:20px 24px;">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">
          <div class="num-badge">02</div>
          <div style="font-size:22px; font-weight:800; color:#0D2A24;">Đặt lịch khám, Giữ chỗ chống trùng &amp; Thanh toán số</div>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="flex:1; background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:14px; padding:12px 14px;">
            <div style="font-size:15px; font-weight:800; color:#0F172A;">Chọn CSYT / Bác sĩ / Ca</div>
            <div style="font-size:14px; color:#475569; margin-top:4px;">Đặt theo chuyên khoa AI gợi ý hoặc theo dịch vụ</div>
          </div>
          <div style="font-size:22px; color:#059669; font-weight:900;">→</div>
          <div style="flex:1; background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:14px; padding:12px 14px;">
            <div style="font-size:15px; font-weight:800; color:#0F172A;">Redis TTL 10–15 phút</div>
            <div style="font-size:14px; color:#475569; margin-top:4px;">Giữ suất khám chống race condition / overbooking</div>
          </div>
          <div style="font-size:22px; color:#059669; font-weight:900;">→</div>
          <div style="flex:1; background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:14px; padding:12px 14px;">
            <div style="font-size:15px; font-weight:800; color:#0F172A;">Thanh toán &amp; Cấp QR</div>
            <div style="font-size:14px; color:#475569; margin-top:4px;">Tại cơ sở hoặc <strong>VNPAY Sandbox 2.1.0</strong> (IPN)</div>
          </div>
        </div>
      </div>

      <!-- Lane 3 -->
      <div class="card" style="padding:20px 24px;">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">
          <div class="num-badge">03</div>
          <div style="font-size:22px; font-weight:800; color:#0D2A24;">Khám tại viện, Tư vấn từ xa &amp; Chia sẻ hồ sơ bệnh án</div>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="flex:1; background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:14px; padding:12px 14px;">
            <div style="font-size:15px; font-weight:800; color:#0F172A;">App Bác sĩ đọc trước</div>
            <div style="font-size:14px; color:#475569; margin-top:4px;">Xem phiếu AI, nhịp tim PPG &amp; bệnh án chia sẻ</div>
          </div>
          <div style="font-size:22px; color:#059669; font-weight:900;">→</div>
          <div style="flex:1; background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:14px; padding:12px 14px;">
            <div style="font-size:15px; font-weight:800; color:#0F172A;">LiveKit Video &amp; Chat</div>
            <div style="font-size:14px; color:#475569; margin-top:4px;">Tư vấn trực tuyến WebRTC SFU + Socket.IO</div>
          </div>
          <div style="font-size:22px; color:#059669; font-weight:900;">→</div>
          <div style="flex:1; background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:14px; padding:12px 14px;">
            <div style="font-size:15px; font-weight:800; color:#0F172A;">Sổ sức khỏe &amp; Consent</div>
            <div style="font-size:14px; color:#475569; margin-top:4px;">Lưu đơn thuốc/chẩn đoán ICD, cấp &amp; thu hồi quyền</div>
          </div>
        </div>
      </div>

      <!-- Red flag footer callout -->
      <div style="background:#FEF2F2; border:1.5px solid #FECACA; border-radius:14px; padding:12px 20px; text-align:center; font-size:17px; font-weight:800; color:#B91C1C;">
        Nguyên tắc Safety-First: Khi phát hiện cờ đỏ (Red Flag) → Hệ thống hướng dẫn gọi 115 ngay, không tiếp tục đặt lịch khám thường
      </div>
    </div>

    <!-- Right Sidebar: 4 Actors & Pillars -->
    <div class="card" style="width:410px; display:flex; flex-direction:column; gap:14px; padding:24px;">
      <div style="font-size:21px; font-weight:900; color:#064E3B; border-bottom:1.5px solid #E2E8F0; padding-bottom:10px;">
        4 nhóm tác nhân chính
      </div>
      <div style="background:#ECFDF5; border:1px solid #A7F3D0; border-radius:14px; padding:13px 15px;">
        <div style="font-size:16px; font-weight:800; color:#065F46;">1. Bệnh nhân (Web &amp; Mobile App)</div>
        <div style="font-size:14px; color:#33544B; margin-top:3px;">Sàng lọc AI + PPG, đặt khám, thanh toán VNPAY, sổ sức khỏe &amp; chia sẻ bệnh án.</div>
      </div>
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:13px 15px;">
        <div style="font-size:16px; font-weight:800; color:#0F172A;">2. Bác sĩ (Web &amp; Doctor App)</div>
        <div style="font-size:14px; color:#475569; margin-top:3px;">Xem ca trực, phiếu sàng lọc AI, hồ sơ chia sẻ &amp; tư vấn video trực tuyến.</div>
      </div>
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:13px 15px;">
        <div style="font-size:16px; font-weight:800; color:#0F172A;">3. Quản trị cơ sở y tế</div>
        <div style="font-size:14px; color:#475569; margin-top:3px;">Quản lý chuyên khoa, bác sĩ, phòng khám, ca trực, lịch hẹn &amp; đồng bộ HIS.</div>
      </div>
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:13px 15px;">
        <div style="font-size:16px; font-weight:800; color:#0F172A;">4. Quản trị hệ thống</div>
        <div style="font-size:14px; color:#475569; margin-top:3px;">Duyệt hợp tác CSYT, phân quyền RBAC, kiểm duyệt đánh giá &amp; giám sát Audit Log.</div>
      </div>
      <div style="margin-top:auto; background:#064E3B; color:#FFFFFF; border-radius:14px; padding:14px 16px;">
        <div style="font-size:14px; font-weight:800; color:#6EE7B7; text-transform:uppercase;">Cam kết thiết kế</div>
        <div style="font-size:14.5px; margin-top:4px; line-height:1.45;">
          AI chỉ hỗ trợ định hướng chuyên khoa, <strong>không thay thế chẩn đoán của bác sĩ</strong>.
        </div>
      </div>
    </div>
  </div>
  {footer_html(4)}
</div>
"""

# =====================================================================
# SLIDE 5: SYSTEM ARCHITECTURE (ACCURATE TO ACTUAL REPO)
# =====================================================================
SLIDE_05 = f"""
<div class="slide" id="slide-05">
  {header_html("02 / KIẾN TRÚC HỆ THỐNG", "Kiến trúc phân tầng · Đa nền tảng & Bảo mật RBAC", "Đồng bộ 100% theo mã nguồn thực tế — triển khai Docker Compose trên VPS tại novacare-health.me")}
  <div class="content-body" style="flex-direction:row; gap:20px;">
    <!-- Left 4 Architectural Layers -->
    <div style="flex:1; display:flex; flex-direction:column; gap:14px;">
      <!-- Layer 1 -->
      <div class="card" style="flex:1; padding:18px 22px; display:flex; align-items:center; gap:18px;">
        <div style="width:205px; flex-shrink:0;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="num-badge-dark" style="width:32px;height:32px;font-size:15px;">1</div>
            <div style="font-size:17px; font-weight:800; color:#064E3B;">Presentation</div>
          </div>
          <div style="font-size:13px; color:#64748B; margin-top:4px;">Web Portal &amp; 2 Mobile Apps</div>
        </div>
        <div style="flex:1; display:grid; grid-template-columns:1.1fr 1fr; gap:12px;">
          <div style="background:#ECFDF5; border:1px solid #A7F3D0; border-radius:12px; padding:11px 14px;">
            <div style="font-size:15px; font-weight:800; color:#065F46;">Web Portal (Patient · Doctor · Admin)</div>
            <div style="font-size:13.5px; color:#33544B; margin-top:3px;"><strong>Next.js 16</strong> · React 19 · TypeScript · Tailwind v4 · <strong>Three.js 3D Body</strong></div>
          </div>
          <div style="background:#ECFDF5; border:1px solid #A7F3D0; border-radius:12px; padding:11px 14px;">
            <div style="font-size:15px; font-weight:800; color:#065F46;">2 Android Native Apps (Patient + Doctor)</div>
            <div style="font-size:13.5px; color:#33544B; margin-top:3px;"><strong>Kotlin</strong> · Jetpack Compose · Camera2 PPG · VNPAY WebView</div>
          </div>
        </div>
      </div>

      <!-- Layer 2 -->
      <div class="card" style="flex:1; padding:18px 22px; display:flex; align-items:center; gap:18px;">
        <div style="width:205px; flex-shrink:0;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="num-badge-dark" style="width:32px;height:32px;font-size:15px;">2</div>
            <div style="font-size:17px; font-weight:800; color:#064E3B;">Gateway &amp; Security</div>
          </div>
          <div style="font-size:13px; color:#64748B; margin-top:4px;">HTTPS · Auth · Multi-tenant</div>
        </div>
        <div style="flex:1; display:grid; grid-template-columns:repeat(4,1fr); gap:10px;">
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:10px 12px;">
            <div style="font-size:14.5px; font-weight:800; color:#0F172A;">Nginx + SSL</div>
            <div style="font-size:12.5px; color:#64748B; margin-top:2px;">Reverse Proxy · HTTPS (Let's Encrypt)</div>
          </div>
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:10px 12px;">
            <div style="font-size:14.5px; font-weight:800; color:#0F172A;">JWT + Argon2</div>
            <div style="font-size:12.5px; color:#64748B; margin-top:2px;">Access/Refresh Token · Băm mật khẩu</div>
          </div>
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:10px 12px;">
            <div style="font-size:14.5px; font-weight:800; color:#0F172A;">RBAC &amp; Isolation</div>
            <div style="font-size:12.5px; color:#64748B; margin-top:2px;">Cô lập dữ liệu theo <code>hospitalId</code></div>
          </div>
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:10px 12px;">
            <div style="font-size:14.5px; font-weight:800; color:#0F172A;">Consent &amp; Audit</div>
            <div style="font-size:12.5px; color:#64748B; margin-top:2px;">Nhật ký truy cập hồ sơ bệnh án</div>
          </div>
        </div>
      </div>

      <!-- Layer 3 -->
      <div class="card-highlight" style="flex:1.15; padding:18px 22px; display:flex; align-items:center; gap:18px;">
        <div style="width:205px; flex-shrink:0;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="num-badge-dark" style="width:32px;height:32px;font-size:15px;">3</div>
            <div style="font-size:17px; font-weight:800; color:#064E3B;">Application API</div>
          </div>
          <div style="font-size:13px; color:#059669; font-weight:700; margin-top:4px;">NestJS 11 · TypeScript</div>
        </div>
        <div style="flex:1; display:grid; grid-template-columns:1.35fr 1fr 1fr; gap:10px;">
          <div style="background:#064E3B; color:#FFFFFF; border-radius:12px; padding:12px 14px;">
            <div style="font-size:15px; font-weight:800; color:#6EE7B7;">★ AI Screening Orchestrator v3.1</div>
            <div style="font-size:13px; color:#E2F8EE; margin-top:4px; line-height:1.4;">
              Red Flag Engine · Whisper ASR · Vision · Hybrid RAG (Embeddings) · LLM Validator
            </div>
          </div>
          <div style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:12px; padding:12px 14px;">
            <div style="font-size:15px; font-weight:800; color:#0F172A;">Booking &amp; Payments</div>
            <div style="font-size:13px; color:#475569; margin-top:4px; line-height:1.4;">
              Slot Lock Redis TTL · VNPAY 2.1.0 IPN · BullMQ · HIS Smart Upsert
            </div>
          </div>
          <div style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:12px; padding:12px 14px;">
            <div style="font-size:15px; font-weight:800; color:#0F172A;">Telemedicine &amp; EMR</div>
            <div style="font-size:13px; color:#475569; margin-top:4px; line-height:1.4;">
              LiveKit Cloud WebRTC SFU · Socket.IO Chat · Medical Passport &amp; Push FCM
            </div>
          </div>
        </div>
      </div>

      <!-- Layer 4 -->
      <div class="card" style="flex:1; padding:18px 22px; display:flex; align-items:center; gap:18px;">
        <div style="width:205px; flex-shrink:0;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="num-badge-dark" style="width:32px;height:32px;font-size:15px;">4</div>
            <div style="font-size:17px; font-weight:800; color:#064E3B;">Data &amp; Deploy</div>
          </div>
          <div style="font-size:13px; color:#64748B; margin-top:4px;">Storage &amp; Container VPS</div>
        </div>
        <div style="flex:1; display:grid; grid-template-columns:1.2fr 1fr 1fr; gap:10px;">
          <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:12px; padding:11px 14px;">
            <div style="font-size:15px; font-weight:800; color:#1E40AF;">PostgreSQL 16 + Prisma 6</div>
            <div style="font-size:13.5px; color:#334155; margin-top:3px;"><strong>53 bảng dữ liệu</strong> (Lịch hẹn, AI, EMR, Consent, HIS)</div>
          </div>
          <div style="background:#FEF2F2; border:1px solid #FECACA; border-radius:12px; padding:11px 14px;">
            <div style="font-size:15px; font-weight:800; color:#991B1B;">Redis 7 (Alpine)</div>
            <div style="font-size:13.5px; color:#334155; margin-top:3px;">TTL Slot Lock · Cache · BullMQ Job Queue</div>
          </div>
          <div style="background:#ECFDF5; border:1px solid #A7F3D0; border-radius:12px; padding:11px 14px;">
            <div style="font-size:15px; font-weight:800; color:#065F46;">Docker Compose VPS</div>
            <div style="font-size:13.5px; color:#334155; margin-top:3px;">CloudFly Ubuntu · <code>novacare-health.me</code></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Pillar Highlights -->
    <div style="width:390px; display:flex; flex-direction:column; gap:14px;">
      <div class="card-highlight" style="flex:1; padding:20px;">
        <span class="pill pill-green">★ Core AI Engine</span>
        <div style="font-size:20px; font-weight:900; color:#064E3B; margin-top:10px;">AI Pre-Screening v3.1</div>
        <ul style="margin-top:10px; padding-left:18px; font-size:15px; color:#334155; line-height:1.65;">
          <li>Hỗ trợ <strong>5 kênh dữ liệu</strong> đa phương thức</li>
          <li><strong>Red Flag Engine</strong> ưu tiên an toàn 0ms</li>
          <li><strong>Hybrid RAG</strong> kiểm tra hash SHA-256</li>
          <li>Chống ảo giác qua trích dẫn bắt buộc</li>
        </ul>
      </div>
      <div class="card" style="flex:1; padding:20px;">
        <span class="pill pill-blue">Realtime &amp; Video</span>
        <div style="font-size:20px; font-weight:800; color:#0F172A; margin-top:10px;">Telemedicine &amp; Mobile</div>
        <ul style="margin-top:10px; padding-left:18px; font-size:15px; color:#475569; line-height:1.65;">
          <li>Gọi video WebRTC qua <strong>LiveKit Cloud</strong></li>
          <li>Nhắn tin realtime qua <strong>Socket.IO</strong></li>
          <li>2 App riêng tối ưu trải nghiệm <strong>Bệnh nhân</strong> &amp; <strong>Bác sĩ</strong></li>
        </ul>
      </div>
      <div class="card" style="padding:18px 20px; background:#064E3B; color:#FFFFFF;">
        <div style="font-size:14px; color:#6EE7B7; font-weight:800;">QUY MÔ MÃ NGUỒN</div>
        <div style="display:flex; justify-content:space-between; margin-top:10px; text-align:center;">
          <div><div style="font-size:28px;font-weight:900;">30</div><div style="font-size:12.5px;color:#D1FAE5;">Modules API</div></div>
          <div><div style="font-size:28px;font-weight:900;">53</div><div style="font-size:12.5px;color:#D1FAE5;">Bảng CSDL</div></div>
          <div><div style="font-size:28px;font-weight:900;">3</div><div style="font-size:12.5px;color:#D1FAE5;">Ứng dụng</div></div>
        </div>
      </div>
    </div>
  </div>
  {footer_html(5)}
</div>
"""

# =====================================================================
# SLIDE 6: ★ FOCUS 1 - MULTIMODAL AI PRE-SCREENING EXPERIENCE
# =====================================================================
SLIDE_06 = f"""
<div class="slide" id="slide-06">
  {header_html("03 / ★ TRỌNG TÂM · AI SÀNG LỌC GỢI Ý CHUYÊN KHOA (1/3)", "Sàng lọc tiền khám đa phương thức (Multimodal Input)", "Thu thập triệu chứng tự nhiên qua 5 kênh kết hợp bộ 34 vùng cơ thể & 120 câu hỏi khu trú theo lâm sàng")}
  <div class="content-body" style="gap:20px;">
    <!-- Top 5 Multimodal Input Cards -->
    <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:14px;">
      <div class="card" style="padding:18px 16px; border-top:5px solid #059669;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:28px;">📝</span>
          <span class="pill pill-green" style="font-size:12px;">Kênh 1</span>
        </div>
        <div style="font-size:18px; font-weight:800; color:#064E3B; margin-top:10px;">Mô tả văn bản</div>
        <div style="font-size:14px; color:#475569; margin-top:6px; line-height:1.45;">
          Trích xuất triệu chứng tự do tiếng Việt, tự động <strong>lọc câu phủ định</strong> và tiền sử gia đình.
        </div>
      </div>

      <div class="card" style="padding:18px 16px; border-top:5px solid #059669;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:28px;">🎙️</span>
          <span class="pill pill-green" style="font-size:12px;">Kênh 2</span>
        </div>
        <div style="font-size:18px; font-weight:800; color:#064E3B; margin-top:10px;">Giọng nói (Whisper)</div>
        <div style="font-size:14px; color:#475569; margin-top:6px; line-height:1.45;">
          Nhận diện giọng nói <code>whisper-1</code> tiếng Việt; <strong>bắt buộc xác nhận văn bản</strong> trước khi phân tích.
        </div>
      </div>

      <div class="card" style="padding:18px 16px; border-top:5px solid #059669;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:28px;">📷</span>
          <span class="pill pill-green" style="font-size:12px;">Kênh 3</span>
        </div>
        <div style="font-size:18px; font-weight:800; color:#064E3B; margin-top:10px;">Ảnh vùng tổn thương</div>
        <div style="font-size:14px; color:#475569; margin-top:6px; line-height:1.45;">
          Vision LLM (≤3 ảnh, 5MB), bắt buộc <code>mediaConsent</code>; lọc ảnh mờ, phân nhóm <strong>Da / Mắt / Họng</strong>.
        </div>
      </div>

      <div class="card" style="padding:18px 16px; border-top:5px solid #059669;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:28px;">🧍</span>
          <span class="pill pill-green" style="font-size:12px;">Kênh 4</span>
        </div>
        <div style="font-size:18px; font-weight:800; color:#064E3B; margin-top:10px;">Sơ đồ 34 vùng cơ thể</div>
        <div style="font-size:14px; color:#475569; margin-top:6px; line-height:1.45;">
          Mô hình <strong>3D Three.js</strong> (Web) &amp; sơ đồ Mobile; phát hiện mâu thuẫn vùng chọn (<code>REGION_CONFLICT</code>).
        </div>
      </div>

      <div class="card" style="padding:18px 16px; border-top:5px solid #059669;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:28px;">❤️</span>
          <span class="pill pill-green" style="font-size:12px;">Kênh 5</span>
        </div>
        <div style="font-size:18px; font-weight:800; color:#064E3B; margin-top:10px;">Nhịp tim Camera PPG</div>
        <div style="font-size:14px; color:#475569; margin-top:6px; line-height:1.45;">
          Đo quang học qua camera sau + flash (tùy chọn), gắn nhãn chất lượng <strong>GOOD / LOW</strong>.
        </div>
      </div>
    </div>

    <!-- Bottom: Interactive Case Walkthrough -->
    <div class="card-highlight" style="flex:1; padding:24px 28px; display:flex; flex-direction:column; gap:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="font-size:22px; font-weight:900; color:#064E3B;">Minh họa 1 phiên sàng lọc thực tế trên NovaCare</div>
        <div style="display:flex; gap:10px;">
          <span class="pill pill-green">Catalog: 34 vùng giải phẫu</span>
          <span class="pill pill-green">120 câu hỏi khu trú (12 câu Red Flag)</span>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1.1fr 0.1fr 1.15fr 0.1fr 1.25fr; align-items:stretch; flex:1; gap:6px;">
        <!-- Step A -->
        <div style="background:#F8FAFC; border:1.5px solid #CBD5E1; border-radius:16px; padding:20px 22px; display:flex; flex-direction:column; gap:14px;">
          <span class="pill pill-slate" style="width:fit-content; font-size:14.5px;">Bước 1 · Người bệnh nhập liệu</span>
          <div style="font-size:18px; font-weight:800; color:#0F172A;">Chọn vùng cơ thể: <span style="color:#059669;">Đầu / Hộp sọ</span></div>
          <div style="background:#FFFFFF; border:1.5px solid #E2E8F0; border-radius:14px; padding:16px; font-size:16.5px; color:#334155; font-style:italic; line-height:1.6;">
            “Tôi bị đau đầu một bên tái diễn, khó chịu với ánh sáng, cơn đau xuất hiện từ từ. Không yếu liệt, không sốt, không cứng cổ.”
          </div>
          <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px; padding:12px 14px; font-size:14.5px; color:#475569; line-height:1.5;">
            <strong>Dữ liệu đính kèm:</strong><br/>
            • Kênh văn bản / giọng nói đã xác nhận<br/>
            • Nhịp tim PPG đo tại chỗ (chất lượng đạt chuẩn)
          </div>
          <div style="display:flex; gap:8px; margin-top:auto; flex-wrap:wrap;">
            <span class="pill pill-green" style="font-size:14px;">PPG: 76 BPM (GOOD)</span>
            <span class="pill pill-slate" style="font-size:14px;">Tuổi: 30</span>
          </div>
        </div>

        <div style="display:flex; align-items:center; justify-content:center; font-size:34px; font-weight:900; color:#059669;">→</div>

        <!-- Step B -->
        <div style="background:#F8FAFC; border:1.5px solid #CBD5E1; border-radius:16px; padding:20px 22px; display:flex; flex-direction:column; gap:12px;">
          <span class="pill pill-blue" style="width:fit-content; font-size:14.5px;">Bước 2 · Hỏi đáp khu trú &amp; Kiểm tra</span>
          <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px; padding:12px 14px; font-size:15.5px; color:#334155; line-height:1.55;">
            <strong style="color:#DC2626;">Red Flag Check (head_q1):</strong><br/>
            Đau đầu đột ngột dữ dội như búa bổ? → <strong style="color:#059669;">Không (An toàn)</strong>
          </div>
          <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px; padding:12px 14px; font-size:15.5px; color:#334155; line-height:1.6;">
            • <strong>Vị trí đau:</strong> Nửa bên thái dương <span style="color:#059669;font-weight:700;">(+10đ Thần kinh)</span><br/>
            • <strong>Triệu chứng kèm:</strong> Sợ ánh sáng / buồn nôn <span style="color:#059669;font-weight:700;">(+15đ)</span><br/>
            • <strong>Lọc phủ định:</strong> Bỏ qua “yếu liệt, sốt” (<code>ABSENT</code>)
          </div>
          <div style="margin-top:auto; background:#E0F2FE; border-radius:10px; padding:10px 14px; font-size:14.5px; color:#0369A1; font-weight:800;">
            ✓ Khớp vùng cơ thể · Đủ dữ kiện dương tính để phân luồng
          </div>
        </div>

        <div style="display:flex; align-items:center; justify-content:center; font-size:34px; font-weight:900; color:#059669;">→</div>

        <!-- Step C -->
        <div style="background:linear-gradient(135deg,#064E3B 0%,#087F5B 100%); color:#FFFFFF; border-radius:16px; padding:22px 24px; display:flex; flex-direction:column; gap:12px;">
          <span style="background:rgba(255,255,255,0.18); color:#A7F3D0; padding:6px 14px; border-radius:999px; font-size:14px; font-weight:800; width:fit-content;">Bước 3 · Kết quả &amp; Kết nối đặt khám</span>
          <div style="margin-top:4px;">
            <div style="font-size:15px; color:#D1FAE5;">Chuyên khoa đề xuất hàng đầu</div>
            <div style="font-size:34px; font-weight:900; color:#FFFFFF; margin-top:2px;">Nội Thần kinh</div>
          </div>
          <div style="background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2); border-radius:12px; padding:14px 16px; font-size:15.5px; color:#E2F8EE; line-height:1.6;">
            • <strong>Mức độ:</strong> CONSULT (Khám chuyên khoa)<br/>
            • <strong>Giải thích:</strong> Tóm tắt triệu chứng làm căn cứ + trích dẫn nguồn y khoa<br/>
            • <strong>Kiểm tra CSYT:</strong> Khớp danh mục bệnh viện
          </div>
          <div style="margin-top:auto; background:#FFFFFF; color:#064E3B; border-radius:12px; padding:12px 16px; font-size:15.5px; font-weight:900; text-align:center;">
            1 chạm “Đặt lịch ngay” → Gửi phiếu AI sang App Bác sĩ
          </div>
        </div>
      </div>
    </div>
  </div>
  {footer_html(6)}
</div>
"""

# =====================================================================
# SLIDE 7: ★ FOCUS 2 - AI SAFETY-FIRST ORCHESTRATOR & HYBRID RAG (v3.1)
# =====================================================================
SLIDE_07 = f"""
<div class="slide" id="slide-07">
  {header_html("03 / ★ TRỌNG TÂM · AI SÀNG LỌC GỢI Ý CHUYÊN KHOA (2/3)", "Kiến trúc AI Safety-First, Hybrid RAG & Chống ảo giác (v3.1)", "Thiết kế lai (Hybrid Rules + RAG + LLM Validator) trong AiScreeningOrchestratorService nhằm đặt an toàn người bệnh lên số 1")}
  <div class="content-body" style="gap:16px;">
    <!-- 6-Stage Pipeline Grid (2 rows x 3 cols) -->
    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:18px; flex:1;">
      <!-- Stage 1 -->
      <div class="card" style="border:2px solid #EF4444; background:linear-gradient(180deg,#FEF2F2 0%,#FFFFFF 42%); padding:20px 22px; display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="pill pill-red">TẦNG 1 · ƯU TIÊN SỐ 1 (0ms)</span>
          <strong style="color:#DC2626; font-size:14px;">Chạy trước LLM</strong>
        </div>
        <div style="font-size:21px; font-weight:900; color:#991B1B;">Red Flag Engine (An toàn tuyệt đối)</div>
        <div style="font-size:15px; color:#334155; line-height:1.5;">
          Đánh giá tức thì <strong>6 bộ luật cờ đỏ</strong> + đau đầu sét đánh trong lời kể:
          <ul style="padding-left:18px; margin-top:4px;">
            <li>Hội chứng vành cấp · Đau ngực + Khó thở / Ngất</li>
            <li>Dấu hiệu đột quỵ (yếu liệt, nói khó, méo mặt)</li>
            <li>PPG &lt;40 hoặc &gt;140 BPM (<em>chỉ khi chất lượng GOOD</em>)</li>
            <li>Mức đau dữ dội ≥ 8/10</li>
          </ul>
        </div>
        <div style="margin-top:auto; background:#DC2626; color:#FFFFFF; border-radius:10px; padding:8px 12px; font-size:14px; font-weight:800;">
          → Ngắt luồng ngay · Cảnh báo gọi 115 (EMERGENCY_GUIDANCE)
        </div>
      </div>

      <!-- Stage 2 -->
      <div class="card" style="padding:20px 22px; display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="pill pill-amber">TẦNG 2 · CỔNG KIỂM SOÁT</span>
          <strong style="color:#92400E; font-size:14px;">Input Guardrails</strong>
        </div>
        <div style="font-size:21px; font-weight:900; color:#0D2A24;">Lọc ngữ cảnh &amp; Mâu thuẫn đầu vào</div>
        <div style="font-size:15px; color:#334155; line-height:1.55;">
          <ul style="padding-left:18px;">
            <li><strong>Giới hạn tuổi (&lt;18):</strong> Trả <code>REVIEW_REQUIRED</code>, khuyến nghị liên hệ cơ sở y tế.</li>
            <li><strong>Xung đột vùng đau:</strong> Kiểm tra lời kể vs sơ đồ cơ thể → <code>REGION_CONFLICT</code>.</li>
            <li><strong>Lọc phủ định &amp; tiền sử:</strong> Phát hiện <em>“không / chưa / tiền sử / người nhà”</em> để không gán nhầm triệu chứng dương tính.</li>
          </ul>
        </div>
        <div style="margin-top:auto; background:#FEF3C7; color:#92400E; border-radius:10px; padding:8px 12px; font-size:14px; font-weight:700;">
          → Đảm bảo đầu vào sạch &amp; nhất quán trước khi suy luận
        </div>
      </div>

      <!-- Stage 3 -->
      <div class="card" style="padding:20px 22px; display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="pill pill-green">TẦNG 3 · CHẤM ĐIỂM</span>
          <strong style="color:#065F46; font-size:14px;">Multi-engine</strong>
        </div>
        <div style="font-size:21px; font-weight:900; color:#0D2A24;">Trích xuất đặc trưng &amp; Xếp hạng</div>
        <div style="font-size:15px; color:#334155; line-height:1.55;">
          <ul style="padding-left:18px;">
            <li><code>ClinicalFeatureExtractor</code> chuẩn hóa triệu chứng từ Text, Voice, Ảnh, Q&amp;A.</li>
            <li><code>ClinicalPatternEngine</code> &amp; <code>rankSpecialties</code> chấm điểm theo dữ kiện dương tính.</li>
            <li>Rút gọn <strong>Top 3 ứng viên</strong> (điểm ≥ 20, phân tách rõ ≥ 10 điểm).</li>
          </ul>
        </div>
        <div style="margin-top:auto; background:#ECFDF5; color:#065F46; border-radius:10px; padding:8px 12px; font-size:14px; font-weight:700;">
          → Khống chế không gian tìm kiếm, ngăn LLM bịa chuyên khoa
        </div>
      </div>

      <!-- Stage 4 -->
      <div class="card" style="padding:20px 22px; display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="pill pill-blue">TẦNG 4 · TRI THỨC Y KHOA</span>
          <strong style="color:#0369A1; font-size:14px;">Hybrid RAG</strong>
        </div>
        <div style="font-size:21px; font-weight:900; color:#0D2A24;">Truy xuất chứng cứ có kiểm duyệt</div>
        <div style="font-size:15px; color:#334155; line-height:1.55;">
          <ul style="padding-left:18px;">
            <li>Kết hợp <strong>Vector Cosine</strong> (<code>text-embedding-3-small</code>, ngưỡng 0.30) + <strong>Lexical/Keyword</strong>.</li>
            <li>Mỗi đoạn tri thức phải đạt: <code>reviewStatus = APPROVED</code>, kiểm tra toàn vẹn <strong>SHA-256</strong>, còn hạn <code>expiresAt</code> &amp; có <code>routingCriteria</code>.</li>
          </ul>
        </div>
        <div style="margin-top:auto; background:#E0F2FE; color:#0369A1; border-radius:10px; padding:8px 12px; font-size:14px; font-weight:700;">
          → Chỉ viện dẫn nguồn y khoa hợp lệ, có URL truy vết
        </div>
      </div>

      <!-- Stage 5 -->
      <div class="card-highlight" style="padding:20px 22px; display:flex; flex-direction:column; gap:8px; background:linear-gradient(180deg,#ECFDF5 0%,#FFFFFF 45%);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="pill pill-dark">TẦNG 5 · CHỐNG ẢO GIÁC</span>
          <strong style="color:#065F46; font-size:14px;">Strict Validator</strong>
        </div>
        <div style="font-size:21px; font-weight:900; color:#064E3B;">Kiểm chứng đầu ra LLM (Anti-Hallucination)</div>
        <div style="font-size:15px; color:#334155; line-height:1.55;">
          <ul style="padding-left:18px;">
            <li>LLM chỉ được đề xuất trong shortlist và <strong>bắt buộc đính kèm <code>factIds</code> + <code>citationIds</code></strong>.</li>
            <li>Server tự đối chiếu <code>evidenceSupportsFacts()</code>.</li>
            <li>Nếu thiếu chứng cứ hoặc thiếu khoa trong DB → trả <code>ASK_MORE</code> / <code>CONTACT_FACILITY</code>, <strong>không ép chọn sai khoa</strong>.</li>
          </ul>
        </div>
        <div style="margin-top:auto; background:#064E3B; color:#FFFFFF; border-radius:10px; padding:8px 12px; font-size:14px; font-weight:700;">
          → Graceful Fallback: An toàn ngay cả khi LLM gặp lỗi mạng
        </div>
      </div>

      <!-- Stage 6 -->
      <div class="card" style="padding:20px 22px; display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="pill pill-green">TẦNG 6 · ĐẦU RA LÂM SÀNG</span>
          <strong style="color:#065F46; font-size:14px;">End-to-End</strong>
        </div>
        <div style="font-size:21px; font-weight:900; color:#0D2A24;">Chuyển tiếp Đặt lịch &amp; App Bác sĩ</div>
        <div style="font-size:15px; color:#334155; line-height:1.55;">
          <ul style="padding-left:18px;">
            <li>Kiểm tra chuyên khoa có khả dụng tại bệnh viện đã chọn (<code>BOOK_SPECIALTY</code> / <code>CHOOSE_FACILITY</code>).</li>
            <li>Lưu đầy đủ phiếu sàng lọc (mức nguy cơ, triệu chứng, câu trả lời, trích dẫn) vào <code>PreExamSession</code>.</li>
            <li>Bác sĩ mở xem tức thì trong màn hình <strong>Chi tiết lịch hẹn</strong>.</li>
          </ul>
        </div>
        <div style="margin-top:auto; background:#ECFDF5; color:#065F46; border-radius:10px; padding:8px 12px; font-size:14px; font-weight:700;">
          → Rút ngắn thời gian hỏi bệnh &amp; nâng cao độ chính xác phân luồng
        </div>
      </div>
    </div>

    <div class="bottom-strip" style="font-size:17.5px;">
      Điểm khác biệt của NovaCare: Không phụ thuộc mù quáng vào LLM — <strong>Luật cờ đỏ (0ms) + RAG có hash SHA-256 + Kiểm chứng trích dẫn</strong> bảo đảm an toàn y khoa
    </div>
  </div>
  {footer_html(7)}
</div>
"""

# =====================================================================
# SLIDE 8: ★ FOCUS 3 - CAMERA PPG SIGNAL PROCESSING
# =====================================================================
SLIDE_08 = f"""
<div class="slide" id="slide-08">
  {header_html("03 / ★ TRỌNG TÂM · SINH HIỆU HỖ TRỢ TIỀN KHÁM (3/3)", "Giải thuật ước lượng nhịp tim Camera PPG trên Android", "Đo nhịp tim không cần thiết bị đeo qua Camera2 + Flash (CameraPpgSignal.kt) và đồng bộ trực tiếp vào Red Flag Engine")}
  <div class="content-body" style="flex-direction:row; gap:22px;">
    <!-- Left: 5-step Signal Pipeline -->
    <div class="card" style="flex:1.45; padding:24px 28px; display:flex; flex-direction:column; justify-content:space-between; gap:14px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="font-size:22px; font-weight:900; color:#064E3B;">Chuỗi xử lý tín hiệu quang thể tích đồ (PPG)</div>
        <span class="pill pill-green">On-device · Thời gian thực</span>
      </div>

      <!-- Step 1 -->
      <div style="flex:1; display:flex; align-items:center; gap:16px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:14px 18px;">
        <div class="num-badge-dark">1</div>
        <div style="flex:1;">
          <div style="font-size:17px; font-weight:800; color:#0F172A;">Thu hình Camera2 + Flash &amp; Kiểm tra phủ ngón tay</div>
          <div style="font-size:14.5px; color:#475569; margin-top:2px;">Xác nhận đầu ngón tay che kín ống kính (<code>red ≥ 72</code> &amp; <code>red &gt; green × 1.08</code>); tự reset nếu gián đoạn <code>&gt; 1.25s</code>.</div>
        </div>
        <span class="pill pill-slate">≥ 20 giây</span>
      </div>

      <!-- Step 2 -->
      <div style="flex:1; display:flex; align-items:center; gap:16px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:14px 18px;">
        <div class="num-badge-dark">2</div>
        <div style="flex:1;">
          <div style="font-size:17px; font-weight:800; color:#0F172A;">Khử trôi đường nền (EMA Baseline Removal)</div>
          <div style="font-size:14.5px; color:#475569; margin-top:2px;">Loại bỏ biến đổi ánh sáng / phơi sáng chậm: <code>baseline = 0.96·b + 0.04·red</code> → <code>filtered = red − baseline</code>.</div>
        </div>
        <svg width="130" height="38" viewBox="0 0 130 38"><path d="M2,28 Q16,8 30,22 T58,18 T86,12 T114,20 L128,15" stroke="#94A3B8" stroke-width="2" fill="none" stroke-dasharray="4 3"/><path d="M2,20 Q12,6 22,20 T42,20 T62,20 T82,20 T102,20 T122,20" stroke="#059669" stroke-width="3" fill="none"/></svg>
      </div>

      <!-- Step 3 -->
      <div style="flex:1; display:flex; align-items:center; gap:16px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:14px 18px;">
        <div class="num-badge-dark">3</div>
        <div style="flex:1;">
          <div style="font-size:17px; font-weight:800; color:#0F172A;">Phát hiện đỉnh xung thích nghi (Adaptive Peak Detection)</div>
          <div style="font-size:14.5px; color:#475569; margin-top:2px;">Ngưỡng động <code>mean + 0.12σ</code> trên cửa sổ trượt 90 mẫu; khoảng trơ <code>&gt; 300 ms</code> chống bắt trùng đỉnh nhiễu.</div>
        </div>
        <svg width="130" height="38" viewBox="0 0 130 38">
          <path d="M4,28 L18,28 L26,8 L34,28 L52,28 L60,8 L68,28 L86,28 L94,8 L102,28 L126,28" stroke="#059669" stroke-width="2.5" fill="none"/>
          <circle cx="26" cy="8" r="4" fill="#DC2626"/><circle cx="60" cy="8" r="4" fill="#DC2626"/><circle cx="94" cy="8" r="4" fill="#DC2626"/>
        </svg>
      </div>

      <!-- Step 4 -->
      <div style="flex:1; display:flex; align-items:center; gap:16px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:14px 18px;">
        <div class="num-badge-dark">4</div>
        <div style="flex:1;">
          <div style="font-size:17px; font-weight:800; color:#0F172A;">Lọc ổn định khoảng RR &amp; Cổng chất lượng (Quality Gate)</div>
          <div style="font-size:14.5px; color:#475569; margin-top:2px;">Lọc khoảng RR trong <code>300–1500 ms</code>, giữ nhịp trong <code>±24%</code> trung vị; yêu cầu <strong>≥ 80% đồng nhất</strong> &amp; <code>CV ≤ 0.18</code>.</div>
        </div>
        <span class="pill pill-green">Chống nhiễu</span>
      </div>

      <!-- Step 5 -->
      <div style="display:flex; align-items:center; gap:16px; background:linear-gradient(90deg,#064E3B 0%,#087F5B 100%); color:#FFFFFF; border-radius:14px; padding:15px 18px; margin-top:auto;">
        <div style="width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;">5</div>
        <div style="flex:1;">
          <div style="font-size:18px; font-weight:900;">Ước lượng BPM &amp; Gắn nhãn chất lượng</div>
          <div style="font-size:14.5px; color:#D1FAE5; margin-top:2px;">Chỉ xuất kết quả trong dải sinh lý 30–220 BPM; kết hợp vào phiếu sàng lọc AI.</div>
        </div>
        <div style="background:#FFFFFF; color:#064E3B; padding:9px 16px; border-radius:12px; font-weight:900; font-size:17px;">
          BPM = 60000 / mean(RR)
        </div>
      </div>
    </div>

    <!-- Right: Clinical Safety Integration -->
    <div style="width:520px; display:flex; flex-direction:column; gap:16px;">
      <div class="card-highlight" style="padding:22px 24px;">
        <span class="pill pill-green">Tích hợp an toàn với AI</span>
        <div style="font-size:21px; font-weight:900; color:#064E3B; margin-top:10px;">3 nguyên tắc an toàn sinh hiệu</div>
        <div style="display:flex; flex-direction:column; gap:12px; margin-top:14px;">
          <div style="background:#F8FAFC; border-left:4px solid #059669; border-radius:10px; padding:12px 14px;">
            <div style="font-size:16px; font-weight:800; color:#0F172A;">1. Không bao giờ bịa số BPM</div>
            <div style="font-size:14.5px; color:#475569; margin-top:3px;">Nếu đo chưa đủ 20s, ít hơn 8 đỉnh hoặc độ biến thiên cao → trả <code>null</code> và hướng dẫn đo lại.</div>
          </div>
          <div style="background:#FEF2F2; border-left:4px solid #DC2626; border-radius:10px; padding:12px 14px;">
            <div style="font-size:16px; font-weight:800; color:#991B1B;">2. Chống báo động giả (False Alarm Guard)</div>
            <div style="font-size:14.5px; color:#7F1D1D; margin-top:3px;">Chỉ kích hoạt Red Flag (&lt;40 hoặc &gt;140 BPM) khi <code>measurementQuality == GOOD</code>.</div>
          </div>
          <div style="background:#FFFBEB; border-left:4px solid #D97706; border-radius:10px; padding:12px 14px;">
            <div style="font-size:16px; font-weight:800; color:#92400E;">3. Không dùng để loại trừ bệnh</div>
            <div style="font-size:14.5px; color:#78350F; margin-top:3px;">PPG bình thường tuyệt đối không làm giảm mức cảnh báo từ triệu chứng ngực hay thần kinh.</div>
          </div>
        </div>
      </div>

      <div class="card" style="flex:1; padding:20px 24px; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="font-size:18px; font-weight:800; color:#064E3B;">Bổ sung đánh giá miền tần số (Thực nghiệm)</div>
          <p style="font-size:14.5px; color:#475569; margin-top:6px; line-height:1.5;">
            Trong bộ thực nghiệm đối chuẩn 15 video 30s (30 FPS), nhóm cũng kiểm chứng với lọc thông dải <strong>Butterworth + FFT</strong> (<i>f</i><sub>peak</sub> × 60 = BPM) so sánh trực tiếp với máy đo SpO<sub>2</sub>/nhịp tim chuyên dụng <strong>Contec CMS50-Pro</strong>.
          </p>
        </div>
        <div style="display:flex; gap:10px; margin-top:12px;">
          <span class="pill pill-green">MAE 1.31 BPM</span>
          <span class="pill pill-blue">Pearson r = 0.963</span>
          <span class="pill pill-slate">100% 95% CI</span>
        </div>
      </div>
    </div>
  </div>
  {footer_html(8)}
</div>
"""

# =====================================================================
# SLIDE 9: EVALUATION & BENCHMARK (AI v3.1 + PPG)
# =====================================================================
SLIDE_09 = f"""
<div class="slide" id="slide-09">
  {header_html("04 / THỰC NGHIỆM & ĐÁNH GIÁ", "Kết quả kiểm thử AI Sàng lọc v3.1 & Đối chuẩn Camera PPG", "Đánh giá định lượng kết hợp kiểm thử tự động (Jest) cho hệ thống AI và đối chuẩn thiết bị y tế FDA/CE cho PPG")}
  <div class="content-body" style="flex-direction:row; gap:22px;">
    <!-- Left: AI Screening v3.1 Evaluation -->
    <div class="card-highlight" style="flex:1.05; padding:22px 24px; display:flex; flex-direction:column; gap:14px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="font-size:21px; font-weight:900; color:#064E3B;">★ Kiểm thử AI Sàng lọc v3.1 (Mã nguồn thật)</div>
        <span class="pill pill-green">Jest · 7 Test Suites</span>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div style="background:#ECFDF5; border:1.5px solid #A7F3D0; border-radius:14px; padding:14px 16px;">
          <div style="font-size:13px; font-weight:800; color:#065F46;">UNIT &amp; SAFETY TESTS</div>
          <div style="font-size:34px; font-weight:900; color:#047857; margin-top:2px;">106 / 106</div>
          <div style="font-size:13.5px; color:#33544B;">Ca kiểm thử tự động <strong>PASS 100%</strong></div>
        </div>
        <div style="background:#ECFDF5; border:1.5px solid #A7F3D0; border-radius:14px; padding:14px 16px;">
          <div style="font-size:13px; font-weight:800; color:#065F46;">KỊCH BẢN TỔNG HỢP (DB THẬT)</div>
          <div style="font-size:34px; font-weight:900; color:#047857; margin-top:2px;">10 / 10</div>
          <div style="font-size:13.5px; color:#33544B;">Đạt tiêu chí sau sửa v3.1 <em>(trước: 3/10)</em></div>
        </div>
      </div>

      <!-- Compact Test Case Table -->
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <thead>
          <tr style="background:#064E3B; color:#FFFFFF;">
            <th style="text-align:left; padding:9px 10px; border-radius:8px 0 0 0;">Kịch bản kiểm thử tiêu biểu</th>
            <th style="text-align:left; padding:9px 10px;">Kết quả v3.1</th>
            <th style="text-align:center; padding:9px 10px; border-radius:0 8px 0 0;">Đạt</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #E2E8F0; background:#FFFFFF;">
            <td style="padding:8px 10px;">Đau đầu tái diễn, sợ ánh sáng</td>
            <td style="padding:8px 10px; font-weight:700; color:#065F46;">Thần kinh</td>
            <td style="text-align:center; color:#059669; font-weight:900;">✓</td>
          </tr>
          <tr style="border-bottom:1px solid #E2E8F0; background:#F8FAFC;">
            <td style="padding:8px 10px;">Lời kể đau đầu đột ngột dữ dội</td>
            <td style="padding:8px 10px; font-weight:700; color:#DC2626;">Cấp cứu 115 (EMERGENCY)</td>
            <td style="text-align:center; color:#059669; font-weight:900;">✓</td>
          </tr>
          <tr style="border-bottom:1px solid #E2E8F0; background:#FFFFFF;">
            <td style="padding:8px 10px;">Tiểu buốt (DB chưa có Tiết niệu)</td>
            <td style="padding:8px 10px; font-weight:700; color:#0369A1;">Liên hệ CSYT (không gán nhầm)</td>
            <td style="text-align:center; color:#059669; font-weight:900;">✓</td>
          </tr>
          <tr style="border-bottom:1px solid #E2E8F0; background:#F8FAFC;">
            <td style="padding:8px 10px;">Phủ định đau ngực, khó thở, ho</td>
            <td style="padding:8px 10px; font-weight:700; color:#475569;">ASK_MORE (lọc phủ định)</td>
            <td style="text-align:center; color:#059669; font-weight:900;">✓</td>
          </tr>
          <tr style="border-bottom:1px solid #E2E8F0; background:#FFFFFF;">
            <td style="padding:8px 10px;">PPG 155 BPM (chất lượng LOW)</td>
            <td style="padding:8px 10px; font-weight:700; color:#065F46;">Không kích hoạt báo động giả</td>
            <td style="text-align:center; color:#059669; font-weight:900;">✓</td>
          </tr>
          <tr style="background:#F8FAFC;">
            <td style="padding:8px 10px;">Đau gối phải / Phát ban / Ợ chua</td>
            <td style="padding:8px 10px; font-weight:700; color:#065F46;">CXK / Da liễu / Tiêu hóa</td>
            <td style="text-align:center; color:#059669; font-weight:900;">✓</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top:auto; background:#FFFBEB; border:1px solid #FDE68A; border-radius:10px; padding:10px 12px; font-size:13px; color:#92400E; line-height:1.45;">
        <strong>Ghi chú khoa học:</strong> Đây là bộ kiểm thử kỹ thuật quy tắc &amp; an toàn hệ thống (synthetic cases), chưa thay thế nghiên cứu độ chính xác lâm sàng có nhãn bác sĩ độc lập.
      </div>
    </div>

    <!-- Right: PPG Clinical Benchmark -->
    <div class="card" style="flex:1; padding:22px 24px; display:flex; flex-direction:column; gap:14px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="font-size:21px; font-weight:900; color:#0D2A24;">Đối chuẩn định lượng Camera PPG</div>
        <span class="pill pill-blue">Contec CMS50-Pro (FDA/CE)</span>
      </div>

      <!-- Setup strip -->
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:11px 14px; display:flex; justify-content:space-between; font-size:14px; color:#334155;">
        <span>📱 <strong>Xiaomi Redmi 15C</strong></span>
        <span>🎞️ <strong>15 video</strong> (30s/phiên)</span>
        <span>🖼️ <strong>~13.800</strong> khung hình</span>
      </div>

      <!-- 4 KPI Cards -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div style="background:#F0FDF7; border:1.5px solid #A7F3D0; border-radius:14px; padding:14px 16px;">
          <div style="font-size:13px; font-weight:800; color:#065F46;">MAE (Sai số tuyệt đối TB)</div>
          <div style="font-size:34px; font-weight:900; color:#059669;">1.31 <span style="font-size:18px;">BPM</span></div>
          <div style="font-size:13px; color:#33544B;">✓ Đạt ngưỡng tốt &lt; 2.0 BPM</div>
        </div>
        <div style="background:#F0FDF7; border:1.5px solid #A7F3D0; border-radius:14px; padding:14px 16px;">
          <div style="font-size:13px; font-weight:800; color:#065F46;">MAPE (Sai số phần trăm)</div>
          <div style="font-size:34px; font-weight:900; color:#059669;">1.58%</div>
          <div style="font-size:13px; color:#33544B;">✓ Độ chính xác đạt <strong>98.42%</strong></div>
        </div>
        <div style="background:#F8FAFC; border:1.5px solid #CBD5E1; border-radius:14px; padding:14px 16px;">
          <div style="font-size:13px; font-weight:800; color:#334155;">Hệ số tương quan Pearson r</div>
          <div style="font-size:34px; font-weight:900; color:#0F172A;">0.963</div>
          <div style="font-size:13px; color:#475569;">p &lt; 0.001 · Tương quan rất cao</div>
        </div>
        <div style="background:#F8FAFC; border:1.5px solid #CBD5E1; border-radius:14px; padding:14px 16px;">
          <div style="font-size:13px; font-weight:800; color:#334155;">Hệ số xác định R²</div>
          <div style="font-size:34px; font-weight:900; color:#0F172A;">0.927</div>
          <div style="font-size:13px; color:#475569;">Giải thích 92.7% biến thiên</div>
        </div>
      </div>

      <!-- Bland-Altman Clean SVG Chart -->
      <div style="flex:1; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:14px 16px; display:flex; flex-direction:column;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <div style="font-size:15px; font-weight:800; color:#0F172A;">Biểu đồ Bland-Altman (PPG vs Contec)</div>
          <span class="pill pill-green" style="font-size:12px;">100% điểm trong khoảng tin cậy 95%</span>
        </div>
        <svg viewBox="0 0 640 165" style="width:100%; flex:1;">
          <!-- Axes -->
          <line x1="55" y1="15" x2="55" y2="140" stroke="#94A3B8" stroke-width="1.5"/>
          <line x1="55" y1="140" x2="620" y2="140" stroke="#94A3B8" stroke-width="1.5"/>
          <!-- +1.96 SD, Mean, -1.96 SD -->
          <line x1="55" y1="36" x2="620" y2="36" stroke="#10B981" stroke-width="1.8" stroke-dasharray="6 4"/>
          <line x1="55" y1="78" x2="620" y2="78" stroke="#065F46" stroke-width="1.8"/>
          <line x1="55" y1="120" x2="620" y2="120" stroke="#10B981" stroke-width="1.8" stroke-dasharray="6 4"/>
          <text x="12" y="40" font-size="11" fill="#065F46" font-weight="700">+2.6</text>
          <text x="24" y="82" font-size="11" fill="#0F172A" font-weight="700">0</text>
          <text x="14" y="124" font-size="11" fill="#065F46" font-weight="700">-2.6</text>
          <text x="530" y="30" font-size="11" fill="#059669" font-weight="700">+1.96 SD (95% LoA)</text>
          <text x="530" y="135" font-size="11" fill="#059669" font-weight="700">-1.96 SD (95% LoA)</text>
          <!-- 15 scatter points -->
          <circle cx="110" cy="84" r="5" fill="#059669"/><circle cx="145" cy="70" r="5" fill="#059669"/>
          <circle cx="180" cy="92" r="5" fill="#059669"/><circle cx="215" cy="64" r="5" fill="#059669"/>
          <circle cx="250" cy="76" r="5" fill="#059669"/><circle cx="285" cy="96" r="5" fill="#059669"/>
          <circle cx="320" cy="58" r="5" fill="#059669"/><circle cx="355" cy="82" r="5" fill="#059669"/>
          <circle cx="390" cy="68" r="5" fill="#059669"/><circle cx="425" cy="90" r="5" fill="#059669"/>
          <circle cx="460" cy="74" r="5" fill="#059669"/><circle cx="495" cy="62" r="5" fill="#059669"/>
          <circle cx="525" cy="86" r="5" fill="#059669"/><circle cx="560" cy="72" r="5" fill="#059669"/>
          <circle cx="590" cy="80" r="5" fill="#059669"/>
          <text x="290" y="158" font-size="12" fill="#475569" font-weight="700">Trung bình nhịp tim (BPM)</text>
        </svg>
      </div>
    </div>
  </div>
  {footer_html(9)}
</div>
"""

# =====================================================================
# SLIDE 10: LIVE DEMO SCENARIO (3 CLEAR COLUMNS, ~6-7 MIN)
# =====================================================================
SLIDE_10 = f"""
<div class="slide" id="slide-10">
  {header_html("05 / TRÌNH DIỄN HỆ THỐNG (LIVE DEMO)", "Kịch bản trình diễn xuyên suốt NovaCare (6–7 phút)", "Một câu chuyện người bệnh liền mạch từ sàng lọc AI → đặt lịch & thanh toán → bác sĩ tiếp nhận hồ sơ")}
  <div class="content-body" style="gap:18px;">
    <div style="display:grid; grid-template-columns:1.15fr 1fr 0.9fr; gap:20px; flex:1;">
      <!-- Demo 1 -->
      <div class="card-highlight" style="display:flex; flex-direction:column; gap:14px; padding:24px; background:linear-gradient(180deg,#F0FDF7 0%,#FFFFFF 35%);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="num-badge-dark">01</div>
            <div style="font-size:22px; font-weight:900; color:#064E3B;">App Bệnh nhân</div>
          </div>
          <span class="pill pill-dark">~3.5 phút · Trọng tâm</span>
        </div>
        <div style="font-size:14.5px; color:#059669; font-weight:700;">Android Native (Kotlin + Jetpack Compose)</div>

        <div style="display:flex; flex-direction:column; gap:14px; flex:1;">
          <div style="flex:1; background:#FEF2F2; border:1px solid #FECACA; border-radius:14px; padding:16px 18px; display:flex; flex-direction:column; justify-content:center;">
            <div style="font-size:17px; font-weight:800; color:#991B1B;">1. Kiểm chứng Red Flag (30 giây)</div>
            <div style="font-size:15.5px; color:#7F1D1D; margin-top:6px; line-height:1.5;">Nhập triệu chứng đau thắt ngực lan tay trái + khó thở → Bật ngay cảnh báo <strong>cấp cứu 115</strong>, ngắt luồng đặt lịch thường.</div>
          </div>

          <div style="flex:1.15; background:#FFFFFF; border:1.5px solid #A7F3D0; border-radius:14px; padding:16px 18px; display:flex; flex-direction:column; justify-content:center;">
            <div style="font-size:17px; font-weight:800; color:#064E3B;">2. Sàng lọc AI đa phương thức &amp; PPG (2 phút)</div>
            <div style="font-size:15.5px; color:#334155; margin-top:6px; line-height:1.5;">Chọn vùng cơ thể, nhập văn bản/giọng nói + đo/đính kèm PPG → trả lời câu hỏi khu trú → nhận <strong>Chuyên khoa gợi ý &amp; giải thích</strong>.</div>
          </div>

          <div style="flex:1; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:16px 18px; display:flex; flex-direction:column; justify-content:center;">
            <div style="font-size:17px; font-weight:800; color:#0F172A;">3. Đặt lịch, VNPAY &amp; Sổ sức khỏe (1 phút)</div>
            <div style="font-size:15.5px; color:#475569; margin-top:6px; line-height:1.5;">Đặt lịch từ gợi ý AI → bật <strong>Chia sẻ bệnh án cũ</strong> → thanh toán <strong>VNPAY Sandbox</strong> → xem Sổ sức khỏe điện tử.</div>
          </div>
        </div>
      </div>

      <!-- Demo 2 -->
      <div class="card" style="display:flex; flex-direction:column; gap:14px; padding:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="num-badge">02</div>
            <div style="font-size:22px; font-weight:800; color:#0D2A24;">App Bác sĩ</div>
          </div>
          <span class="pill pill-green">~2 phút</span>
        </div>
        <div style="font-size:14.5px; color:#64748B; font-weight:700;">Android Native · NovaCare Doctor Portal</div>

        <div style="display:flex; flex-direction:column; gap:14px; flex:1;">
          <div style="flex:1; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:16px 18px; display:flex; flex-direction:column; justify-content:center;">
            <div style="font-size:17px; font-weight:800; color:#0F172A;">1. Lịch làm việc &amp; ca trực</div>
            <div style="font-size:15.5px; color:#475569; margin-top:6px; line-height:1.5;">Xem lịch tuần theo thanh 7 ngày, lưới khung giờ trực 3 cột &amp; tỷ lệ lấp đầy từng ca khám.</div>
          </div>

          <div style="flex:1.15; background:#ECFDF5; border:1px solid #A7F3D0; border-radius:14px; padding:16px 18px; display:flex; flex-direction:column; justify-content:center;">
            <div style="font-size:17px; font-weight:800; color:#065F46;">2. Đọc phiếu sàng lọc tiền khám AI</div>
            <div style="font-size:15.5px; color:#33544B; margin-top:6px; line-height:1.5;">Mở lịch hẹn vừa đặt → xem ngay <strong>mức nguy cơ, triệu chứng, câu hỏi sàng lọc &amp; nhận định AI</strong>.</div>
          </div>

          <div style="flex:1; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:16px 18px; display:flex; flex-direction:column; justify-content:center;">
            <div style="font-size:17px; font-weight:800; color:#0F172A;">3. Popup hồ sơ chia sẻ &amp; Tư vấn</div>
            <div style="font-size:15.5px; color:#475569; margin-top:6px; line-height:1.5;">Mở popup chi tiết bệnh án cũ được cấp quyền (chẩn đoán ICD, cận lâm sàng, đơn thuốc) &amp; phòng tư vấn.</div>
          </div>
        </div>
      </div>

      <!-- Demo 3 -->
      <div class="card" style="display:flex; flex-direction:column; gap:14px; padding:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="num-badge">03</div>
            <div style="font-size:22px; font-weight:800; color:#0D2A24;">Web Portal</div>
          </div>
          <span class="pill pill-slate">~1 phút</span>
        </div>
        <div style="font-size:14.5px; color:#64748B; font-weight:700;">Next.js 16 · novacare-health.me</div>

        <div style="display:flex; flex-direction:column; gap:14px; flex:1;">
          <div style="flex:1; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:16px 18px; display:flex; flex-direction:column; justify-content:center;">
            <div style="font-size:17px; font-weight:800; color:#0F172A;">1. Mô hình cơ thể 3D</div>
            <div style="font-size:15.5px; color:#475569; margin-top:6px; line-height:1.5;">Trình diễn tương tác chọn vùng đau trực tiếp trên mô hình 3D Three.js (Nam/Nữ).</div>
          </div>

          <div style="flex:1; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:16px 18px; display:flex; flex-direction:column; justify-content:center;">
            <div style="font-size:17px; font-weight:800; color:#0F172A;">2. Cổng Quản trị &amp; HIS</div>
            <div style="font-size:15.5px; color:#475569; margin-top:6px; line-height:1.5;">Lướt nhanh quản lý cơ sở, giám sát đặt lịch, kiểm duyệt đánh giá &amp; luồng đồng bộ HIS.</div>
          </div>

          <div style="background:#064E3B; color:#FFFFFF; border-radius:14px; padding:16px 18px;">
            <div style="font-size:13px; color:#6EE7B7; font-weight:800;">MÔI TRƯỜNG LIVE</div>
            <div style="font-size:17px; font-weight:800; margin-top:4px;">https://novacare-health.me</div>
            <div style="font-size:13.5px; color:#D1FAE5; margin-top:3px;">VPS Docker · SSL · VNPAY Sandbox</div>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-strip" style="font-size:17.5px;">
      Mục tiêu Demo: Chứng minh luồng dữ liệu thông suốt — <strong>Bệnh nhân sàng lọc AI &amp; cấp quyền → Bác sĩ tiếp nhận tức thì → Quản trị giám sát tập trung</strong>
    </div>
  </div>
  {footer_html(10)}
</div>
"""

# =====================================================================
# SLIDE 11: CONCLUSION, LIMITATIONS & FUTURE WORK
# =====================================================================
SLIDE_11 = f"""
<div class="slide" id="slide-11">
  {header_html("05 / TỔNG KẾT", "Kết quả đạt được, Hạn chế & Hướng phát triển", "Đánh giá khách quan những giá trị đã hoàn thiện và lộ trình mở rộng trong giai đoạn tiếp theo")}
  <div class="content-body" style="gap:18px;">
    <div style="display:grid; grid-template-columns:1.25fr 0.95fr; gap:20px; flex:1;">
      <!-- Achievements -->
      <div class="card-highlight" style="padding:24px 26px; display:flex; flex-direction:column; gap:12px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="pill pill-dark">1. KẾT QUẢ ĐẠT ĐƯỢC</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:12px; flex:1;">
          <div style="flex:1; display:flex; gap:14px; align-items:center; background:#F0FDF7; padding:14px 16px; border-radius:14px; border:1px solid #A7F3D0;">
            <span style="color:#059669; font-weight:900; font-size:22px;">✓</span>
            <div>
              <div style="font-size:17.5px; font-weight:800; color:#064E3B;">AI Sàng lọc Safety-First đa phương thức (v3.1)</div>
              <div style="font-size:15px; color:#33544B; margin-top:3px;">Tích hợp 5 kênh đầu vào, 34 vùng 3D, 120 câu hỏi, Red Flag ưu tiên số 1 &amp; Hybrid RAG chống ảo giác (106/106 test PASS).</div>
            </div>
          </div>
          <div style="flex:1; display:flex; gap:14px; align-items:center; background:#F8FAFC; padding:14px 16px; border-radius:14px; border:1px solid #E2E8F0;">
            <span style="color:#059669; font-weight:900; font-size:22px;">✓</span>
            <div>
              <div style="font-size:17.5px; font-weight:800; color:#0F172A;">Đo nhịp tim Camera PPG đạt độ chính xác cao</div>
              <div style="font-size:15px; color:#475569; margin-top:3px;">Đối chuẩn thiết bị y tế Contec CMS50-Pro đạt MAE 1.31 BPM, MAPE 1.58%, r = 0.963, kèm cổng lọc nhiễu chống báo động giả.</div>
            </div>
          </div>
          <div style="flex:1; display:flex; gap:14px; align-items:center; background:#F8FAFC; padding:14px 16px; border-radius:14px; border:1px solid #E2E8F0;">
            <span style="color:#059669; font-weight:900; font-size:22px;">✓</span>
            <div>
              <div style="font-size:17.5px; font-weight:800; color:#0F172A;">Hệ sinh thái đa kênh hoàn chỉnh &amp; triển khai thực tế</div>
              <div style="font-size:15px; color:#475569; margin-top:3px;">Web Portal (Next.js 16) + 2 App Android Native (Bệnh nhân &amp; Bác sĩ) + NestJS API (53 bảng) chạy live tại <code>novacare-health.me</code>.</div>
            </div>
          </div>
          <div style="flex:1; display:flex; gap:14px; align-items:center; background:#F8FAFC; padding:14px 16px; border-radius:14px; border:1px solid #E2E8F0;">
            <span style="color:#059669; font-weight:900; font-size:22px;">✓</span>
            <div>
              <div style="font-size:17.5px; font-weight:800; color:#0F172A;">Khép kín đặt lịch, VNPAY, Sổ sức khỏe &amp; Telemedicine</div>
              <div style="font-size:15px; color:#475569; margin-top:3px;">Redis TTL chống overbooking, thanh toán VNPAY 2.1.0, cơ chế Consent chia sẻ bệnh án &amp; gọi video LiveKit WebRTC.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Limitations -->
      <div class="card" style="padding:24px 26px; display:flex; flex-direction:column; gap:14px; border-color:#FDE68A;">
        <div><span class="pill pill-amber">2. HẠN CHẾ HIỆN TẠI</span></div>
        <div style="display:flex; flex-direction:column; gap:14px; flex:1;">
          <div style="flex:1; background:#FFFBEB; border:1px solid #FDE68A; border-radius:14px; padding:16px 18px; display:flex; flex-direction:column; justify-content:center;">
            <div style="font-size:17.5px; font-weight:800; color:#92400E;">Kiểm định lâm sàng cho kho tri thức AI</div>
            <div style="font-size:15px; color:#78350F; margin-top:5px; line-height:1.5;">
              Bộ ca đánh giá AI hiện là kịch bản tổng hợp; kho chứng cứ RAG cần đội ngũ bác sĩ chuyên khoa thẩm định và phê duyệt rộng hơn.
            </div>
          </div>
          <div style="flex:1; background:#FFFBEB; border:1px solid #FDE68A; border-radius:14px; padding:16px 18px; display:flex; flex-direction:column; justify-content:center;">
            <div style="font-size:17.5px; font-weight:800; color:#92400E;">Camera PPG nhạy với rung tay &amp; ánh sáng</div>
            <div style="font-size:15px; color:#78350F; margin-top:5px; line-height:1.5;">
              Độ ổn định phụ thuộc thao tác giữ cố định đầu ngón tay tối thiểu 20 giây trong điều kiện ánh sáng phù hợp.
            </div>
          </div>
          <div style="flex:1; background:#FFFBEB; border:1px solid #FDE68A; border-radius:14px; padding:16px 18px; display:flex; flex-direction:column; justify-content:center;">
            <div style="font-size:17.5px; font-weight:800; color:#92400E;">Kết nối HIS mới ở mức mô phỏng chuẩn</div>
            <div style="font-size:15px; color:#78350F; margin-top:5px; line-height:1.5;">
              Cổng đồng bộ danh mục bác sĩ/lịch trực đã xây dựng sẵn chuẩn REST/JSON &amp; Smart Upsert nhưng chưa nối trực tiếp HIS bệnh viện thật.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Future Work (4 Horizontal Steps) -->
    <div class="card" style="padding:20px 26px;">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
        <span class="pill pill-green">3. HƯỚNG PHÁT TRIỂN</span>
        <span style="font-size:15px; color:#065F46; font-weight:700;">Lộ trình nâng tầm thành nền tảng y tế số chuẩn lâm sàng</span>
      </div>
      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:14px;">
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:14px;">
          <div style="font-size:16px; font-weight:800; color:#064E3B;">1. Thẩm định &amp; Fine-tune LLM</div>
          <div style="font-size:14px; color:#475569; margin-top:4px;">Phối hợp bác sĩ xây dựng kho RAG chuẩn y khoa Việt Nam &amp; tối ưu mô hình chuyên biệt.</div>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:14px;">
          <div style="font-size:16px; font-weight:800; color:#064E3B;">2. Mở rộng sinh hiệu PPG</div>
          <div style="font-size:14px; color:#475569; margin-top:4px;">Bổ sung ước lượng biến thiên nhịp tim (HRV), SpO2 và lọc nhiễu chuyển động bằng ML.</div>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:14px;">
          <div style="font-size:16px; font-weight:800; color:#064E3B;">3. Tích hợp thiết bị đeo BLE</div>
          <div style="font-size:14px; color:#475569; margin-top:4px;">Đồng bộ dữ liệu sinh hiệu liên tục từ Smartwatch / máy đo huyết áp qua Bluetooth.</div>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:14px;">
          <div style="font-size:16px; font-weight:800; color:#064E3B;">4. Liên thông HL7 FHIR</div>
          <div style="font-size:14px; color:#475569; margin-top:4px;">Kết nối EMR/PACS bệnh viện thực tế &amp; chuẩn hóa liên thông dữ liệu BHYT quốc gia.</div>
        </div>
      </div>
    </div>
  </div>
  {footer_html(11)}
</div>
"""

# =====================================================================
# SLIDE 12: THANK YOU & Q&A
# =====================================================================
SLIDE_12 = f"""
<div class="slide dark" id="slide-12">
  <svg style="position:absolute; right:0; top:0; height:1080px; width:520px; pointer-events:none;" viewBox="0 0 520 1080" fill="none">
    <polygon points="220,0 520,0 520,1080 220,1080 420,540" fill="#10B981" fill-opacity="0.22"/>
    <rect x="380" y="0" width="140" height="140" stroke="#10B981" stroke-width="18" fill="none" opacity="0.65"/>
  </svg>

  <div style="position:relative; z-index:2; display:flex; flex-direction:column; height:100%;">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div style="background:rgba(16,185,129,0.18); border:1px solid rgba(52,211,153,0.4); color:#A7F3D0; padding:12px 24px; border-radius:999px; font-size:17px; font-weight:800; letter-spacing:1.8px;">
        NOVACARE · GRADUATION THESIS 2026
      </div>
      <div style="background:#FFFFFF; padding:8px 18px; border-radius:16px;">
        <img src="{IUH_LOGO}" style="height:44px; object-fit:contain;" alt="IUH" />
      </div>
    </div>

    <div style="margin-top:110px;">
      <img src="{NOVACARE_WHITE}" style="height:72px; object-fit:contain; margin-bottom:28px;" alt="NovaCare" />
      <h1 style="font-size:112px; font-weight:900; line-height:1.05; color:#FFFFFF; letter-spacing:-2px;">
        THANK YOU<br/>&amp; Q&amp;A
      </h1>
      <div style="width:180px; height:8px; background:#10B981; border-radius:99px; margin:34px 0;"></div>
      <p style="font-size:29px; color:#D1E3DD; line-height:1.5; max-width:960px;">
        Trân trọng cảm ơn <strong style="color:#FFFFFF;">ThS. Huỳnh Nam</strong> và quý Thầy/Cô<br/>
        trong Hội đồng đánh giá Khóa luận tốt nghiệp.
      </p>
    </div>

    <div style="margin-top:auto;">
      <div style="font-size:15px; font-weight:800; color:#34D399; letter-spacing:2px; margin-bottom:12px;">
        GỢI Ý TRAO ĐỔI CÙNG HỘI ĐỒNG
      </div>
      <div style="display:flex; gap:16px; flex-wrap:wrap; font-size:21px; font-weight:700; color:#FFFFFF;">
        <span>AI Safety-First &amp; Hybrid RAG</span>
        <span style="color:#10B981;">•</span>
        <span>Camera PPG &amp; Quality Gate</span>
        <span style="color:#10B981;">•</span>
        <span>Shared EMR &amp; Consent</span>
        <span style="color:#10B981;">•</span>
        <span>VNPAY &amp; LiveKit Telemedicine</span>
      </div>
    </div>
  </div>
</div>
"""

ALL_SLIDES = [
    SLIDE_01, SLIDE_02, SLIDE_03, SLIDE_04, SLIDE_05, SLIDE_06,
    SLIDE_07, SLIDE_08, SLIDE_09, SLIDE_10, SLIDE_11, SLIDE_12
]

HTML_DOC = f"""<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<style>{SLIDE_CSS}</style>
</head>
<body>
{"".join(ALL_SLIDES)}
</body>
</html>
"""

html_path = OUT_DIR / "deck.html"
html_path.write_text(HTML_DOC, encoding="utf-8")

png_paths = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
    page = browser.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
    page.goto(html_path.as_uri(), wait_until="networkidle")
    for idx in range(1, len(ALL_SLIDES) + 1):
        out_png = OUT_DIR / f"slide_{idx:02d}.png"
        locator = page.locator(f"#slide-{idx:02d}")
        locator.screenshot(path=str(out_png))
        png_paths.append(out_png)
        print(f"Rendered {out_png.name}")
    browser.close()

# Build combined PDF
pdf_path = ROOT / "docs" / "NovaCare_KLTN_Slides_Moi.pdf"
pil_images = [Image.open(p).convert("RGB") for p in png_paths]
pil_images[0].save(pdf_path, save_all=True, append_images=pil_images[1:], resolution=150.0)
print(f"Saved PDF: {pdf_path}")

# Build 16:9 PPTX embedding each crisp 1920x1080 slide image
pptx_path = ROOT / "docs" / "NovaCare_KLTN_Slides_Moi.pptx"
prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
blank_layout = prs.slide_layouts[6]
for png in png_paths:
    slide = prs.slides.add_slide(blank_layout)
    slide.shapes.add_picture(str(png), Inches(0), Inches(0), width=prs.slide_width, height=prs.slide_height)
prs.save(pptx_path)
print(f"Saved PPTX: {pptx_path}")
