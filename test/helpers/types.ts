import { DynamicModule, INestApplication } from '@nestjs/common';

type Response = {
  end: (body: string) => void;
  write: (body: string) => void;
};

type RequestHandler = (res: Response) => void;

type TestingServerType = {
  readonly getConnections: () => Promise<number>;
  readonly shutdownServer: () => void;
  readonly cleanupNestJSApp: () => Promise<void>;
  readonly port: number;
  readonly httpServer: any;
  readonly url: string;
  readonly app: INestApplication;
};

type NestJSTestingServerFactoryParams = {
  requestHandler: RequestHandler;
  GracefulShutdownModule: DynamicModule;
};

export type NestJSTestingServerFactory = (
  params: NestJSTestingServerFactoryParams
) => Promise<TestingServerType>;
