import { promisify } from 'util';

import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import delay from 'delay';

import { createAppModule } from './create-app-module';
import { CatsController } from './test-controller';
import { CatsModule } from './test-module';
import type { NestJSTestingServerFactory } from './types';

export const createNestJSFastifyServer: NestJSTestingServerFactory = async (
  params
) => {
  const { requestHandler, GracefulShutdownModule } = params;
  const AppModule = createAppModule({
    imports: [CatsModule, GracefulShutdownModule],
  });
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: false }
  );
  app.get(CatsController).findTheCat = (res) => requestHandler(res.raw);

  const httpServer = app.getHttpServer();
  const getConnections = () => {
    return promisify(httpServer.getConnections.bind(httpServer))();
  };

  await app.listen(0);
  const port = httpServer.address().port;
  const url = `http://localhost:${port}`;

  await delay(1);

  return {
    getConnections,
    port,
    httpServer,
    url,
    app,
    shutdownServer: () => {
      process.kill(process.pid, 'SIGTERM');
    },
    cleanupNestJSApp: async () => {
      await app.close();
    },
  };
};
