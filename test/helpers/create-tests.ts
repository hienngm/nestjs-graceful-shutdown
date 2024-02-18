import KeepAliveHttpAgent from 'agentkeepalive';
import test from 'ava';
import delay from 'delay';
import safeGot from 'got';
import sinon from 'sinon';

import { GracefulShutdownModule, setupGracefulShutdown } from '../../src';

import { CatsController } from './test-controller';
import { CatsModule } from './test-module';
import { CatsService } from './test-service';
import type { NestJSTestingServerFactory } from './types';

const got = safeGot.extend({
  https: {
    rejectUnauthorized: false,
  },
});

const KeepAliveHttpsAgent = KeepAliveHttpAgent.HttpsAgent;

export const createTests = (
  createNestJSTestingServer: NestJSTestingServerFactory
): void => {
  test('should work normally after setting up the library (using`.forRoot()`)', async (t) => {
    const testingServer = await createNestJSTestingServer({
      requestHandler: new CatsController().findTheCat,
      GracefulShutdownModule: GracefulShutdownModule.forRoot({
        keepNodeProcessAlive: true,
      }),
    });
    const { httpServer, app, url, cleanupNestJSApp } = testingServer;
    setupGracefulShutdown({ app });
    const response = await got(url);

    t.true(httpServer.listening);
    t.is(response.body, 'Congratulations! You have found the cat!');
    await cleanupNestJSApp();
  });

  test('should work normally after setting up the library (using`.forRootAsync()`)', async (t) => {
    const testingServer = await createNestJSTestingServer({
      requestHandler: new CatsController().findTheCat,
      GracefulShutdownModule: GracefulShutdownModule.forRootAsync({
        imports: [CatsModule],
        inject: [CatsService],
        useFactory: async (catsService: CatsService) => {
          await delay(1); // any async/await task
          return {
            gracefulShutdownTimeout: catsService.age,
          };
        },
      }),
    });
    const { httpServer, app, url, cleanupNestJSApp } = testingServer;
    setupGracefulShutdown({ app });
    const response = await got(url);

    t.true(httpServer.listening);
    t.is(response.body, 'Congratulations! You have found the cat!');
    await cleanupNestJSApp();
  });

  test('should shut down the HTTP server with no active connections', async (t) => {
    const testingServer = await createNestJSTestingServer({
      requestHandler: () => {},
      GracefulShutdownModule: GracefulShutdownModule.forRoot({
        keepNodeProcessAlive: true,
      }),
    });
    const { httpServer, app, shutdownServer, cleanupNestJSApp } = testingServer;

    t.true(httpServer.listening);

    t.timeout(5000);

    setupGracefulShutdown({ app });

    shutdownServer();

    await delay(50);

    t.false(httpServer.listening);
    await cleanupNestJSApp();
  });

  test('should terminate hanging sockets after gracefulShutdownTimeout', async (t) => {
    const spy = sinon.spy();
    const gracefulShutdownTimeout = 500;
    const testingServer = await createNestJSTestingServer({
      requestHandler: () => {
        spy();
      },
      GracefulShutdownModule: GracefulShutdownModule.forRoot({
        gracefulShutdownTimeout,
        keepNodeProcessAlive: true,
      }),
    });
    const { getConnections, app, shutdownServer, url, cleanupNestJSApp } =
      testingServer;

    setupGracefulShutdown({ app });

    t.timeout(5000);

    got(url);

    await delay(100);

    t.true(spy.called);

    shutdownServer();

    await delay(100);

    // The timeout has not passed.
    t.is(await getConnections(), 1);

    await delay(gracefulShutdownTimeout);

    // The timeout has passed
    t.is(await getConnections(), 0);
    await cleanupNestJSApp();
  });

  test('should invoke cleanup function on application shutdown', async (t) => {
    const stub = sinon.stub();
    const testingServer = await createNestJSTestingServer({
      requestHandler: () => {},
      GracefulShutdownModule: GracefulShutdownModule.forRoot({
        keepNodeProcessAlive: true,
        cleanup: async (app) => {
          stub(app);
        },
      }),
    });
    const { app, shutdownServer, cleanupNestJSApp } = testingServer;

    setupGracefulShutdown({ app });

    shutdownServer();

    await delay(50);

    t.deepEqual(stub.firstCall.args, [app]);

    await cleanupNestJSApp();
  });

  test('should stop accepting new connections after receiving the shutdown signal', async (t) => {
    const stub = sinon.stub();

    stub.onCall(0).callsFake((res) => {
      setTimeout(() => {
        res.end('foo');
      }, 100);
    });

    const testingServer = await createNestJSTestingServer({
      requestHandler: stub,
      GracefulShutdownModule: GracefulShutdownModule.forRoot({
        keepNodeProcessAlive: true,
      }),
    });
    const { app, shutdownServer, url, cleanupNestJSApp } = testingServer;

    setupGracefulShutdown({ app });

    t.timeout(5000);

    const request0 = got(url);

    await delay(50);

    shutdownServer();

    const request1 = got(url, {
      retry: 0,
      timeout: {
        connect: 50,
      },
    });

    await t.throwsAsync(request1);
    const response0 = await request0;

    t.is(response0.headers.connection, 'close');
    t.is(response0.body, 'foo');
    await cleanupNestJSApp();
  });

  test('should include `connection: close` header in ongoing requests', async (t) => {
    const testingServer = await createNestJSTestingServer({
      requestHandler: (res) => {
        setTimeout(() => {
          res.end('foo');
        }, 500);
      },
      GracefulShutdownModule: GracefulShutdownModule.forRoot({
        keepNodeProcessAlive: true,
      }),
    });
    const { app, shutdownServer, url, cleanupNestJSApp } = testingServer;

    setupGracefulShutdown({ app });

    t.timeout(5000);

    const httpAgent = new KeepAliveHttpAgent({
      maxSockets: 1,
    });

    const httpsAgent = new KeepAliveHttpsAgent({
      maxSockets: 1,
    });

    const request = got(url, {
      agent: {
        http: httpAgent,
        https: httpsAgent,
      },
    });

    await delay(100);

    shutdownServer();

    const response = await request;

    t.is(response.headers.connection, 'close');
    t.is(response.body, 'foo');
    await cleanupNestJSApp();
  });

  test('should not send `connection: close` when the server is not terminating', async (t) => {
    const testingServer = await createNestJSTestingServer({
      requestHandler: (res) => {
        setTimeout(() => {
          res.end('foo');
        }, 50);
      },
      GracefulShutdownModule: GracefulShutdownModule.forRoot({
        keepNodeProcessAlive: true,
      }),
    });
    const { app, url, cleanupNestJSApp } = testingServer;

    setupGracefulShutdown({ app });

    t.timeout(5000);

    const httpAgent = new KeepAliveHttpAgent({
      maxSockets: 1,
    });

    const httpsAgent = new KeepAliveHttpsAgent({
      maxSockets: 1,
    });

    const response = await got(url, {
      agent: {
        http: httpAgent,
        https: httpsAgent,
      },
    });

    t.is(response.headers.connection, 'keep-alive');
    await cleanupNestJSApp();
  });
};
