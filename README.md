<p align="center">
<a href="https://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>
<h1 align="center">NestJS Graceful Shutdown 🐈</h1>

<p align="center">
  Elevate your NestJS application with seamless and reliable server shutdowns, guaranteeing uninterrupted user experiences and effortless handling of critical shutdown scenarios.
  <p align="center">
    <a href="https://www.npmjs.com/package/nestjs-graceful-shutdown" target="_blank"><img alt="npm version" src="https://img.shields.io/npm/v/nestjs-graceful-shutdown" /></a>
    <a href="https://www.npmjs.com/package/nestjs-graceful-shutdown" target="_blank"><img alt="NPM" src="https://img.shields.io/npm/l/nestjs-graceful-shutdown" /></a>
    <a href="https://www.npmjs.com/package/nestjs-graceful-shutdown" target="_blank"><img alt="npm downloads" src="https://img.shields.io/npm/dm/nestjs-graceful-shutdown" /></a>
     <a href="https://coveralls.io/github/hienngm/nestjs-graceful-shutdown?branch=main" target="_blank"><img alt="coverage" src="https://coveralls.io/repos/github/hienngm/nestjs-graceful-shutdown/badge.svg?branch=main" /></a>
  </p>
</p>

## Table of Contents

- [Description](#description)
- [Installation](#installation)
- [Example](#example)
- [Configuration](#configuration)
- [Contact and Feedback](#contact-and-feedback)
- [License](#license)

## Description

Don't let your server hang indefinitely!

When you explicitly call `app.close()` or if the process receive a special system signal (such as SIGTERM) after correctly invoking `enableShutdownHooks` during application bootstrap (check out the <a href="https://docs.nestjs.com/fundamentals/lifecycle-events#application-shutdown" target="_blank">NestJS docs</a>), the server stops accepting new connections while maintaining existing ones. This leads to your server hanging indefinitely due to lingering keep-alive connections or unresponsive requests.

Powered by the robust <a href="https://www.npmjs.com/package/http-terminator" target="_blank">`http-terminator`</a>library and backed by NestJS's built-in shutdown hooks, `nestjs-graceful-shutdown` ensures graceful communication with clients currently receiving responses from your server during the shutdown process. Experience a reliable and hassle-free server shutdown with ease.

## Installation

You can install the library using npm:

```
npm install nestjs-graceful-shutdown http-terminator
```

## Example

To integrate `nestjs-graceful-shutdown` into your NestJS application, follow these steps:

1. First, import the module with `GracefulShutdownModule.forRoot(...)` or `GracefulShutdownModule.forRootAsync(...)` into your root `AppModule`. (refer to the module configuration documentation [below](#configuration)).

```ts
import { GracefulShutdownModule } from 'nestjs-graceful-shutdown';

@Module({
  imports: [GracefulShutdownModule.forRoot()],
  ...
})
class AppModule {}
```

2. Next, set up graceful shutdown for your NestJS application by calling the `setupGracefulShutdown(...)` function.

> ⚠️ **Warning:** `nestjs-graceful-shutdown` will automatically enable the shutdown hooks. Avoid calling `enableShutdownHooks` separately in your application, as it may lead to unexpected behavior. For more information on NestJS application lifecycle, refer to the <a href ="https://docs.nestjs.com/fundamentals/lifecycle-events#application-shutdown" target="_blank">NestJS documentation</a>.

```typescript
import { setupGracefulShutdown } from 'nestjs-graceful-shutdown';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Additional configuration for your NestJS app

  setupGracefulShutdown({ app });

  await app.listen(3000);

  // Note: Timeout is used for illustration of
  // delayed termination purposes only.
  setTimeout(() => {
    process.kill(process.pid, 'SIGTERM');
  }, 5000);
}
bootstrap();
```

Please note that the above code snippets demonstrate the basic setup of `nestjs-graceful-shutdown` in your NestJS application. Make sure to adjust the code based on your specific application requirements and configuration.

## Configuration

### Configuration interface

The following interface is used for `GracefulShutdownModule` configuration:

```ts
interface IGracefulShutdownConfigOptions {
  /**
   * Cleanup function for releasing application resources
   * during server shutdown.
   */
  cleanup?: (app: INestApplication, signal?: string) => any;
  /**
   * The duration in milliseconds before forcefully
   * terminating a connection.
   * Defaults: 5000 (5 seconds).
   */
  gracefulShutdownTimeout?: number;
  /**
   * If set to `true`, the Node process will not be terminated
   * by a shutdown signal after closing all connections.
   * The shutdown behavior is identical to invoking `app.close()`.
   * Defaults: false.
   */
  keepNodeProcessAlive?: boolean;
}
```

The following interface is used for `setupGracefulShutdown` function parameters:

```ts
interface ISetupFunctionParams {
  /**
   * Your NestJS application.
   */
  app: INestApplication;
  /**
   * Shutdown signals that the application should listen to.
   * By default, it listens to all ShutdownSignals.
   */
  signals?: ShutdownSignal[] | string[];
}
```

### Zero configuration

Just import `GracefulShutdownModule` to `AppModule`:

```ts
import { GracefulShutdownModule } from 'nestjs-graceful-shutdown';

@Module({
  imports: [GracefulShutdownModule.forRoot()],
  ...
})
class AppModule {}
```

### Synchronous configuration

Use `GracefulShutdownModule.forRoot` method with argument of [Configuration interface](#configuration-interface):

```ts
import { GracefulShutdownModule } from 'nestjs-graceful-shutdown';

@Module({
  imports: [
    GracefulShutdownModule.forRoot({
      cleanup: async (app, signal) => {
        // releasing resources
      },
      gracefulShutdownTimeout:
        Number(process.env.GRACEFUL_SHUTDOWN_TIMEOUT ?? 10000),
      keepNodeProcessAlive: true,
    })
  ],
  ...
})
class AppModule {}
```

### Asynchronous configuration

With `GracefulShutdownModule.forRootAsync` you can, for example, import your `ConfigModule` and inject `ConfigService` to use it in `useFactory` method.

`useFactory` should return object with [Configuration interface](#configuration-interface)

Here's an example:

```ts
import { GracefulShutdownModule } from 'nestjs-graceful-shutdown';

@Injectable()
class ConfigService {
  public readonly timeout = 10000;
}

@Module({
  providers: [ConfigService],
  exports: [ConfigService]
})
class ConfigModule {}

@Module({
  imports: [
    GracefulShutdownModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        await somePromise();
        return {
          gracefulShutdownTimeout: config.timeout,
        };
      }
    })
  ],
  ...
})
class AppModule {}
```

## Contact and Feedback

Feel free to reach out if you have any ideas, comments, or questions.

Best regards,

Hien Nguyen Minh

## License

This library is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
