// src/focus/focus.controller.ts
import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FocusService } from './focus.service';
import { CreateFocusDto } from './dto/create-focus.dto';

@Controller('focus')
@UseGuards(AuthGuard('jwt')) // 开启 JWT 认证
export class FocusController {
  constructor(private readonly focusService: FocusService) {}

  // 完成番茄钟：POST /focus/finish
  @Post('finish')
  finish(@Request() req, @Body() dto: CreateFocusDto) {
    return this.focusService.finishFocus(req.user.userId, dto);
  }

  // 获取统计数据：GET /focus/stats
  @Get('stats')
  getStats(@Request() req) {
    return this.focusService.getStats(req.user.userId);
  }

  // 获取历史记录：GET /focus/history
  @Get('history')
  getHistory(@Request() req) {
    return this.focusService.getHistory(req.user.userId);
  }
}