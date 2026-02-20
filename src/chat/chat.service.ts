import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, QueryFailedError, Repository } from 'typeorm';
import { User } from 'src/auth/user.entity';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Conversation) private convRepo: Repository<Conversation>,
    @InjectRepository(Message) private msgRepo: Repository<Message>,
  ) {}

  async searchUsers(meId: number, q: string) {
    return this.usersRepo.find({
      where: { username: ILike(`%${q}%`) },
      take: 20,
    }).then(list => list.filter(u => u.id !== meId));
  }

  private normalizePair(a: number, b: number) {
    return a < b ? [a, b] : [b, a];
  }

  async getOrCreateConversation(meId: number, otherId: number) {
    if (!Number.isInteger(otherId) || otherId <= 0) {
      throw new BadRequestException('Invalid user id');
    }
    if (meId === otherId) {
      throw new BadRequestException('Cannot start chat with yourself');
    }

    const otherUser = await this.usersRepo.findOne({ where: { id: otherId } });
    if (!otherUser) {
      throw new NotFoundException('User not found');
    }

    const [userAId, userBId] = this.normalizePair(meId, otherId);

    let conv = await this.convRepo.findOne({ where: { userAId, userBId } });
    if (!conv) {
      try {
        conv = this.convRepo.create({
          userAId,
          userBId,
          userA: { id: userAId } as any,
          userB: { id: userBId } as any,
          lastMessage: null,
        });
        conv = await this.convRepo.save(conv);
      } catch (error) {
        if (error instanceof QueryFailedError) {
          const dbError = error as QueryFailedError & { code?: string };

          if (dbError.code === '23505') {
            const existing = await this.convRepo.findOne({ where: { userAId, userBId } });
            if (existing) return existing;
          }
        }
        throw error;
      }
    }
    return conv;
  }

  async isParticipant(conversationId: number, meId: number) {
    const conv = await this.convRepo.findOne({ where: { id: conversationId } });
    if (!conv) return false;
    return conv.userAId === meId || conv.userBId === meId;
  }

  async getConversations(meId: number) {
    const convs = await this.convRepo.find({
      where: [{ userAId: meId }, { userBId: meId }],
      order: { updatedAt: 'DESC' },
    });

    return convs.map(c => {
      const participant = c.userAId === meId ? c.userB : c.userA;
      return {
        id: c.id,
        participant: { id: participant.id, username: participant.username },
        lastMessage: c.lastMessage ?? '',
      };
    });
  }

  async getMessages(conversationId: number, meId: number) {
    const ok = await this.isParticipant(conversationId, meId);
    if (!ok) throw new ForbiddenException();

    return this.msgRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      take: 500,
    });
  }

  async createMessage(conversationId: number, senderId: number, text: string) {
    const ok = await this.isParticipant(conversationId, senderId);
    if (!ok) throw new ForbiddenException();
    const trimmed = text.trim();
    if (!trimmed) throw new BadRequestException('Message text is required');

    const msg = await this.msgRepo.save(
      this.msgRepo.create({
        conversationId,
        senderId,
        text: trimmed,
      }),
    );

    await this.convRepo.update(conversationId, { lastMessage: trimmed });
    return msg;
  }
}
