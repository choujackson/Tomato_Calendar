// src/habits/dto/create-habit.dto.ts
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateHabitDto {
  @IsNotEmpty({ message: '习惯名称不能为空' })
  @IsString()
  @MaxLength(50, { message: '习惯名称不能超过50个字符' })
  name: string;
}