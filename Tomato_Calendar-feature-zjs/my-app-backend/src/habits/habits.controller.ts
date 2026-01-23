import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HabitsService } from './habits.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { AuthGuard } from '@nestjs/passport';
import { Habit } from './habit.entity';
import { PublicHabit } from '../plaza/entities/public-habit.entity';

@Controller('habits')
@UseGuards(AuthGuard('jwt')) // 开启认证保护
export class HabitsController {
  constructor(
    private readonly habitsService: HabitsService,
    @InjectRepository(Habit)
    private habitRepository: Repository<Habit>,
    @InjectRepository(PublicHabit)
    private publicHabitRepository: Repository<PublicHabit>,
  ) {}

  // 创建习惯
  @Post()
  create(@Request() req, @Body() createHabitDto: CreateHabitDto) {
    return this.habitsService.create(createHabitDto, req.user.userId);
  }

  // 获取列表 (包含 streak 和 checkedInToday)
  @Get()
  findAll(@Request() req) {
    return this.habitsService.findAll(req.user.userId);
  }

  // 打卡动作
  @Post(':id/check-in')
  async checkIn(@Request() req, @Param('id') id: string) {
    await this.habitsService.checkIn(+id, req.user.userId);
    return { message: '打卡成功！' };
  }

  // 删除习惯
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.habitsService.remove(+id, req.user.userId);
  }

  // 分享习惯到打卡广场
  @Post(':id/share')
  async shareToPlaza(@Request() req, @Param('id') id: string) {
    const habitId = +id;
    const userId = req.user.userId;

    // 获取习惯信息
    const habit = await this.habitRepository.findOne({
      where: { id: habitId, userId },
    });

    if (!habit) {
      throw new NotFoundException('习惯不存在');
    }

    // 验证标题：必须是单个单词且长度不超过15
    const title = habit.name.trim();
    const words = title.split(/\s+/);
    
    if (words.length !== 1) {
      throw new BadRequestException('标题必须是单个单词（不能包含空格）');
    }
    
    if (title.length > 15) {
      throw new BadRequestException('标题不能超过15个字符');
    }

    // 创建广场任务
    const publicHabit = this.publicHabitRepository.create({
      title,
      creatorId: userId,
    });

    return this.publicHabitRepository.save(publicHabit);
  }
}