# V1 Port Change Report

## Phạm vi

Chỉ chỉnh sửa bản copy độc lập:

`C:\Users\trinh\AppData\Local\Temp\vscode-agent-codex-sandbox-awSb2c\novacare-v1-repro-isolated`

Source V1 gốc và workspace KLTN không bị chỉnh sửa. Không chạy migration, container, E1, E2, E6 hoặc bất kỳ trial nào.

## Thay đổi đã thực hiện

File duy nhất được chỉnh sửa:

`test/occupancy-v1.harness.ts`

Thay đổi cấu hình:

```text
V1_DB_PORT = process.env.V1_DB_PORT || '55408'
```

Guard hiện:

1. Từ chối `V1_DB_PORT` không phải TCP port từ 1 đến 65535.
2. Đọc `DATABASE_URL`.
3. Yêu cầu hostname `127.0.0.1`.
4. Yêu cầu port bằng `V1_DB_PORT`.
5. Yêu cầu database `novacare_occupancy_v1_test`.
6. Ghi `connectionTarget` bằng cùng port đã xác thực.

Port PostgreSQL trong container vẫn là `5432`; host mapping dự kiến là:

```text
127.0.0.1:55408:5432
```

DATABASE_URL dự kiến:

```text
postgresql://<v1-user>:<secret>@127.0.0.1:55408/novacare_occupancy_v1_test?schema=public
```

## Diff thực tế

Diff so với harness trong source V1 gốc chỉ gồm các thay đổi port guard/validation/metadata:

```diff
 const expectedDatabase = 'novacare_occupancy_v1_test';
+const v1DbPort = process.env.V1_DB_PORT || '55408';
+if (!/^([1-9][0-9]{0,4})$/.test(v1DbPort) || Number(v1DbPort) > 65535) {
+  throw new Error('V1_DB_PORT must be a valid TCP port from 1 to 65535.');
+}
 const databaseUrl = process.env.DATABASE_URL;
 ...
-  parsedDatabaseUrl.port !== '55440' ||
+  parsedDatabaseUrl.port !== v1DbPort ||
 ...
-  throw new Error(`Refusing writes: DATABASE_URL must target 127.0.0.1:55440/${expectedDatabase}.`);
+  throw new Error(`Refusing writes: DATABASE_URL must target 127.0.0.1:${v1DbPort}/${expectedDatabase}.`);
 ...
-  connectionTarget: '127.0.0.1:55440/novacare_occupancy_v1_test',
+  connectionTarget: `127.0.0.1:${v1DbPort}/${expectedDatabase}`,
 ```

Không có diff trong transaction, row-level locking, occupancy claim, membership, scenario hoặc fault injection logic.

## Hash trước/sau

| File | Hash trước | Hash sau | Kết luận |
|---|---|---|---|
| `test/occupancy-v1.harness.ts` | `66708f13419bf049d93e9c9702e490071b12e5f760dcd5be423eb576e32d6d0d` | `1d1eebc14d12d471fe047cd8f9907a21c354278bcacead29154b38aaf1b02cc9` | Chỉ thay đổi cấu hình port |
| `src/modules/appointments/occupancy-claim.ts` | `4dbb1d0706f780b1cad36df21cd2dec6fefd11c7e23f388a1da7a30adf06d92c` | `4dbb1d0706f780b1cad36df21cd2dec6fefd11c7e23f388a1da7a30adf06d92c` | Không đổi |
| `src/modules/appointments/appointments.service.ts` | `a1125e0cad2989aba91cd98fc9c648fccaa6be58efe9ef9c9e7e5bb33bf4aaf5` | `a1125e0cad2989aba91cd98fc9c648fccaa6be58efe9ef9c9e7e5bb33bf4aaf5` | Không đổi |
| `src/modules/pre-exam/pre-exam.service.ts` | `b66f45cfa912fe9c1c61efe5fd7948c6c82df301b6e299eb878fff07148bd09f` | `b66f45cfa912fe9c1c61efe5fd7948c6c82df301b6e299eb878fff07148bd09f` | Không đổi |
| `src/modules/pre-exam/pre-exam.module.ts` | `91d2b81845055140e36d5a3de8478627d2d590afd0249e861a8737d4b96fa54d` | `91d2b81845055140e36d5a3de8478627d2d590afd0249e861a8737d4b96fa54d` | Không đổi |
| `src/modules/schedules/slot-status.service.ts` | `efaeeb3bfe8f3260b7dc13e9347893cd70829cb7ef8600ecedb96f43e11098e2` | `efaeeb3bfe8f3260b7dc13e9347893cd70829cb7ef8600ecedb96f43e11098e2` | Không đổi |

## Port safety check

| Kiểm tra | Kết quả |
|---|---|
| Listener trên `55408` | Không phát hiện |
| IPv4 excluded range `55409–55508` | `55408` nằm ngoài range |
| IPv6 excluded range `55409–55508` | `55408` nằm ngoài range |
| Port 5432 | Không sử dụng cho host V1 |

## Build và guard validation

| Kiểm tra | Kết quả |
|---|---|
| `npm run build` | PASS, exit code 0 |
| DATABASE_URL port sai `55440`, V1_DB_PORT `55408` | PASS guard từ chối trước database access |
| V1_DB_PORT sai `99999` | PASS guard từ chối: invalid TCP port |
| DATABASE_URL đúng port `55408`, `V1_REPETITIONS=0` | PASS cấu hình port được chấp nhận; dừng ở validation repetitions trước database access |
| E1/E2/E6 harness trials | Chưa chạy |
| Migration | Chưa chạy |

Các guard test trên chỉ load/validate cấu hình và cố ý dừng trước database access; không có kết nối database thử nghiệm nào được thực hiện.

## Kết luận

**PASS** — port V1 đã được cấu hình theo `V1_DB_PORT`, mặc định an toàn là `55408`. Build thành công, guard hợp lệ/không hợp lệ hoạt động đúng, và các file logic thực nghiệm không thay đổi.

**Trạng thái cuối:** đã hoàn tất thay đổi cấu hình và dừng theo yêu cầu; chưa start container, chưa migration và chưa chạy bất kỳ trial nào.
