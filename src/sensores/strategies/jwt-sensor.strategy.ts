import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SensoresService } from '../sensores.service';
import { JwtSensorPayload } from '../interfaces/jwt-sensor-payload.interface';
import { Sensor } from '../entities/sensor.entity';

@Injectable()
export class JwtSensorStrategy extends PassportStrategy(
  Strategy,
  'jwt-sensor',
) {
  constructor(
    private readonly sensoresService: SensoresService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SENSOR_SECRET') ||
        'default-sensor-secret-change-me',
    });
  }

  async validate(payload: JwtSensorPayload): Promise<Sensor> {
    const { sub } = payload;
    const sensor = await this.sensoresService.findById(sub);

    if (!sensor) {
      throw new UnauthorizedException('Token de sensor no válido');
    }

    if (!sensor.active) {
      throw new UnauthorizedException('Sensor inactivo');
    }

    return sensor;
  }
}
