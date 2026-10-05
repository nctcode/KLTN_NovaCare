import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UsersService } from '@/modules/users/users.service';
import { ConsultationsService } from './consultations.service';

type AuthenticatedSocket = Socket & { data: { userId?: string } };

@WebSocketGateway({ namespace: '/consultations', cors: { origin: true, credentials: true } })
export class ConsultationsGateway implements OnGatewayConnection, OnGatewayInit {
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(ConsultationsGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly users: UsersService,
    private readonly consultations: ConsultationsService,
  ) {}

  afterInit(server: Server) {
    // Authenticate before the client receives connect and can request a room.
    server.use((client, next) => {
      this.authenticate(client as AuthenticatedSocket)
        .then(() => next())
        .catch(() => next(new Error('Không thể xác thực phiên tư vấn')));
    });
  }

  handleConnection(client: AuthenticatedSocket) {
    if (!client.data.userId) client.disconnect(true);
  }

  private async authenticate(client: AuthenticatedSocket) {
    try {
      const rawToken = client.handshake.auth?.token;
      if (typeof rawToken !== 'string' || !rawToken) throw new Error('missing token');
      const token = rawToken.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: this.config.get<string>('app.jwt.accessSecret'),
      });
      const user = await this.users.findById(payload.sub);
      if (!user?.isActive) throw new Error('inactive user');
      client.data.userId = user.id;
    } catch {
      // Không ghi token hoặc nội dung y tế vào log.
      this.logger.warn(`Từ chối kết nối consultation socket ${client.id}`);
      throw new Error('Unauthorized');
    }
  }

  @SubscribeMessage('consultation.join')
  async join(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { consultationId?: string },
  ) {
    const userId = client.data.userId;
    const consultationId = body?.consultationId;
    if (!userId || !consultationId) throw new WsException('Yêu cầu tham gia không hợp lệ');
    await this.consultations.findOne(consultationId, userId);
    await client.join(this.room(consultationId));
    return { consultationId, joined: true };
  }

  @SubscribeMessage('consultation.leave')
  async leave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { consultationId?: string },
  ) {
    if (body?.consultationId) await client.leave(this.room(body.consultationId));
    return { consultationId: body?.consultationId, joined: false };
  }

  @SubscribeMessage('consultation.typing')
  async typing(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { consultationId?: string; isTyping?: boolean },
  ) {
    const userId = client.data.userId;
    const consultationId = body?.consultationId;
    if (!userId || !consultationId) return;
    client.to(this.room(consultationId)).emit('consultation.typing', {
      consultationId,
      userId,
      isTyping: !!body.isTyping,
    });
  }

  emitMessage(consultationId: string, message: unknown) {
    this.server.to(this.room(consultationId)).emit('consultation.message.created', message);
  }

  emitStatus(consultationId: string, consultation: unknown) {
    this.server.to(this.room(consultationId)).emit('consultation.status.changed', consultation);
  }

  emitReceipt(consultationId: string, receipt: unknown) {
    this.server.to(this.room(consultationId)).emit('consultation.receipt.updated', receipt);
  }

  private room(consultationId: string) {
    return `consultation:${consultationId}`;
  }
}
