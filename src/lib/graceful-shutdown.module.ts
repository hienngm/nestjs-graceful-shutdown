import { DynamicModule, Module } from '@nestjs/common';

import {
  DEFAULT_CONFIG_OPTIONS,
  GRACEFUL_SHUTDOWN_CONFIG_OPTIONS,
} from './constant';
import {
  IGracefulShutdownAsyncConfigOptions,
  IGracefulShutdownConfigOptions,
} from './graceful-shutdown.interface';
import { GracefulShutdownService } from './graceful-shutdown.service';

@Module({})
export class GracefulShutdownModule {
  static forRoot(options?: IGracefulShutdownConfigOptions): DynamicModule {
    return {
      module: GracefulShutdownModule,
      providers: [
        {
          provide: GRACEFUL_SHUTDOWN_CONFIG_OPTIONS,
          useValue: options ?? DEFAULT_CONFIG_OPTIONS,
        },
        GracefulShutdownService,
      ],
    };
  }

  static forRootAsync(
    options: IGracefulShutdownAsyncConfigOptions
  ): DynamicModule {
    const { useFactory, inject, imports, providers = [] } = options;

    return {
      module: GracefulShutdownModule,
      imports,
      providers: [
        {
          provide: GRACEFUL_SHUTDOWN_CONFIG_OPTIONS,
          useFactory,
          inject,
        },
        GracefulShutdownService,
        ...providers,
      ],
    };
  }
}
