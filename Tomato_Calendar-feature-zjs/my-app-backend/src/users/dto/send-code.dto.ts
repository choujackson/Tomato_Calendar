// src/users/dto/send-code.dto.ts
import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendCodeDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;
}