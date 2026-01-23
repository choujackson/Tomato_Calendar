// src/focus/dto/create-focus.dto.ts
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFocusDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  duration?: number; // 允许前端传时长，不传默认25

  @IsString()
  @IsOptional()
  tag?: string; // 允许前端传一个标签，比如 "Work", "Study"
}