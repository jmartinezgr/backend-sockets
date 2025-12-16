import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SensoresService } from './sensores.service';
import { SensoresController } from './sensores.controller';
import { Sensor } from './entities/sensor.entity';
import { JwtSensorStrategy } from './strategies/jwt-sensor.strategy';
import { SensorData, SensorDataSchema } from './schemas/sensor-data.schema';
import { SensorDataService } from './services/sensor-data.service';
import { SensorDataController } from './controllers/sensor-data.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sensor]),
    MongooseModule.forFeature([
      { name: SensorData.name, schema: SensorDataSchema },
    ]),
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
  providers: [SensoresService, JwtSensorStrategy, SensorDataService],
  controllers: [SensoresController, SensorDataController],
  exports: [SensoresService, SensorDataService],
})
export class SensoresModule {}
