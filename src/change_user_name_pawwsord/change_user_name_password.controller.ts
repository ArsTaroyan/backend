import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ChangeUserNamePasswordService } from './change_user_name_password.service';
import { ChangePasswordDto } from './model/changepassword.dto';
import { ChangeNameDto } from './model/changename.dto';
import { JwtAuthGuard } from 'src/jwt/jwt-auth.guard';

type AuthedRequest = Request & { user: { userId: number } };

@Controller('change')
@UseGuards(JwtAuthGuard)
export class ChangeUserNamePasswordController {
  constructor(private service: ChangeUserNamePasswordService) {}

  @Post('username')
  changeUsername(@Req() req: AuthedRequest, @Body() dto: ChangeNameDto) {
    return this.service.changeUsername(req.user.userId, dto);
  }

  @Post('password')
  changePassword(@Req() req: AuthedRequest, @Body() dto: ChangePasswordDto) {
    return this.service.changePassword(req.user.userId, dto);
  }
}
