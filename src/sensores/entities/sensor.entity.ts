import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export enum TipoDato {
  STRING = 'string',
  BOOL = 'bool',
  INT = 'int',
  FLOAT = 'float',
}

export interface EntradaSensor {
  nombre: string;
  tipo: TipoDato;
}

@Entity('sensores')
export class Sensor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column()
  tipo: string;

  @Column({ type: 'jsonb' })
  entradas: EntradaSensor[];

  @Column({ default: true })
  active: boolean;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'usuario_id' })
  usuarioId: number;
}
