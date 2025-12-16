import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SensorData, SensorDataDocument } from '../schemas/sensor-data.schema';
import { Sensor, TipoDato } from '../entities/sensor.entity';
import * as ExcelJS from 'exceljs';

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

  async exportToExcel(sensors: Sensor[]): Promise<ExcelJS.Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema IoT';
    workbook.created = new Date();

    // Crear una hoja por cada sensor
    for (const sensor of sensors) {
      // Obtener todos los datos del sensor
      const sensorData = await this.sensorDataModel
        .find({ sensorId: sensor.id })
        .sort({ timestamp: -1 })
        .exec();

      if (sensorData.length === 0) continue; // Saltar sensores sin datos

      // Crear hoja con nombre del sensor (Excel limita a 31 caracteres)
      const sheetName = sensor.nombre.substring(0, 31);
      const worksheet = workbook.addWorksheet(sheetName);

      // Encabezado con información del sensor
      worksheet.mergeCells('A1:E1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `Sensor: ${sensor.nombre}`;
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: 'center' };

      worksheet.getCell('A2').value = 'Tipo:';
      worksheet.getCell('B2').value = sensor.tipo;
      worksheet.getCell('A3').value = 'Username:';
      worksheet.getCell('B3').value = sensor.username;
      worksheet.getCell('A4').value = 'Total Registros:';
      worksheet.getCell('B4').value = sensorData.length;

      // Fila vacía
      const headerRow = 6;

      // Obtener nombres de columnas dinámicamente de las entradas del sensor
      const dataColumns = sensor.entradas.map((e) => e.nombre);
      const headers = ['#', 'Timestamp', ...dataColumns];

      // Crear encabezados de tabla
      const headerRowObj = worksheet.getRow(headerRow);
      headers.forEach((header, index) => {
        const cell = headerRowObj.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' },
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center' };
      });

      // Agregar datos
      sensorData.forEach((record, index) => {
        const rowIndex = headerRow + 1 + index;
        const row = worksheet.getRow(rowIndex);

        row.getCell(1).value = index + 1; // Número
        row.getCell(2).value = record.timestamp.toISOString(); // Timestamp

        // Agregar valores de datos dinámicamente
        dataColumns.forEach((colName, colIndex) => {
          const value = record.data[colName];
          row.getCell(3 + colIndex).value =
            value !== null && value !== undefined ? value : 'N/A';
        });
      });

      // Ajustar ancho de columnas
      worksheet.columns.forEach((column, index) => {
        if (index === 0)
          column.width = 8; // #
        else if (index === 1)
          column.width = 25; // Timestamp
        else column.width = 15; // Datos
      });

      // Congelar primera fila de datos
      worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: headerRow }];
    }

    // Generar buffer del archivo
    return await workbook.xlsx.writeBuffer();
  }
}
