// src/users/dto/create-user.dto.ts
import { IsEmail, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度不能少于6位' })
  @MaxLength(20, { message: '密码长度不能超过20位' })
  password: string;

  @IsNotEmpty({ message: '验证码不能为空' })
  code: string;
}