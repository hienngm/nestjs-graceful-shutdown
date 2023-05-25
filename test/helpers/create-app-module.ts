import { Module, ModuleMetadata } from '@nestjs/common';

export const createAppModule = (moduleMetadata: ModuleMetadata): any => {
  @Module(moduleMetadata)
  class AppModule {}

  return AppModule;
};
