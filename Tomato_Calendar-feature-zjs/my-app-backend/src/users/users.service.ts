// src/users/users.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class UsersService {
  // 存储验证码的 Map
  // Key 的格式现在改为: "用途:邮箱", 例如 "register:abc@qq.com" 或 "reset:abc@qq.com"
  private verificationCodes: Map<string, { code: string; expires: number }> =
    new Map();

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly mailerService: MailerService,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }
  
  /**
   * 通用：生成并发送验证码
   * @param email 邮箱
   * @param subject 邮件标题
   * @param type 类型前缀 ('register' | 'reset')
   */
  private async sendCode(email: string, subject: string, type: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10分钟

    // 使用带前缀的 Key 存储，防止用途混淆
    const key = `${type}:${email}`;
    this.verificationCodes.set(key, { code, expires });

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: subject,
        html: `
          <p>您好！</p>
          <p>您正在进行 <b>${subject}</b> 操作。</p>
          <p>您的验证码是：</p>
          <h2 style="text-align:center;color:#1890ff;">${code}</h2>
          <p>该验证码将在10分钟内失效。</p>
        `,
      });
    } catch (error: any) {
      console.error('邮件发送失败:', error);
      console.error('错误详情:', {
        message: error?.message,
        code: error?.code,
        response: error?.response,
        responseCode: error?.responseCode,
        command: error?.command,
      });
      
      // 提供更具体的错误信息
      let errorMessage = '邮件发送失败，请稍后重试';
      if (error?.code === 'EAUTH') {
        errorMessage = 'SMTP认证失败，请检查邮箱配置和授权码是否正确';
      } else if (error?.code === 'EENVELOPE') {
        errorMessage = '发件人地址配置错误，请检查MAIL_FROM和MAIL_USER是否一致';
      } else if (error?.message) {
        errorMessage = `邮件发送失败: ${error.message}`;
      }
      
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * 通用：验证验证码
   */
  private verifyCode(email: string, code: string, type: string) {
    const key = `${type}:${email}`;
    const storedCode = this.verificationCodes.get(key);

    if (!storedCode || storedCode.code !== code) {
      throw new BadRequestException('验证码不正确');
    }
    if (Date.now() > storedCode.expires) {
      this.verificationCodes.delete(key);
      throw new BadRequestException('验证码已过期');
    }
    // 验证成功后删除
    this.verificationCodes.delete(key);
  }

  async sendRegisterVerificationCode(email: string): Promise<void> {
    const existingUser = await this.usersRepository.findOneBy({ email });
    if (existingUser) {
      throw new BadRequestException('该邮箱已被注册');
    }
    // 发送类型为 'register' 的验证码
    await this.sendCode(email, '注册账号', 'register');
  }

  async register(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, code } = createUserDto;

    // 验证类型为 'register' 的验证码
    this.verifyCode(email, code, 'register');

    const existingUser = await this.usersRepository.findOneBy({ email });
    if (existingUser) {
      throw new BadRequestException('该邮箱已被注册');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const defaultUsername = `User_${email.split('@')[0]}`;
    const defaultSignature = 'Nothing~';

    const newUser = this.usersRepository.create({
      email,
      password: hashedPassword,
      username: defaultUsername,
      signature: defaultSignature,
    });

    const savedUser = await this.usersRepository.save(newUser);
    delete savedUser.password;
    return savedUser;
  }

  /**
   * 1. 发送重置密码验证码
   */
  async sendForgotPasswordCode(email: string): Promise<void> {
    const existingUser = await this.usersRepository.findOneBy({ email });
    if (!existingUser) {
      // 出于安全考虑，即使用户不存在，有时候也提示"发送成功"防止被扫描邮箱
      // 但为了用户体验，这里我们明确提示错误，或者也可以抛出异常
      throw new NotFoundException('该邮箱未注册');
    }
    // 发送类型为 'reset' 的验证码
    await this.sendCode(email, '重置密码', 'reset');
  }

  /**
   * 2. 重置密码
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { email, code, newPassword } = resetPasswordDto;

    // 验证类型为 'reset' 的验证码
    this.verifyCode(email, code, 'reset');

    const user = await this.usersRepository.findOneBy({ email });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 加密新密码
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 更新密码
    user.password = hashedPassword;
    await this.usersRepository.save(user);
  }
}