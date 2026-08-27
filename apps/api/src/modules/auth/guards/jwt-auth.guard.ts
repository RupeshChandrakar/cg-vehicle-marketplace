import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Requires a valid access-token bearer JWT; see JwtStrategy for validation. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
