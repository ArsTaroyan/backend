import { OnGatewayConnection, WebSocketGateway } from '@nestjs/websockets';
import { IncomingMessage } from 'http';
import { JwtService } from '@nestjs/jwt';
import { WebSocket } from 'ws';
import { ChatService } from './chat.service';

@WebSocketGateway({ path: '/chat' })
export class ChatGateway implements OnGatewayConnection {
  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  private readonly rooms = new Map<number, Set<WebSocket>>();
  private readonly clientCtx = new WeakMap<WebSocket, { chatId: number; userId: number }>();

  async handleConnection(client: WebSocket, req: IncomingMessage) {
    const parsed = this.parseUrl(req.url || '');
    if (!parsed) {
      client.close(1008, 'Invalid URL');
      return;
    }

    const { chatId, token } = parsed;
    if (!token) {
      client.close(1008, 'Missing token');
      return;
    }

    let userId: number;
    try {
      const payload = this.jwtService.verify<{ sub: number }>(token);
      userId = Number(payload?.sub);
    } catch {
      client.close(1008, 'Invalid token');
      return;
    }

    if (!Number.isInteger(userId)) {
      client.close(1008, 'Invalid user');
      return;
    }

    const isParticipant = await this.chatService.isParticipant(chatId, userId);
    if (!isParticipant) {
      client.close(1008, 'Forbidden');
      return;
    }

    this.addClient(chatId, userId, client);

    client.on('message', (raw) => {
      void this.handleIncomingMessage(client, raw);
    });
    client.on('close', () => this.removeClient(client));
    client.on('error', () => this.removeClient(client));

    client.send(
      JSON.stringify({
        type: 'connected',
        chatId,
      }),
    );
  }

  private parseUrl(rawUrl: string) {
    try {
      const url = new URL(rawUrl, 'http://localhost');
      if (url.pathname !== '/chat') return null;
      const chatId = Number(url.searchParams.get('chatId'));
      if (!Number.isInteger(chatId) || chatId <= 0) return null;

      return {
        chatId,
        token: url.searchParams.get('token') || '',
      };
    } catch {
      return null;
    }
  }

  private addClient(chatId: number, userId: number, client: WebSocket) {
    const room = this.rooms.get(chatId) || new Set<WebSocket>();
    room.add(client);
    this.rooms.set(chatId, room);
    this.clientCtx.set(client, { chatId, userId });
  }

  private removeClient(client: WebSocket) {
    const ctx = this.clientCtx.get(client);
    if (!ctx) return;

    const room = this.rooms.get(ctx.chatId);
    if (room) {
      room.delete(client);
      if (room.size === 0) this.rooms.delete(ctx.chatId);
    }
    this.clientCtx.delete(client);
  }

  private async handleIncomingMessage(client: WebSocket, raw: WebSocket.RawData) {
    const ctx = this.clientCtx.get(client);
    if (!ctx) return;

    const text = this.extractText(raw);
    if (!text) {
      client.send(JSON.stringify({ type: 'error', message: 'Message text is required' }));
      return;
    }

    try {
      const saved = await this.chatService.createMessage(ctx.chatId, ctx.userId, text);

      this.broadcastToRoom(ctx.chatId, {
        id: saved.id,
        chatId: ctx.chatId,
        senderId: saved.senderId,
        text: saved.text,
        createdAt: saved.createdAt,
      });
    } catch {
      client.send(JSON.stringify({ type: 'error', message: 'Cannot send message' }));
    }
  }

  private extractText(raw: WebSocket.RawData): string {
    const data = raw.toString();
    try {
      const parsed = JSON.parse(data) as { text?: string };
      return (parsed.text || '').trim();
    } catch {
      return data.trim();
    }
  }

  private broadcastToRoom(chatId: number, payload: object) {
    const room = this.rooms.get(chatId);
    if (!room) return;

    const encoded = JSON.stringify(payload);
    for (const client of room) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(encoded);
      }
    }
  }
}
