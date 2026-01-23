import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habit } from './habit.entity';
import { CheckIn } from './check-in.entity';
import { CreateHabitDto } from './dto/create-habit.dto';

@Injectable()
export class HabitsService {
  constructor(
    @InjectRepository(Habit)
    private habitsRepository: Repository<Habit>,
    @InjectRepository(CheckIn)
    private checkInsRepository: Repository<CheckIn>,
  ) {}

  // 1. 创建习惯
  async create(createHabitDto: CreateHabitDto, userId: number): Promise<Habit> {
    // 检查是否已存在同名习惯
    const existingHabit = await this.habitsRepository.findOne({
      where: {
        name: createHabitDto.name.trim(),
        userId,
      },
    });

    if (existingHabit) {
      throw new BadRequestException('您已拥有同名打卡卡片，无法重复创建');
    }

    const habit = this.habitsRepository.create({
      ...createHabitDto,
      userId,
    });
    return this.habitsRepository.save(habit);
  }

  // 2. 获取用户的所有习惯（包含今日是否打卡状态和连续天数）
  async findAll(userId: number): Promise<any[]> {
    const habits = await this.habitsRepository.find({
      where: { userId },
      order: { id: 'ASC' },
    });

    // 并行计算每个习惯的连续天数和今日状态
    const results = await Promise.all(
      habits.map(async (habit) => {
        const streak = await this.calculateStreak(habit.id);
        const checkedInToday = await this.isCheckedInToday(habit.id);
        return {
          ...habit,
          streak,
          checkedInToday,
        };
      }),
    );

    return results;
  }

  // 3. 执行打卡
  async checkIn(habitId: number, userId: number): Promise<void> {
    // 检查习惯是否存在且属于该用户
    const habit = await this.habitsRepository.findOneBy({ id: habitId, userId });
    if (!habit) {
      throw new NotFoundException('习惯不存在');
    }

    // 获取今日日期字符串 (YYYY-MM-DD)
    const todayStr = new Date().toISOString().split('T')[0];

    // 检查今日是否已经打卡
    const existingCheckIn = await this.checkInsRepository.findOne({
      where: {
        habitId,
        date: todayStr,
      },
    });

    if (existingCheckIn) {
      throw new BadRequestException('今天已经打过卡了');
    }

    // 创建打卡记录
    const checkIn = this.checkInsRepository.create({
      date: todayStr,
      habitId,
      userId,
    });

    await this.checkInsRepository.save(checkIn);
  }

  // 4. 删除习惯
  async remove(id: number, userId: number): Promise<void> {
    const habit = await this.habitsRepository.findOneBy({ id, userId });
    if (!habit) {
      throw new NotFoundException('习惯不存在');
    }
    await this.habitsRepository.remove(habit);
  }

  // --- 辅助方法 ---

  // 辅助：检查今日是否打卡
  private async isCheckedInToday(habitId: number): Promise<boolean> {
    const todayStr = new Date().toISOString().split('T')[0];
    const count = await this.checkInsRepository.count({
      where: { habitId, date: todayStr },
    });
    return count > 0;
  }

  // 辅助：计算连续打卡天数 (Streak)
  private async calculateStreak(habitId: number): Promise<number> {
    // 获取该习惯的所有打卡记录，按日期倒序排列
    const checkIns = await this.checkInsRepository.find({
      where: { habitId },
      order: { date: 'DESC' },
    });

    if (checkIns.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    // 抹去时间部分，只保留日期
    today.setHours(0, 0, 0, 0);

    // 检查最近一次打卡是否是今天或昨天
    // 如果最近一次打卡是前天，那连续天数已经断了，归零（或者归零前不需要继续计算）
    const lastCheckInDate = new Date(checkIns[0].date);
    lastCheckInDate.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(today.getTime() - lastCheckInDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    // 如果最近一次打卡比昨天还早（差了2天以上），说明断了
    if (diffDays > 1) {
        return 0;
    }

    // 开始倒推计算
    // 逻辑：我们需要一个参照日期，每次往前推一天，看数据库里有没有
    let currentDateToCheck = new Date(checkIns[0].date); // 从最近一次打卡开始算

    for (const checkIn of checkIns) {
        const checkInDate = new Date(checkIn.date);
        
        // 如果这个记录的日期 等于 我们预期的日期
        if (checkInDate.getTime() === currentDateToCheck.getTime()) {
            streak++;
            // 预期日期往前推一天
            currentDateToCheck.setDate(currentDateToCheck.getDate() - 1);
        } else {
            // 日期不连续，中断
            break;
        }
    }

    return streak;
  }
}