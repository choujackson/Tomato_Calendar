// src/plaza/entities/interactions.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { User } from '../../users/user.entity';
import { PublicHabit } from './public-habit.entity';

// --- 点赞实体 ---
@Entity()
@Unique(['userId', 'publicHabitId']) // 确保通过用户对同一个任务只能点赞一次
export class PublicHabitLike {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
  @Column()
  userId: number;

  @ManyToOne(() => PublicHabit, (ph) => ph.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'publicHabitId' })
  publicHabit: PublicHabit;
  @Column()
  publicHabitId: number;
}

// --- 评论实体 ---
@Entity()
export class PublicHabitComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
  @Column()
  userId: number;

  @ManyToOne(() => PublicHabit, (ph) => ph.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'publicHabitId' })
  publicHabit: PublicHabit;
  @Column()
  publicHabitId: number;
}

// --- 广场打卡实体 (用于统计 "612 ppl checked in today") ---
@Entity()
export class PublicHabitCheckIn {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
  @Column()
  userId: number;

  @ManyToOne(() => PublicHabit, (ph) => ph.checkIns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'publicHabitId' })
  publicHabit: PublicHabit;
  @Column()
  publicHabitId: number;
}