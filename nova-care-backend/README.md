# NovaCare Backend - Giai đoạn 2

Backend API cho nền tảng đặt lịch khám trực tuyến NovaCare, xây dựng bằng NestJS + PostgreSQL + Prisma.

## 🛠 Công nghệ

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|---------|
| NestJS | 11.x | Framework backend |
| TypeScript | 5.x | Ngôn ngữ lập trình |
| PostgreSQL | 16 | Cơ sở dữ liệu |
| Prisma | 7.x | ORM |
| JWT | - | Xác thực |
| Argon2 | - | Hash mật khẩu |
| Swagger | - | Tài liệu API |
| Docker | - | Container hóa |

## 🚀 Khởi chạy với Docker (Khuyến nghị)

### Bước 1: Khởi động PostgreSQL
```bash
docker-compose up -d postgres
```

### Bước 2: Chạy migration và seed
```bash
# Chờ postgres healthy (~10s), sau đó:
npx prisma migrate dev --name init

# Seed dữ liệu mẫu
npm run db:seed
```

### Bước 3: Khởi động toàn bộ (API + DB)
```bash
docker-compose up -d
```

### Bước 4: Xem logs
```bash
docker-compose logs -f api
```

## 🗃 Chạy chỉ PostgreSQL trên Docker (API local)

```bash
# Khởi động chỉ PostgreSQL
docker-compose up -d postgres

# Chạy API local (hot-reload)
npm run start:dev
```

## 📦 Scripts hữu ích

```bash
# ── Docker ──────────────────────────────────────────────
npm run docker:up          # Khởi động tất cả services
npm run docker:down        # Dừng tất cả services
npm run docker:logs        # Xem log API
npm run docker:logs:db     # Xem log PostgreSQL
npm run docker:shell       # Vào shell container API
npm run docker:migrate     # Chạy migration trong Docker
npm run docker:seed        # Seed data trong Docker

# ── Database (chạy local) ────────────────────────────────
npm run db:migrate         # Tạo migration mới
npm run db:seed            # Seed dữ liệu mẫu
npm run db:reset           # Reset DB và seed lại
npm run db:studio          # Mở Prisma Studio (localhost:5555)

# ── Development ──────────────────────────────────────────
npm run start:dev          # Chạy với hot-reload
npm run build              # Build production
npm run test               # Chạy unit tests
```

## 🔗 Endpoints

| Service | URL |
|---------|-----|
| API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api-docs |
| Prisma Studio | http://localhost:5555 (docker:studio) |
| PostgreSQL | localhost:5432 |

## 📖 API Modules

### 🔐 Xác thực (`/api/v1/auth`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/register` | Đăng ký tài khoản |
| POST | `/login` | Đăng nhập |
| POST | `/refresh` | Làm mới access token |
| POST | `/logout` | Đăng xuất |
| POST | `/logout-all` | Đăng xuất tất cả thiết bị |

### 👤 Người dùng (`/api/v1/users`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/me` | Lấy thông tin cá nhân |
| PUT | `/me` | Cập nhật thông tin |
| DELETE | `/me` | Xóa tài khoản |

### 📋 Hồ sơ bệnh nhân (`/api/v1/patient-profiles`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Danh sách hồ sơ |
| POST | `/` | Tạo hồ sơ mới |
| GET | `/:id` | Chi tiết hồ sơ |
| PUT | `/:id` | Cập nhật hồ sơ |
| DELETE | `/:id` | Xóa hồ sơ |
| PATCH | `/:id/default` | Đặt làm mặc định |

## 🧪 Test nhanh bằng cURL

```bash
# 1. Đăng ký
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@novacare.vn","phone":"0123456789","fullName":"Nguyễn Văn Test","password":"Password123!"}'

# 2. Đăng nhập
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@novacare.vn","password":"Password123!"}'

# 3. Lấy thông tin user (thay <token> bằng accessToken)
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <token>"
```

## 👤 Tài khoản mẫu (sau khi seed)

| Email | Mật khẩu |
|-------|----------|
| user@novacare.vn | Password123! |

## 📁 Cấu trúc dự án

```
nova-care-backend/
├── src/
│   ├── common/            # Guards, Decorators, Filters, Interceptors
│   ├── config/            # Cấu hình ứng dụng
│   ├── database/          # Prisma service & module
│   └── modules/
│       ├── auth/          # Xác thực (JWT)
│       ├── users/         # Người dùng
│       └── patient-profiles/ # Hồ sơ bệnh nhân
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Dữ liệu mẫu
├── Dockerfile
├── docker-compose.yml
└── prisma.config.ts
```
