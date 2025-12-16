import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Usuario => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
