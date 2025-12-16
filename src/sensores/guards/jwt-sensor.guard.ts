import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtSensorGuard extends AuthGuard('jwt-sensor') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
