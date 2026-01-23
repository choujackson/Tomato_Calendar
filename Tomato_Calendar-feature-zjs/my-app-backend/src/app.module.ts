import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { AuthModule } from './auth/auth.module';
import { HabitsModule } from './habits/habits.module';
import { FocusModule } from './focus/focus.module';
import { PlazaModule } from './plaza/plaza.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 使配置在全局可用
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // 开发环境中设为 true，它会自动创建数据库表。生产环境中应设为 false 并使用迁移。
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mailUser = configService.get<string>('MAIL_USER');
        const mailFrom = configService.get<string>('MAIL_FROM');
        
        // 确保发件人邮箱地址与认证用户一致
        // 如果MAIL_FROM未配置，则自动生成；如果已配置，确保邮箱地址使用MAIL_USER
        let fromAddress: string;
        if (!mailFrom) {
          // 未配置MAIL_FROM，自动生成
          fromAddress = `"Tomato Calendar" <${mailUser}>`;
        } else {
          // 已配置MAIL_FROM，提取显示名称，但使用MAIL_USER的邮箱地址
          // 匹配格式："显示名称" <邮箱地址> 或 邮箱地址
          const nameMatch = mailFrom.match(/^"([^"]+)"\s*<(.+)>$/);
          const displayName = nameMatch ? nameMatch[1] : 'Tomato Calendar';
          fromAddress = `"${displayName}" <${mailUser}>`;
        }
        
        return {
          transport: {
            host: configService.get<string>('MAIL_HOST'),
            // secure 选项是关键！
            secure: true, // 因为我们用的是 465 端口，所以这里必须是 true
            port: configService.get<number>('MAIL_PORT'),
            auth: {
              user: mailUser,
              pass: configService.get<string>('MAIL_PASSWORD'),
            },
          },
          defaults: {
            from: fromAddress,
          },
        };
      },
    }),
    UsersModule,
    EventsModule,
    AuthModule,
    HabitsModule,
    FocusModule,
    PlazaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}