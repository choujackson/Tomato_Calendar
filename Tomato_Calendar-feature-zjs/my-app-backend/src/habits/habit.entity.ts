// src/habits/habit.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { CheckIn } from './check-in.entity';

@Entity()
export class Habit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // 关联用户
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  // 一个习惯有多个打卡记录
  @OneToMany(() => CheckIn, (checkIn) => checkIn.habit)
  checkIns: CheckIn[];
}