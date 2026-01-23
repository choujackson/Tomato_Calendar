// src/focus/focus.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FocusRecord } from './focus-record.entity';
import { CreateFocusDto } from './dto/create-focus.dto';

@Injectable()
export class FocusService {
  constructor(
    @InjectRepository(FocusRecord)
    private focusRepo: Repository<FocusRecord>,
  ) {}

  // 1. 完成一次番茄钟
  async finishFocus(userId: number, dto: CreateFocusDto) {
    const record = this.focusRepo.create({
      userId,
      duration: dto.duration || 25, // 默认 25 分钟
      tag: dto.tag,
    });
    return this.focusRepo.save(record);
  }

  // 2. 获取用户的专注统计数据
  async getStats(userId: number) {
    // 统计总次数 (count) 和 总时长 (sum duration)
    const result = await this.focusRepo
      .createQueryBuilder('record')
      .select('COUNT(record.id)', 'totalCount')
      .addSelect('SUM(record.duration)', 'totalMinutes')
      .where('record.userId = :userId', { userId })
      .getRawOne();

    return {
      totalCount: Number(result.totalCount) || 0,     // 累计次数
      totalMinutes: Number(result.totalMinutes) || 0, // 累计分钟数
    };
  }

  // 3. 获取最近的记录列表（可选，用于展示历史）
  async getHistory(userId: number) {
    return this.focusRepo.find({
      where: { userId },
      order: { completedAt: 'DESC' },
      take: 20, // 只返回最近20条
    });
  }
}