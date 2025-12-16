import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  Res,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { SensorDataService } from '../services/sensor-data.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SensoresService } from '../sensores.service';
import { Sensor } from '../entities/sensor.entity';

@Controller('sensor-data')
@UseGuards(JwtAuthGuard)
export class SensorDataController {
  constructor(
    private readonly sensorDataService: SensorDataService,
    private readonly sensoresService: SensoresService,
  ) {}

  @Get()
  async findAll(@Query('limit') limit?: string, @Query('skip') skip?: string) {
    const limitNum = limit ? parseInt(limit) : 100;
    const skipNum = skip ? parseInt(skip) : 0;

    return await this.sensorDataService.findAll(limitNum, skipNum);
  }

  @Get('sensor/:sensorId')
  async findBySensorId(
    @Param('sensorId') sensorId: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 100;
    const skipNum = skip ? parseInt(skip) : 0;

    const data = await this.sensorDataService.findBySensorId(
      parseInt(sensorId),
      limitNum,
      skipNum,
    );
    const total = await this.sensorDataService.countBySensorId(
      parseInt(sensorId),
    );

    return {
      data,
      total,
      limit: limitNum,
      skip: skipNum,
    };
  }

  @Get('export/excel')
  async exportToExcel(
    @Query('sensorId') sensorId?: string,
    @Res() res: Response = {} as Response,
  ) {
    try {
      let sensors: Sensor[] = [];

      if (sensorId) {
        // Exportar solo un sensor específico
        const sensor = await this.sensoresService.findById(parseInt(sensorId));

        if (!sensor) {
          return res.status(HttpStatus.NOT_FOUND).json({
            message: `Sensor con ID ${sensorId} no encontrado`,
          });
        }

        sensors = [sensor];
      } else {
        // Exportar todos los sensores activos
        const allSensors = await this.sensoresService.findAll('admin');
        sensors = allSensors.filter((s) => s.active);
      }

      if (sensors.length === 0) {
        return res.status(HttpStatus.NOT_FOUND).json({
          message: 'No hay sensores con datos para exportar',
        });
      }

      // Generar archivo Excel
      const buffer = await this.sensorDataService.exportToExcel(sensors);

      // Configurar headers para descarga
      const filename = sensorId
        ? `sensor-${sensorId}-data-${new Date().toISOString().split('T')[0]}.xlsx`
        : `sensors-data-${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );

      // Enviar archivo
      res.send(buffer);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error al generar archivo Excel',
        error: error.message,
      });
    }
  }
}
