// src/habits/habits.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HabitsService } from './habits.service';
import { HabitsController } from './habits.controller';
import { Habit } from './habit.entity';
import { CheckIn } from './check-in.entity';
import { PublicHabit } from '../plaza/entities/public-habit.entity'; // 导入 PublicHabit 以便在 Controller 中使用
import { PlazaModule } from '../plaza/plaza.module'; // 导入 PlazaModule 以避免循环依赖

@Module({
  imports: [
    TypeOrmModule.forFeature([Habit, CheckIn, PublicHabit]), // 添加 PublicHabit 到 TypeOrmModule
    forwardRef(() => PlazaModule), // 使用 forwardRef 解决循环依赖
  ],
  controllers: [HabitsController],
  providers: [HabitsService],
  exports: [HabitsService] 
})
export class HabitsModule {}