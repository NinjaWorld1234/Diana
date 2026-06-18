import { IsString, IsNotEmpty, IsBoolean, IsIn, IsOptional, IsNumber, Min } from 'class-validator';

export class EvaluateLevelDto {
  @IsString()
  @IsNotEmpty()
  nodeId!: string;

  @IsString()
  @IsIn(['understanding', 'application', 'reasoning'])
  level!: 'understanding' | 'application' | 'reasoning';

  @IsBoolean()
  passed!: boolean;
}

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @IsNotEmpty()
  selectedOptionId!: string | string[];

  @IsNumber()
  @Min(0)
  timeSeconds!: number;
}

export class UseHintDto {
  @IsString()
  @IsNotEmpty()
  nodeId!: string;

  @IsString()
  @IsNotEmpty()
  hintId!: string;
}

export class ChatDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsString()
  @IsOptional()
  nodeId?: string;
}
