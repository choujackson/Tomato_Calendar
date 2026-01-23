// src/plaza/dto/create-comment.dto.ts
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  content: string;
}