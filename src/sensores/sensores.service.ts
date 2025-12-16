import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Sensor } from './entities/sensor.entity';
import { CreateSensorDto } from './dto/create-sensor.dto';
import { ConnectSensorDto } from './dto/connect-sensor.dto';
import { JwtSensorPayload } from './interfaces/jwt-sensor-payload.interface';
import { UserRole } from '../usuarios/entities/usuario.entity';

@Injectable()
export class SensoresService {
  constructor(
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,
    private readonly jwtService: JwtService,
  ) {}

  async create(
    createSensorDto: CreateSensorDto,
    usuarioId: number,
  ): Promise<Sensor> {
    // Verificar si el username del sensor ya existe
    const existingSensor = await this.sensorRepository.findOne({
      where: { username: createSensorDto.username },
    });

    if (existingSensor) {
      throw new ConflictException('El username del sensor ya existe');
    }

    // Hash de la contraseña del sensor
    const hashedPassword = await bcrypt.hash(createSensorDto.password, 10);

    // Crear sensor
    const sensor = this.sensorRepository.create({
      ...createSensorDto,
      password: hashedPassword,
      usuarioId,
    });

    return await this.sensorRepository.save(sensor);
  }

  async findAll(userRole: string): Promise<Sensor[]> {
    if (userRole === UserRole.ADMIN) {
      // Admin ve todos los sensores
      return await this.sensorRepository.find({ relations: ['usuario'] });
    } else {
      // Usuario normal solo ve sensores activos
      return await this.sensorRepository.find({
        where: { active: true },
        relations: ['usuario'],
      });
    }
  }

  async findById(id: number): Promise<Sensor | null> {
    return await this.sensorRepository.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<Sensor | null> {
    return await this.sensorRepository.findOne({ where: { username } });
  }

  async connect(connectSensorDto: ConnectSensorDto) {
    const { username, password } = connectSensorDto;

    // Buscar sensor
    const sensor = await this.findByUsername(username);
    if (!sensor) {
      throw new UnauthorizedException('Credenciales de sensor inválidas');
    }

    // Verificar que el sensor esté activo
    if (!sensor.active) {
      throw new UnauthorizedException('Sensor inactivo');
    }

    // Verificar password
    const isPasswordValid = await bcrypt.compare(password, sensor.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales de sensor inválidas');
    }

    // Generar token JWT para el sensor
    const token = this.generateSensorToken(
      sensor.id,
      sensor.username,
      sensor.tipo,
    );

    return {
      sensor: {
        id: sensor.id,
        nombre: sensor.nombre,
        username: sensor.username,
        tipo: sensor.tipo,
        entradas: sensor.entradas,
      },
      token,
    };
  }

  private generateSensorToken(
    sensorId: number,
    username: string,
    tipo: string,
  ): string {
    const payload: JwtSensorPayload = {
      sub: sensorId,
      username,
      tipo,
    };

    return this.jwtService.sign(payload);
  }
}
