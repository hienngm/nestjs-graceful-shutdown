import type {
  BeforeApplicationShutdown,
  INestApplication,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import type { HttpTerminator } from 'http-terminator';
import { createHttpTerminator } from 'http-terminator';

import {
  DEFAULT_CONFIG_OPTIONS,
  GRACEFUL_SHUTDOWN_CONFIG_OPTIONS,
} from './constant';
import { IGracefulShutdownConfigOptions } from './graceful-shutdown.interface';

const SetupFunctionNotInvoked = new Error(
  'You have to invoke `setupGracefulShutdown({ app })` to ensure proper functioning of `nestjs-graceful-shutdown`.'
);

@Injectable()
export class GracefulShutdownService
  implements BeforeApplicationShutdown, OnApplicationShutdown
{
  private httpTerminator: HttpTerminator | null = null;
  private app: INestApplication | null = null;

  constructor(
    @Inject(GRACEFUL_SHUTDOWN_CONFIG_OPTIONS)
    private options: IGracefulShutdownConfigOptions
  ) {
    this.options = {
      cleanup: options.cleanup ?? DEFAULT_CONFIG_OPTIONS.cleanup,
      gracefulShutdownTimeout:
        options.gracefulShutdownTimeout ??
        DEFAULT_CONFIG_OPTIONS.gracefulShutdownTimeout,
      keepNodeProcessAlive:
        options.keepNodeProcessAlive ??
        DEFAULT_CONFIG_OPTIONS.keepNodeProcessAlive,
    };
  }

  async beforeApplicationShutdown(): Promise<void> {
    if (!this.httpTerminator) {
      throw SetupFunctionNotInvoked;
    }

    await this.httpTerminator.terminate();
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    if (!this.app) {
      throw SetupFunctionNotInvoked;
    }

    await this.options.cleanup?.(this.app, signal);
    if (signal && this.options.keepNodeProcessAlive) {
      this.skipShutdownSignal(signal);
    }
  }

  skipShutdownSignal(signal: string): void {
    const skipSignal = (): void => {
      process.removeListener(signal, skipSignal);
    };

    process.on(signal, skipSignal);
  }

  setupGracefulShutdown(app: INestApplication): void {
    this.app = app;
    this.httpTerminator = createHttpTerminator({
      gracefulTerminationTimeout: this.options.gracefulShutdownTimeout,
      server: app.getHttpServer(),
    });
  }
}
