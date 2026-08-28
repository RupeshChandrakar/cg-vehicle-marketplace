import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AI_PROVIDER, type AiProvider } from './ai-provider';
import { StubAiProvider } from './stub-ai.provider';
import { ClaudeAiProvider } from './claude-ai.provider';

// Global so EnquiriesService can inject AI_PROVIDER the same way it already
// injects NotificationsService, without a module-import cycle.
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: AI_PROVIDER,
      useFactory: (config: ConfigService): AiProvider => {
        const apiKey = config.get<string>('ANTHROPIC_API_KEY');
        return apiKey ? new ClaudeAiProvider(apiKey) : new StubAiProvider();
      },
      inject: [ConfigService],
    },
  ],
  exports: [AI_PROVIDER],
})
export class AiModule {}
