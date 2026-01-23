// src/plaza/plaza.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicHabit } from './entities/public-habit.entity';
import { PublicHabitLike, PublicHabitComment, PublicHabitCheckIn } from './entities/interactions.entity';
import { CreatePublicHabitDto } from './dto/create-public-habit.dto';
import { HabitsService } from '../habits/habits.service'; // 跨模块调用

@Injectable()
export class PlazaService {
  constructor(
    @InjectRepository(PublicHabit)
    private publicHabitRepo: Repository<PublicHabit>,
    @InjectRepository(PublicHabitLike)
    private likeRepo: Repository<PublicHabitLike>,
    @InjectRepository(PublicHabitComment)
    private commentRepo: Repository<PublicHabitComment>,
    @InjectRepository(PublicHabitCheckIn)
    private checkInRepo: Repository<PublicHabitCheckIn>,
    // 注入 HabitsService 用于 "Add to my check in"
    private habitsService: HabitsService, 
  ) {}

  // 1. 创建广场任务
  async create(dto: CreatePublicHabitDto, userId: number) {
    const habit = this.publicHabitRepo.create({ ...dto, creatorId: userId });
    return this.publicHabitRepo.save(habit);
  }

  // 2. 获取广场列表 (核心复杂查询：包含统计数据)
  async findAll(currentUserId: number) {
    // 使用原生 SQL 查询获取随机记录
    let habits;
    try {
      // 先获取所有记录的 ID
      const allHabits = await this.publicHabitRepo.find({
        relations: ['creator'],
      });
      
      // 随机打乱顺序
      const shuffled = allHabits.sort(() => Math.random() - 0.5);
      habits = shuffled.slice(0, 10);
    } catch (error) {
      // 如果出错，使用默认排序
      console.error('Error fetching habits:', error);
      habits = await this.publicHabitRepo.find({
        relations: ['creator'],
        order: { createdAt: 'DESC' },
        take: 10,
      });
    }
    const todayStr = new Date().toISOString().split('T')[0];
  
    // 补充计算：1. 今日打卡人数，2. 点赞总数，3. 我是否点赞
    const enrichedHabits = await Promise.all(habits.map(async (h) => {
      // 统计今日打卡人数
      const todayCount = await this.checkInRepo.count({
        where: { publicHabitId: h.id, date: todayStr }
      });
      
      // 统计点赞总数 - 新增
      const likesCount = await this.likeRepo.count({
        where: { publicHabitId: h.id }
      });
      
      // 检查我是否点赞
      const isLiked = await this.likeRepo.findOne({
        where: { publicHabitId: h.id, userId: currentUserId }
      });
  
      return {
        ...h,
        todayCheckInCount: todayCount,
        likesCount: likesCount, // 添加点赞总数
        isLikedByMe: !!isLiked, // 当前用户是否点赞
        isSharedByUser: h.creatorId === currentUserId, // 标记是否是当前用户发布的
      };
    }));
  
    return enrichedHabits;
  }

  // 3. 在广场直接打卡 (UI上的 "Check in" 按钮)
  async checkIn(id: number, userId: number) {
    const todayStr = new Date().toISOString().split('T')[0];
    const exists = await this.checkInRepo.findOne({
      where: { publicHabitId: id, userId, date: todayStr }
    });
    
    if (exists) {
        throw new BadRequestException('今天已经在这个广场任务打过卡了');
    }

    await this.checkInRepo.save({ publicHabitId: id, userId, date: todayStr });
    return { message: '广场打卡成功' };
  }

  // 4. 加入我的打卡 (UI上的 "Add to my check in")
  async addToMyHabits(id: number, userId: number) {
    const publicHabit = await this.publicHabitRepo.findOneBy({ id });
    if (!publicHabit) throw new NotFoundException('任务不存在');

    // 调用 HabitsService 创建个人习惯
    // HabitsService.create 方法内部会检查重复，所以这里直接调用即可
    // 如果重复，会抛出 BadRequestException
    return this.habitsService.create(
      { name: publicHabit.title }, // 使用广场任务的标题
      userId
    );
  }

  // 5. 点赞/取消点赞
  async toggleLike(id: number, userId: number) {
    const existing = await this.likeRepo.findOne({ where: { publicHabitId: id, userId } });
    if (existing) {
      await this.likeRepo.remove(existing);
      return { isLiked: false };
    } else {
      await this.likeRepo.save({ publicHabitId: id, userId });
      return { isLiked: true };
    }
  }

  // 6. 发表评论
  async addComment(id: number, content: string, userId: number) {
    const comment = this.commentRepo.create({
      publicHabitId: id,
      userId,
      content
    });
    return this.commentRepo.save(comment);
  }

  // 7. 获取某任务的评论列表
  async getComments(id: number) {
    return this.commentRepo.find({
      where: { publicHabitId: id },
      relations: ['user'], // 关联评论者信息
      order: { createdAt: 'DESC' }
    });
  }

  // 8. 删除广场卡片（只有创建者可以删除）
  async remove(id: number, userId: number) {
    const publicHabit = await this.publicHabitRepo.findOneBy({ id });
    if (!publicHabit) {
      throw new NotFoundException('广场卡片不存在');
    }

    // 检查是否是创建者
    if (publicHabit.creatorId !== userId) {
      throw new BadRequestException('您无权删除此卡片');
    }

    await this.publicHabitRepo.remove(publicHabit);
    return { message: '删除成功' };
  }
}