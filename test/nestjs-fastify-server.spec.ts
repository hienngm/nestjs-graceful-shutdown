import { createNestJSFastifyServer } from './helpers/create-nestjs-fastify-server';
import { createTests } from './helpers/create-tests';

createTests(createNestJSFastifyServer);
