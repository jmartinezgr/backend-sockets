import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SensoresService } from '../sensores/sensores.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { SensorDataService } from '../sensores/services/sensor-data.service';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  sensorId?: number;
  role?: 'sensor' | 'usuario';
  username?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket', 'polling'],
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sensoresService: SensoresService,
    private readonly usuariosService: UsuariosService,
    private readonly sensorDataService: SensorDataService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Nuevo cliente intentando conectar: ${client.id}`);

    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1] ||
        client.handshake.query?.token;
      const role = client.handshake.auth?.role || client.handshake.query?.role;

      if (!token || !role) {
        this.logger.warn(`Cliente sin token o rol: ${client.id}`);
        client.emit('error', { message: 'Token y rol requeridos' });
        client.disconnect();
        return;
      }

      this.logger.log(`Cliente ${client.id} - Rol: ${role}`);

      if (role === 'sensor') {
        await this.authenticateSensor(client, token);
      } else if (role === 'usuario') {
        await this.authenticateUser(client, token);
      } else {
        this.logger.warn(`Rol inválido: ${role} para cliente ${client.id}`);
        client.emit('error', { message: 'Rol inválido' });
        client.disconnect();
        return;
      }
    } catch (error) {
      this.logger.error(
        `Error en autenticación del cliente ${client.id}: ${error.message}`,
      );
      client.emit('error', { message: 'Error de autenticación' });
      client.disconnect();
    }
  }

  private async authenticateSensor(client: AuthenticatedSocket, token: string) {
    try {
      const secret =
        this.configService.get<string>('JWT_SENSOR_SECRET') ||
        'default-sensor-secret-change-me';
      const payload = this.jwtService.verify(token, { secret });

      const sensor = await this.sensoresService.findById(payload.sub);
      if (!sensor || !sensor.active) {
        throw new UnauthorizedException('Sensor no válido o inactivo');
      }

      client.sensorId = sensor.id;
      client.role = 'sensor';
      client.username = sensor.username;

      await client.join('sensors');

      this.logger.log(
        `✅ Sensor conectado: ${sensor.nombre} (ID: ${sensor.id}, Socket: ${client.id})`,
      );

      // Notificar a dashboards sobre nueva conexión de sensor
      this.server.to('dashboards').emit('sensor-connected', {
        sensorId: sensor.id,
        nombre: sensor.nombre,
        tipo: sensor.tipo,
        timestamp: new Date(),
      });

      client.emit('connected', {
        message: 'Sensor autenticado correctamente',
        sensorId: sensor.id,
      });
    } catch (error) {
      this.logger.error(`❌ Error autenticando sensor: ${error.message}`);
      throw error;
    }
  }

  private async authenticateUser(client: AuthenticatedSocket, token: string) {
    try {
      const secret =
        this.configService.get<string>('JWT_SECRET') ||
        'default-secret-change-me';
      const payload = this.jwtService.verify(token, { secret });

      const usuario = await this.usuariosService.findById(payload.sub);
      if (!usuario) {
        throw new UnauthorizedException('Usuario no válido');
      }

      client.userId = usuario.id;
      client.role = 'usuario';
      client.username = usuario.username;

      await client.join('dashboards');

      this.logger.log(
        `✅ Dashboard conectado: ${usuario.username} (ID: ${usuario.id}, Socket: ${client.id})`,
      );

      client.emit('connected', {
        message: 'Dashboard autenticado correctamente',
        userId: usuario.id,
      });
    } catch (error) {
      this.logger.error(`❌ Error autenticando usuario: ${error.message}`);
      throw error;
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.role === 'sensor' && client.sensorId) {
      this.logger.log(
        `Sensor desconectado: ${client.username} (${client.sensorId})`,
      );

      // Notificar a dashboards sobre desconexión
      this.server.to('dashboards').emit('sensor-disconnected', {
        sensorId: client.sensorId,
        username: client.username,
        timestamp: new Date(),
      });
    } else if (client.role === 'usuario' && client.userId) {
      this.logger.log(
        `Usuario desconectado: ${client.username} (${client.userId})`,
      );
    } else {
      this.logger.log(`Cliente desconectado: ${client.id}`);
    }
  }

  @SubscribeMessage('sensor-data')
  async handleSensorData(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: Record<string, any>,
  ) {
    if (client.role !== 'sensor' || !client.sensorId) {
      return { error: 'No autorizado' };
    }

    try {
      // Obtener información del sensor
      const sensor = await this.sensoresService.findById(client.sensorId);
      if (!sensor) {
        return { error: 'Sensor no encontrado' };
      }

      // Validar y guardar datos en MongoDB
      const savedData = await this.sensorDataService.saveData(sensor, data);

      this.logger.log(
        `Datos recibidos del sensor ${sensor.nombre}: ${JSON.stringify(savedData.data)}`,
      );

      // Enviar datos a dashboards en tiempo real
      this.server.to('dashboards').emit('new-sensor-data', {
        sensorId: sensor.id,
        nombre: sensor.nombre,
        tipo: sensor.tipo,
        data: savedData.data,
        timestamp: savedData.timestamp,
      });

      return { success: true, timestamp: savedData.timestamp };
    } catch (error) {
      this.logger.error(`Error procesando datos del sensor: ${error.message}`);
      return { error: error.message };
    }
  }
}
