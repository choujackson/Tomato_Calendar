// src/plaza/dto/create-public-habit.dto.ts
import { IsNotEmpty, IsString, MaxLength, Matches } from 'class-validator';

export class CreatePublicHabitDto {
  @IsNotEmpty({ message: '标题不能为空' })
  @IsString()
  @MaxLength(15, { message: '标题不能超过15个字符' })
  @Matches(/^\S+$/, { message: '标题必须是单个单词（不能包含空格）' })
  title: string;
}