import { UserRole } from '../entities/usuario.entity';

export class CreateUsuarioDto {
  username: string;
  nombre: string;
  password: string;
  role?: UserRole;
}
