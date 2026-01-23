// src/plaza/plaza.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Request, Delete } from '@nestjs/common';
import { PlazaService } from './plaza.service';
import { AuthGuard } from '@nestjs/passport';
import { CreatePublicHabitDto } from './dto/create-public-habit.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('plaza')
@UseGuards(AuthGuard('jwt'))
export class PlazaController {
  constructor(private readonly plazaService: PlazaService) {}

  @Post('habits')
  create(@Request() req, @Body() dto: CreatePublicHabitDto) {
    return this.plazaService.create(dto, req.user.userId);
  }

  @Get('habits')
  findAll(@Request() req) {
    return this.plazaService.findAll(req.user.userId);
  }

  // 广场打卡
  @Post('habits/:id/check-in')
  checkIn(@Request() req, @Param('id') id: string) {
    return this.plazaService.checkIn(+id, req.user.userId);
  }

  // 加入我的打卡列表
  @Post('habits/:id/adopt')
  adopt(@Request() req, @Param('id') id: string) {
    return this.plazaService.addToMyHabits(+id, req.user.userId);
  }

  // 点赞
  @Post('habits/:id/like')
  like(@Request() req, @Param('id') id: string) {
    return this.plazaService.toggleLike(+id, req.user.userId);
  }

  // 评论
  @Post('habits/:id/comments')
  addComment(@Request() req, @Param('id') id: string, @Body() dto: CreateCommentDto) {
    return this.plazaService.addComment(+id, dto.content, req.user.userId);
  }

  @Get('habits/:id/comments')
  getComments(@Param('id') id: string) {
    return this.plazaService.getComments(+id);
  }

  // 删除广场卡片（只有创建者可以删除）
  @Delete('habits/:id')
  delete(@Request() req, @Param('id') id: string) {
    return this.plazaService.remove(+id, req.user.userId);
  }
}