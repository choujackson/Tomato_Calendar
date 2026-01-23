import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlazaService } from './plaza.service';
import { PlazaController } from './plaza.controller';
import { PublicHabit } from './entities/public-habit.entity';
import { PublicHabitLike, PublicHabitComment, PublicHabitCheckIn } from './entities/interactions.entity';
import { HabitsModule } from '../habits/habits.module'; // 导入 HabitsModule

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PublicHabit, 
      PublicHabitLike, 
      PublicHabitComment, 
      PublicHabitCheckIn
    ]),
    forwardRef(() => HabitsModule), // 使用 forwardRef 解决循环依赖
  ],
  controllers: [PlazaController],
  providers: [PlazaService],
  exports: [PlazaService], // 导出 PlazaService 以便 HabitsModule 可以使用
})
export class PlazaModule {}