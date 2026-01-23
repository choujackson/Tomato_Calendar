// src/events/events.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Event } from './event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
  ) {}

  // 创建事件
  async create(createEventDto: CreateEventDto, userId: number): Promise<Event> {
    const event = this.eventsRepository.create({
      ...createEventDto,
      userId, // 关联当前用户
    });
    return this.eventsRepository.save(event);
  }

  // 获取用户某段时间内的事件 (例如月视图)
  async findAllByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Event[]> {
    return this.eventsRepository.find({
      where: {
        userId,
        startTime: Between(startDate, endDate), // 查询开始时间在范围内的事件
        // 注意：实际生产中，跨日期的事件可能需要更复杂的查询逻辑 (Overlap query)
        // 但对于基础版本，Between 足够了
      },
      order: {
        startTime: 'ASC',
      },
    });
  }

  // 获取单个事件详情
  async findOne(id: number, userId: number): Promise<Event> {
    const event = await this.eventsRepository.findOneBy({ id });
    
    if (!event) {
      throw new NotFoundException('事件不存在');
    }
    
    // 安全检查：确保只能查看自己的事件
    if (event.userId !== userId) {
      throw new ForbiddenException('您无权访问此事件');
    }

    return event;
  }

  // 更新事件
  async update(id: number, updateEventDto: UpdateEventDto, userId: number): Promise<Event> {
    const event = await this.findOne(id, userId); // 复用 findOne 进行权限检查
    
    // 合并更新
    Object.assign(event, updateEventDto);
    
    return this.eventsRepository.save(event);
  }

  // 删除事件
  async remove(id: number, userId: number): Promise<void> {
    const event = await this.findOne(id, userId); // 复用 findOne 进行权限检查
    await this.eventsRepository.remove(event);
  }
}