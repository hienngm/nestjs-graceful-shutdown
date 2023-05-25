import { Controller, Get, Res } from '@nestjs/common';

@Controller('/')
export class CatsController {
  @Get()
  findTheCat(@Res() res: any): any {
    return res.end('Congratulations! You have found the cat!');
  }
}
