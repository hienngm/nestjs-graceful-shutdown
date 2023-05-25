import { Module } from '@nestjs/common';

import { CatsController } from './test-controller';
import { CatsService } from './test-service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
