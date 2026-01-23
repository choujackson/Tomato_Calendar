// src/events/events.controller.ts
import { 
    Controller, Get, Post, Body, Patch, Param, Delete, Query, 
    UseGuards, Request 
  } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport'; // 导入 AuthGuard
  import { EventsService } from './events.service';
  import { CreateEventDto } from './dto/create-event.dto';
  import { UpdateEventDto } from './dto/update-event.dto';
  
  @Controller('events')
  @UseGuards(AuthGuard('jwt')) // 关键：启用 JWT 守卫，所有接口都需要登录
  export class EventsController {
    constructor(private readonly eventsService: EventsService) {}
  
    @Post()
    create(@Request() req, @Body() createEventDto: CreateEventDto) {
      // req.user 由 JwtStrategy.validate 方法返回，包含 { userId: ..., email: ... }
      return this.eventsService.create(createEventDto, req.user.userId);
    }
  
    @Get()
    findAll(
      @Request() req,
      @Query('startDate') startDateStr: string,
      @Query('endDate') endDateStr: string,
    ) {
      const start = startDateStr ? new Date(startDateStr) : new Date();
      const end = endDateStr ? new Date(endDateStr) : new Date();
      return this.eventsService.findAllByDateRange(req.user.userId, start, end);
    }
  
    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
      return this.eventsService.findOne(+id, req.user.userId);
    }
  
    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
      return this.eventsService.update(+id, updateEventDto, req.user.userId);
    }
  
    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
      return this.eventsService.remove(+id, req.user.userId);
    }
  }