// src/events/dto/create-event.dto.ts
import { IsNotEmpty, IsString, IsBoolean, IsDate, IsEnum, IsOptional, IsHexColor } from 'class-validator';
import { Type } from 'class-transformer';
import { EventRepeat } from '../event.entity';

export class CreateEventDto {
  @IsNotEmpty({ message: '标题不能为空' })
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;

  @IsNotEmpty({ message: '开始时间不能为空' })
  @Type(() => Date) // 自动将 ISO 字符串转为 Date 对象
  @IsDate()
  startTime: Date;

  @IsNotEmpty({ message: '结束时间不能为空' })
  @Type(() => Date)
  @IsDate()
  endTime: Date;

  @IsEnum(EventRepeat)
  @IsOptional()
  repeat?: EventRepeat;

  @IsOptional()
  @IsHexColor({ message: '颜色格式不正确' })
  color?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}