import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import type { JwtUserPayload } from '../auth/types';

const wsOrigins = process.env.CORS_ORIGINS?.split(',')
  .map((o) => o.trim())
  .filter(Boolean);

@WebSocketGateway({
  cors: {
    origin: wsOrigins?.length ? wsOrigins : process.env.NODE_ENV !== 'production',
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ??
        (client.handshake.headers.authorization?.replace('Bearer ', '') as string);
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify<JwtUserPayload>(token, {
        secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      });
      client.join(`account:${payload.accountId}`);
      client.join(`user:${payload.sub}`);
      client.data.user = payload;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  emitToAccount(accountId: number, event: string, data: unknown) {
    this.server?.to(`account:${accountId}`).emit(event, data);
  }

  emitPaymentUpdate(accountId: number, payment: unknown) {
    this.emitToAccount(accountId, 'payment:updated', payment);
  }

  emitInvoiceUpdate(accountId: number, invoice: unknown) {
    this.emitToAccount(accountId, 'invoice:updated', invoice);
  }
}
