import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SensorData, SensorDataDocument } from '../schemas/sensor-data.schema';
import { Sensor, TipoDato } from '../entities/sensor.entity';

@Injectable()
export class SensorDataService {
  constructor(
    @InjectModel(SensorData.name)
    private sensorDataModel: Model<SensorDataDocument>,
  ) {}

  async saveData(
    sensor: Sensor,
    rawData: Record<string, any>,
  ): Promise<SensorData> {
    // Validar y limpiar datos según las entradas definidas
    const validatedData = this.validateData(sensor, rawData);

    const sensorData = new this.sensorDataModel({
      sensorId: sensor.id,
      data: validatedData,
      timestamp: new Date(),
    });

    return await sensorData.save();
  }

  private validateData(
    sensor: Sensor,
    rawData: Record<string, any>,
  ): Record<string, any> {
    const validatedData: Record<string, any> = {};

    // Iterar sobre las entradas definidas en el sensor
    for (const entrada of sensor.entradas) {
      const valor = rawData[entrada.nombre];

      if (valor === undefined || valor === null) {
        validatedData[entrada.nombre] = null;
        continue;
      }

      // Validar según el tipo
      switch (entrada.tipo) {
        case TipoDato.STRING:
          validatedData[entrada.nombre] = String(valor);
          break;

        case TipoDato.BOOL:
          if (typeof valor === 'boolean') {
            validatedData[entrada.nombre] = valor;
          } else if (valor === 'true' || valor === '1' || valor === 1) {
            validatedData[entrada.nombre] = true;
          } else if (valor === 'false' || valor === '0' || valor === 0) {
            validatedData[entrada.nombre] = false;
          } else {
            validatedData[entrada.nombre] = null;
          }
          break;

        case TipoDato.INT:
          const intValue = parseInt(valor);
          validatedData[entrada.nombre] = isNaN(intValue) ? null : intValue;
          break;

        case TipoDato.FLOAT:
          const floatValue = parseFloat(valor);
          validatedData[entrada.nombre] = isNaN(floatValue) ? null : floatValue;
          break;

        default:
          validatedData[entrada.nombre] = null;
      }
    }

    return validatedData;
  }

  async findBySensorId(
    sensorId: number,
    limit: number = 100,
    skip: number = 0,
  ): Promise<SensorData[]> {
    return await this.sensorDataModel
      .find({ sensorId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }

  async findAll(limit: number = 100, skip: number = 0): Promise<SensorData[]> {
    return await this.sensorDataModel
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }

  async countBySensorId(sensorId: number): Promise<number> {
    return await this.sensorDataModel.countDocuments({ sensorId }).exec();
  }
}
