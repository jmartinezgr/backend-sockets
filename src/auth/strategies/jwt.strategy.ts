import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usuariosService: UsuariosService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'default-secret-change-me',
    });
  }

  async validate(payload: JwtPayload): Promise<Usuario> {
    const { sub } = payload;
    const usuario = await this.usuariosService.findById(sub);

    if (!usuario) {
      throw new UnauthorizedException('Token no válido');
    }

    return usuario;
  }
}
