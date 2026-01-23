// src/auth/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // 修改这里：添加 "|| 'secret'" 作为兜底，或者使用 "as string"
      // 这里的逻辑是：尝试获取配置，如果没有配置，就使用空字符串（这会导致运行时错误，但在编译时能通过）
      // 更好的方式是确保你的 .env 文件里有这个值
      secretOrKey: configService.get<string>('JWT_SECRET') as string, 
    });
  }

  // 验证通过后，Payload (Token 里的数据) 会被传进来
  async validate(payload: any) {
    // 返回的对象会被自动挂载到 req.user 上
    return { userId: payload.sub, email: payload.email };
  }
}