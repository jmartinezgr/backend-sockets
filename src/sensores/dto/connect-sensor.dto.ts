import { IsString, IsNotEmpty } from 'class-validator';

export class ConnectSensorDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
