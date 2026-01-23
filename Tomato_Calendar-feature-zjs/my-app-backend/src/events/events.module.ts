// src/events/events.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from './event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event])], // 注册 Event 实体
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}