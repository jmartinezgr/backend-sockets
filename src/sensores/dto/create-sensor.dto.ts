import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsEnum,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoDato } from '../entities/sensor.entity';

export class EntradaSensorDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEnum(TipoDato)
  tipo: TipoDato;
}

export class CreateSensorDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  tipo: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EntradaSensorDto)
  entradas: EntradaSensorDto[];
}
