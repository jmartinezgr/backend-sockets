import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { SensoresService } from './sensores.service';
import { CreateSensorDto } from './dto/create-sensor.dto';
import { ConnectSensorDto } from './dto/connect-sensor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtSensorGuard } from './guards/jwt-sensor.guard';
import { AdminGuard } from './guards/admin.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { GetSensor } from './decorators/get-sensor.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Sensor } from './entities/sensor.entity';

@Controller('sensores')
export class SensoresController {
  constructor(private readonly sensoresService: SensoresService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() createSensorDto: CreateSensorDto, @GetUser() user: Usuario) {
    return this.sensoresService.create(createSensorDto, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@GetUser() user: Usuario) {
    return this.sensoresService.findAll(user.role);
  }

  @Post('connect')
  connect(@Body() connectSensorDto: ConnectSensorDto) {
    return this.sensoresService.connect(connectSensorDto);
  }

  @Get('profile')
  @UseGuards(JwtSensorGuard)
  getProfile(@GetSensor() sensor: Sensor) {
    return {
      id: sensor.id,
      nombre: sensor.nombre,
      username: sensor.username,
      tipo: sensor.tipo,
      entradas: sensor.entradas,
      active: sensor.active,
    };
  }
}
