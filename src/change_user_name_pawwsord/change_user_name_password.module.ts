import { Module } from '@nestjs/common';
import { ChangeUserNamePasswordService } from './change_user_name_password.service';
import { ChangeUserNamePasswordController } from './change_user_name_password.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/auth/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from 'src/jwt/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET 
    }),
  ],
  providers: [ChangeUserNamePasswordService, JwtStrategy],
  controllers: [ChangeUserNamePasswordController],
})
export class ChangeUserNamePasswordModule {}
