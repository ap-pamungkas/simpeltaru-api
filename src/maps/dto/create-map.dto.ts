import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class CreateMapDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
