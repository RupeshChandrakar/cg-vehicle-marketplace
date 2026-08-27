import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { User } from '../../generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Phone number is the durable identity, matching the eventual OTP login flow. */
  findOrCreateByPhone(phone: string, name?: string): Promise<User> {
    return this.prisma.user.upsert({
      where: { phone },
      update: name ? { name } : {},
      create: { phone, name },
    });
  }
}
