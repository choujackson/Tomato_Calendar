// src/events/event.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

// 定义重复周期的枚举
export enum EventRepeat {
  NEVER = 'never',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  location: string;

  @Column({ default: false })
  isAllDay: boolean;

  // 使用 timestamp 存储日期和时间
  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  // 重复规则，默认为不重复
  @Column({
    type: 'enum',
    enum: EventRepeat,
    default: EventRepeat.NEVER,
  })
  repeat: EventRepeat;

  // 存储颜色代码，例如 "#FF5733"
  @Column({ length: 7, default: '#1890ff' })
  color: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // 关联到 User 实体
  // onDelete: 'CASCADE' 意味着如果用户被删除，他们的事件也会被自动删除
  @ManyToOne(() => User, (user) => user.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number; // 显式定义 userId 列，方便查询和赋值
}