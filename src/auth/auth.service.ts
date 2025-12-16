import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, password, nombre, role } = registerDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.usuariosService.findByUsername(username);
    if (existingUser) {
      throw new ConflictException('El usuario ya existe');
    }

    // Hash del password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const usuario = await this.usuariosService.create({
      username,
      nombre,
      password: hashedPassword,
      role,
    });

    // Generar token
    const token = this.generateToken(
      usuario.id,
      usuario.username,
      usuario.role,
    );

    return {
      user: {
        id: usuario.id,
        username: usuario.username,
        nombre: usuario.nombre,
        role: usuario.role,
      },
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // Buscar usuario
    const usuario = await this.usuariosService.findByUsername(username);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar password
    const isPasswordValid = await bcrypt.compare(password, usuario.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar token
    const token = this.generateToken(
      usuario.id,
      usuario.username,
      usuario.role,
    );

    return {
      user: {
        id: usuario.id,
        username: usuario.username,
        nombre: usuario.nombre,
        role: usuario.role,
      },
      token,
    };
  }

  private generateToken(
    userId: number,
    username: string,
    role: string,
  ): string {
    const payload: JwtPayload = {
      sub: userId,
      username,
      role,
    };

    return this.jwtService.sign(payload);
  }
}
