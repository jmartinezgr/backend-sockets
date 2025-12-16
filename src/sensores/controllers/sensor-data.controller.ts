import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { SensorDataService } from '../services/sensor-data.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('sensor-data')
@UseGuards(JwtAuthGuard)
export class SensorDataController {
  constructor(private readonly sensorDataService: SensorDataService) {}

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
}
