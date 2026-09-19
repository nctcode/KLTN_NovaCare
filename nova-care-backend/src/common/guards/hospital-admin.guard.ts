import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

@Injectable()
export class HospitalAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Chưa xác thực người dùng');
    }

    // 1. Super Admin: Chỉ có quyền Xem / Giám sát nội bộ bệnh viện (chỉ cho phép GET)
    if (user.role === Role.ADMIN) {
      if (request.method !== 'GET') {
        throw new ForbiddenException(
          'Quản trị viên Nền tảng chỉ có quyền Xem/Giám sát, không được trực tiếp can thiệp vận hành nội bộ của Bệnh viện'
        );
      }
      request.targetHospitalId =
        request.params?.hospitalId ||
        request.query?.hospitalId ||
        request.body?.hospitalId ||
        null;
      return true;
    }

    // 2. Hospital Admin: Chỉ được quản lý bệnh viện của mình
    if (user.role === Role.HOSPITAL_ADMIN) {
      if (!user.hospitalId) {
        throw new ForbiddenException(
          'Tài khoản Quản trị viên chưa được liên kết với cơ sở y tế nào'
        );
      }

      // Kiểm tra xem request có cố tình gửi ID của viện khác không
      const requestedHospitalId =
        request.params?.hospitalId ||
        request.query?.hospitalId ||
        request.body?.hospitalId;

      if (
        requestedHospitalId &&
        requestedHospitalId !== user.hospitalId
      ) {
        throw new ForbiddenException(
          'Từ chối truy cập: Bạn không có quyền thao tác trên cơ sở y tế này'
        );
      }

      // Gắn chặt hospitalId vào request
      request.targetHospitalId = user.hospitalId;
      return true;
    }

    throw new ForbiddenException(
      'Yêu cầu quyền Quản trị viên Bệnh viện (HOSPITAL_ADMIN) hoặc Quản trị viên Nền tảng (ADMIN)'
    );
  }
}
