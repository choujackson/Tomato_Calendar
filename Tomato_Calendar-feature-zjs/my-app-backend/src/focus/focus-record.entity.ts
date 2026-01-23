// src/focus/focus-record.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class FocusRecord {
  @PrimaryGeneratedColumn()
  id: number;

  // 专注时长（单位：分钟），默认 25
  @Column({ default: 25 })
  duration: number;

  // 可选：关联的任务名称或备注（例如 "背单词", "写代码"）
  @Column({ nullable: true })
  tag: string;

  // 完成时间
  @CreateDateColumn()
  completedAt: Date;

  // 关联用户
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;
}