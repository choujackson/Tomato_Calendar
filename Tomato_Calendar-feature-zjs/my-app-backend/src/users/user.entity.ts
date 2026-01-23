// src/users/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert } from 'typeorm';
import { OneToMany } from 'typeorm';
import { Event } from '../events/event.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password?: string;

  // 用户名
  @Column({ length: 50 })
  username: string;

  // 个性签名，允许为空
  @Column({ type: 'text', nullable: true })
  signature: string;

  // 一个用户拥有多个事件
  @OneToMany(() => Event, (event) => event.user)
  events: Event[];
}