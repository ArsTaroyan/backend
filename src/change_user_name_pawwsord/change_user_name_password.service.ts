import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ChangeNameDto } from './model/changename.dto';
import { ChangePasswordDto } from './model/changepassword.dto';

@Injectable()
export class ChangeUserNamePasswordService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async changeUsername(userId: number, dto: ChangeNameDto) {
    const existing = await this.usersRepo.findOne({
      where: { username: dto.newUsername },
    });
    if (existing) throw new ConflictException('Username already taken');

    await this.usersRepo.update(userId, { username: dto.newUsername });
    return { message: 'Username updated' };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const isValid = await bcrypt.compare(dto.oldPassword, user.password);

    if (!isValid) {
      throw new UnauthorizedException('Old password incorrect');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);

    await this.usersRepo.update(userId, {
      password: hashed,
    });

    return { message: 'Password updated' };
  }
}
