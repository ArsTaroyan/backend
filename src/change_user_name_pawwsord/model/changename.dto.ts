import { IsString, MinLength } from 'class-validator';

export class ChangeNameDto {
  @IsString()
  @MinLength(3)
  newUsername: string;
}
