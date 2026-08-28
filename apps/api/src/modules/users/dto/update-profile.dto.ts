import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Deliberately name-only. Phone is the upsert key in
 *  UsersService.findOrCreateByPhone — changing it is a distinct future
 *  flow (OTP-to-new-number + verify + re-key + collision handling), not a
 *  field on this form. Global ValidationPipe (whitelist+forbidNonWhitelisted
 *  in main.ts) already rejects any other field sent alongside this one. */
export class UpdateProfileDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;
}
