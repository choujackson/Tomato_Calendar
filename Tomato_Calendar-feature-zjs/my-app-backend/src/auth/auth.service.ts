// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // 验证用户凭证
  async validateUser(email: string, pass: string): Promise<any> {
    // 1. 查找用户
    const user = await this.usersService.findOneByEmail(email);
    // 注意：如果在 Service 中 usersRepository 是 private 的，建议在 UsersService 中添加一个 findByEmail 方法供这里调用
    // 或者将 UsersService 中的 usersRepository 改为 public (为了演示方便，假设您能访问或添加了方法)
    
    // 如果上面的访问受限，请在 UsersService 添加:
    // async findOneByEmail(email: string): Promise<User | null> { return this.usersRepository.findOneBy({ email }); }
    
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
        const { password, ...result } = user;
        return result;
      }
      return null;
  }

  // 登录接口：生成 Token
  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: user, // 可选：同时返回用户信息
    };
  }
}