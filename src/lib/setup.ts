import { ISetupFunctionParams } from './graceful-shutdown.interface';
import { GracefulShutdownService } from './graceful-shutdown.service';

export const setupGracefulShutdown = (params: ISetupFunctionParams): void => {
  const { app, signals } = params;
  app.enableShutdownHooks(signals);
  app.get(GracefulShutdownService).setupGracefulShutdown(app);
};
