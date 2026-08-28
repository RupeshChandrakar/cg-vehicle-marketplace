import { IsString } from 'class-validator';

export class AssignEnquiryDto {
  @IsString()
  agentId!: string;
}
