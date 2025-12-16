import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SensoresService } from './sensores.service';
import { SensoresController } from './sensores.controller';
import { Sensor } from './entities/sensor.entity';
import { JwtSensorStrategy } from './strategies/jwt-sensor.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sensor]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SENSOR_SECRET') ||
          'default-sensor-secret-change-me',
        signOptions: {
          expiresIn: '30d',
        },
      }),
    }),
  ],
  providers: [SensoresService, JwtSensorStrategy],
  controllers: [SensoresController],
  exports: [SensoresService],
})
export class SensoresModule {}
