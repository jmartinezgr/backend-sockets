import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Sensor } from '../entities/sensor.entity';

export const GetSensor = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Sensor => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
