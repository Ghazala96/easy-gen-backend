import { Controller, Get, HttpStatus, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns my user profile' })
  async getUserProfile(@Request() req) {
    return this.usersService.getUserProfile(req.user.sub);
  }
}
