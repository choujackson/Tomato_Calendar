// src/users/users.controller.ts
import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SendCodeDto } from './dto/send-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 注册验证码
  @Post('send-code')
  async sendCode(@Body() sendCodeDto: SendCodeDto) {
    // 注意：这里改名为了 sendRegisterVerificationCode
    await this.usersService.sendRegisterVerificationCode(sendCodeDto.email);
    return { message: '验证码已发送，请检查您的邮箱。' };
  }

  // 注册
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.register(createUserDto);
    return { message: '注册成功', user };
  }

  // 1. 发送重置验证码
  @Post('send-reset-code')
  async sendResetCode(@Body() sendCodeDto: SendCodeDto) {
    // 复用 SendCodeDto，因为它只需要 email
    await this.usersService.sendForgotPasswordCode(sendCodeDto.email);
    return { message: '重置验证码已发送，请检查您的邮箱。' };
  }

  // 2. 执行重置密码
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.usersService.resetPassword(resetPasswordDto);
    return { message: '密码重置成功，请使用新密码登录。' };
  }
}