import { Injectable } from '@nestjs/common';

@Injectable()
export class CatsService {
  public readonly age = 10_000;
}
