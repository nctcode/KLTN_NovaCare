# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG NOVACARE LÊN PRODUCTION

Tài liệu này cung cấp toàn bộ quy trình cấu hình và triển khai thực tế hệ thống **NovaCare** (Next.js Web, NestJS API, PostgreSQL, Redis, LiveKit WebRTC và Android App) lên máy chủ VPS Linux (Ubuntu 22.04 / 24.04 LTS).

---

## I. KIẾN TRÚC TRIỂN KHAI PRODUCTION

```
                           [ Internet / Users ]
                                     │
                                     ▼
                      [ Cloudflare DNS & Proxy ]
                                     │
                      (HTTPS: 443 / HTTP: 80)
                                     ▼
                    [ VPS Linux - Nginx Reverse Proxy ]
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼ (proxy_pass: 3001)                                    ▼ (proxy_pass: 3000)
┌─────────────────────────────┐                         ┌─────────────────────────────┐
│  Next.js Web (Standalone)   │                         │     NestJS API (Node 22)    │
│  (Docker: novacare_prod_web)│                         │     (Docker: novacare_prod_api)
└─────────────────────────────┘                         └──────────────┬──────────────┘
                                                                       │
                                                       ┌───────────────┴───────────────┐
                                                       ▼                               ▼
                                          ┌────────────────────────┐      ┌────────────────────────┐
                                          │  PostgreSQL 16 Alpine  │      │     Redis 7 Alpine     │
                                          │(novacare_prod_postgres)│      │  (novacare_prod_redis) │
                                          └────────────────────────┘      └────────────────────────┘
```

*Lưu ý:* Video Telemedicine sử dụng **LiveKit Cloud** (`wss://novacare-x8f7xvc9.livekit.cloud`) nên luồng WebRTC đi trực tiếp giữa thiết bị người dùng và LiveKit Edge, không tạo tải nặng lên VPS của bạn.

---

## II. BƯỚC 1: CẤU HÌNH DNS TÊN MIỀN (CLOUDFLARE)

1. Trỏ Nameservers của tên miền (mua tại Namecheap, Tenten, Porkbun...) về Cloudflare.
2. Tại mục **DNS Records** trên Cloudflare Dashboard, thêm 2 bản ghi:

| Type | Name | Content (IPv4) | Proxy Status | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` (hoặc `app`) | `IP_VPS_CỦA_BẠN` | Proxied (Đám mây cam) | Cổng Web chính |
| **A** | `api` | `IP_VPS_CỦA_BẠN` | **DNS Only** (Xám) | Bắt buộc DNS Only để WebSocket Socket.io không bị ngắt kết nối |

---

## III. BƯỚC 2: CÀI ĐẶT MÔI TRƯỜNG TRÊN VPS (UBUNTU)

SSH vào máy chủ VPS bằng quyền `root`:

```bash
ssh root@<IP_VPS_CỦA_BẠN>
```

### 1. Cập nhật hệ điều hành và cài đặt công cụ cần thiết:
```bash
apt update && apt upgrade -y
apt install -y git curl ufw nginx certbot python3-certbot-nginx
```

### 2. Cài đặt Docker & Docker Compose:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker
```

### 3. Cấu hình tường lửa (UFW) an toàn:
```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP Nginx
ufw allow 443/tcp   # HTTPS Nginx
ufw enable
```

---

## IV. BƯỚC 3: ĐƯA MÃ NGUỒN VÀ KHỞI CHẠY CONTAINER

### 1. Clone mã nguồn vào thư mục `/opt/novacare`:
```bash
git clone https://github.com/nctcode/KLTN_NovaCare.git /opt/novacare
cd /opt/novacare
```

### 2. Tạo file biến môi trường Production cho Backend:
```bash
cp nova-care-backend/.env.production.example nova-care-backend/.env.production
nano nova-care-backend/.env.production
```
*Kiểm tra và cập nhật:*
- `APP_URL`: `https://api.novacare.vn` (thay bằng domain thật của bạn)
- `CORS_ORIGIN`: `https://novacare.vn,https://www.novacare.vn`
- `POSTGRES_PASSWORD`: Đặt mật khẩu DB phức tạp.
- Các khóa `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`.

### 3. Khởi chạy toàn bộ hệ thống bằng Docker Compose Production:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 4. Chạy Prisma Migration trên database Production:
```bash
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

---

## V. BƯỚC 4: CẤU HÌNH NGINX & CẤP CHỨNG CHỈ SSL (HTTPS)

### 1. Sao chép file cấu hình Nginx:
```bash
cp /opt/novacare/deploy/nginx/novacare.conf /etc/nginx/sites-available/novacare.conf
```

Mở file để thay `novacare.vn` và `api.novacare.vn` thành tên miền thật của bạn:
```bash
nano /etc/nginx/sites-available/novacare.conf
```

### 2. Kích hoạt cấu hình và kiểm tra:
```bash
ln -sf /etc/nginx/sites-available/novacare.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

### 3. Cấp chứng chỉ SSL HTTPS miễn phí tự động bằng Certbot:
```bash
certbot --nginx -d api.novacare.vn -d novacare.vn -d www.novacare.vn
```
*Certbot sẽ tự động chỉnh sửa file Nginx sang cổng 443, cài đặt chứng chỉ SSL và tự động gia hạn mỗi 90 ngày.*

---

## VI. BƯỚC 5: CẤU HÌNH MOBILE APP (ANDROID)

Khi chuyển sang production, ứng dụng Android cần gọi về domain HTTPS:

1. Mở file [ApiClient.kt](file:///d:/HTTT18B/KLTN/NovaCare/mobile/app/src/main/java/com/example/kltn_novacare/data/remote/ApiClient.kt):
   Đổi `BASE_URL`:
   ```kotlin
   private val BASE_URL: String = "https://api.novacare.vn/api/v1/"
   ```
2. Build file APK Release gửi cho hội đồng chấm hoặc cài lên điện thoại:
   ```bash
   cd mobile
   .\gradlew.bat assembleRelease
   ```
   File APK sẽ nằm tại: `mobile/app/build/outputs/apk/release/app-release-unsigned.apk` (hoặc build bản debug với domain mới: `.\gradlew.bat assembleDebug`).

---

## VII. BẢO TRÌ & SAO LƯU DỮ LIỆU ĐỊNH KỲ

### 1. Xem logs các dịch vụ:
```bash
# Xem log backend API
docker compose -f docker-compose.prod.yml logs -f api

# Xem log frontend Web
docker compose -f docker-compose.prod.yml logs -f web
```

### 2. Cập nhật code mới khi có commit mới trên GitHub:
```bash
cd /opt/novacare
git pull origin develop
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

### 3. Sao lưu Database tự động (Backup hàng ngày):
Thêm lệnh vào crontab (`crontab -e`):
```bash
0 2 * * * docker compose -f /opt/novacare/docker-compose.prod.yml exec -T postgres pg_dump -U postgres nova_care | gzip > /opt/backups/novacare_$(date +\%F).sql.gz
```
