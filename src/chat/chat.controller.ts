import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/jwt/jwt-auth.guard';

type AuthedReq = { user: { userId: number } };

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chat: ChatService) {}

  @Get('search')
  search(@Req() req: AuthedReq, @Query('q') q: string) {
    return this.chat.searchUsers(req.user.userId, (q || '').trim());
  }

  @Get('conversations')
  conversations(@Req() req: AuthedReq) {
    return this.chat.getConversations(req.user.userId);
  }

  @Get(':chatId/messages')
  messages(@Req() req: AuthedReq, @Param('chatId') chatId: string) {
    return this.chat.getMessages(Number(chatId), req.user.userId);
  }

  @Post('start/:userId')
  start(@Req() req: AuthedReq, @Param('userId') userId: string) {
    return this.chat.getOrCreateConversation(req.user.userId, Number(userId));
  }
}