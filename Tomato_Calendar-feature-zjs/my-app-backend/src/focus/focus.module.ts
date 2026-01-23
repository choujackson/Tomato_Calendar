// src/focus/focus.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FocusService } from './focus.service';
import { FocusController } from './focus.controller';
import { FocusRecord } from './focus-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FocusRecord])],
  controllers: [FocusController],
  providers: [FocusService],
})
export class FocusModule {}