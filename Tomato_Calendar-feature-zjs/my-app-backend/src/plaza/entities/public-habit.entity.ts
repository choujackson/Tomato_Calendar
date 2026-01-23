// src/plaza/entities/public-habit.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/user.entity';
import { PublicHabitLike, PublicHabitComment, PublicHabitCheckIn } from './interactions.entity';

@Entity()
export class PublicHabit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  // 描述或口号 (UI图里的 "sponsored by June" 实际上是 creator 的名字，但我们可以加个描述字段)
  @Column({ nullable: true })
  description: string;

  // 创建者 (Sponsor)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column()
  creatorId: number;

  @CreateDateColumn()
  createdAt: Date;

  // 关联：点赞
  @OneToMany(() => PublicHabitLike, (like) => like.publicHabit)
  likes: PublicHabitLike[];

  // 关联：评论
  @OneToMany(() => PublicHabitComment, (comment) => comment.publicHabit)
  comments: PublicHabitComment[];
  
  // 关联：广场打卡记录 (用于统计 "612 ppl Checked in today")
  @OneToMany(() => PublicHabitCheckIn, (checkIn) => checkIn.publicHabit)
  checkIns: PublicHabitCheckIn[];

  // 虚拟字段：用于返回给前端统计数据 (不存储在数据库)
  likesCount?: number;
  commentsCount?: number;
  todayCheckInCount?: number;
  isLikedByMe?: boolean; // 当前用户是否点赞
}