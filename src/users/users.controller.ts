import { Controller, Get, Request } from '@nestjs/common';

import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getUserProfile(@Request() req) {
    return this.usersService.getUserProfile(req.user.sub);
  }
}
