// src/habits/check-in.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Habit } from './habit.entity';
import { User } from '../users/user.entity';

@Entity()
export class CheckIn {
  @PrimaryGeneratedColumn()
  id: number;

  // 仅存储日期 'YYYY-MM-DD'，不包含时间
  @Column({ type: 'date' })
  date: string;

  // 关联习惯
  @ManyToOne(() => Habit, (habit) => habit.checkIns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'habitId' })
  habit: Habit;

  @Column()
  habitId: number;

  // 同时也关联用户，方便快速查询某用户的所有打卡情况
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;
}