import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateaway';

@Module({
  providers: [WebsocketGateway],
})
export class WebSocketModule {}
