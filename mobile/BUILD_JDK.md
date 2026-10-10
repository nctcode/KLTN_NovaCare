# JDK để build Android

Project dùng **JetBrains JDK 21** đi kèm Android Studio, có cả
`bin/java.exe`, `bin/javac.exe` và `bin/jlink.exe`.

Trên máy hiện tại, thư mục JDK là `D:/Android/Android Studio/jbr`.
`gradle.properties` cấu hình cả `org.gradle.java.home` và
`org.gradle.java.installations.paths` tới thư mục này, đồng thời tắt tự dò
và tự tải JDK. Khi chuyển máy hoặc thay vị trí cài Android Studio, cập nhật
cả hai đường dẫn tới một JetBrains JDK 21 đầy đủ trên máy đó.

## Vì sao lỗi thiếu jlink xuất hiện lại?

`gradle/gradle-daemon-jvm.properties` có độ ưu tiên cao hơn `JAVA_HOME` và
`org.gradle.java.home`. Trước đây file này chỉ yêu cầu Java 21, nên Gradle
có thể chọn runtime trong extension Red Hat của IDE, vốn thiếu `jlink.exe`.
Chỉ đổi `JAVA_HOME`, tắt configuration cache hoặc xóa cache không giải quyết
nguồn chọn JVM. Tiêu chí daemon hiện yêu cầu thêm vendor `JETBRAINS`.

## Sau khi cập nhật cấu hình

1. Dừng build đang chạy trong Android Studio.
2. Mở terminal tại thư mục `mobile`, chạy:

   ```powershell
   .\gradlew.bat --stop
   .\gradlew.bat :app:assembleDebug
   ```

3. Trong Android Studio, Sync Project with Gradle Files rồi Run lại.
4. Nếu IDE yêu cầu chọn Gradle JDK/JVM, dùng JetBrains JDK 21 ở đường dẫn
   trên; không chọn runtime trong thư mục extension `.antigravity-ide`.

Để xem JVM thực sự chạy build, dùng `:app:assembleDebug --info` và kiểm tra
đường dẫn daemon/JVM trong log. Không cần cài lại app hoặc xóa toàn bộ cache
để sửa lỗi chọn JDK này.

Tham khảo: [Gradle Daemon JVM criteria](https://docs.gradle.org/current/userguide/gradle_daemon.html#sec:daemon_jvm_criteria).
