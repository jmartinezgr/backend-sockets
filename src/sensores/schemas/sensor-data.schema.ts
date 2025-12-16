import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SensorDataDocument = SensorData & Document;

@Schema({ timestamps: true })
export class SensorData {
  @Prop({ required: true, index: true })
  sensorId: number;

  @Prop({ type: Object, required: true })
  data: Record<string, any>;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const SensorDataSchema = SchemaFactory.createForClass(SensorData);
