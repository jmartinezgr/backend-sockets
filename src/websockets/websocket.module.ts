import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { WebsocketGateway } from './websocket.gateaway';
import { SensoresModule } from '../sensores/sensores.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    SensoresModule,
    UsuariosModule,
  ],
  providers: [WebsocketGateway],
})
export class WebSocketModule {}
