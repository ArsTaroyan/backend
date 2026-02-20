import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthDto } from './auth.dto';
import { User } from './user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(dto: AuthDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepo.create({
      username: dto.username,
      password: hashedPassword,
    });

    await this.usersRepo.save(user);

    const tokens = await this.generateTokens(user.id);

    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  async login(dto: AuthDto) {
    const user = await this.usersRepo.findOne({
      where: { username: dto.username },
    });

    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(dto.password, user.password);

    if (!valid) throw new UnauthorizedException();

    const tokens = await this.generateTokens(user.id);

    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  private async generateTokens(userId: number) {
    const accessToken = this.jwtService.sign(
      { sub: userId },
      { expiresIn: '15m' },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId },
      { expiresIn: '7d' },
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  private async updateRefreshToken(userId: number, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);

    await this.usersRepo.update(userId, {
      refreshToken: hashed,
    });
  }

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException();
    }

    const user = await this.usersRepo.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshToken) throw new UnauthorizedException();

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!isMatch) throw new UnauthorizedException();

    const tokens = await this.generateTokens(user.id);

    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }
}
