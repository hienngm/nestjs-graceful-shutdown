import { IGracefulShutdownConfigOptions } from './graceful-shutdown.interface';

export const GRACEFUL_SHUTDOWN_CONFIG_OPTIONS =
  'GRACEFUL_SHUTDOWN_CONFIG_OPTIONS';
export const DEFAULT_CONFIG_OPTIONS: IGracefulShutdownConfigOptions = {
  cleanup: async () => {},
  gracefulShutdownTimeout: 5000,
  keepNodeProcessAlive: false,
};
