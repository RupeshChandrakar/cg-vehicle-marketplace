import * as Joi from 'joi';

/**
 * Fails fast on boot if required configuration is missing or malformed,
 * instead of surfacing a confusing error later at first use.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(4000),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_TOKEN_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TOKEN_TTL: Joi.string().default('30d'),

  // tlds disabled: this is a local dev placeholder address (e.g. "*.local"),
  // not a real inbox — Joi's default email check rejects non-IANA TLDs.
  SEED_ADMIN_EMAIL: Joi.string()
    .email({ tlds: { allow: false } })
    .required(),
  SEED_ADMIN_PASSWORD: Joi.string().min(8).required(),

  STORAGE_ENDPOINT: Joi.string().uri().required(),
  STORAGE_REGION: Joi.string().default('us-east-1'),
  STORAGE_ACCESS_KEY_ID: Joi.string().required(),
  STORAGE_SECRET_ACCESS_KEY: Joi.string().required(),
  STORAGE_BUCKET: Joi.string().required(),
  STORAGE_PUBLIC_URL: Joi.string().uri().required(),

  // Optional: AiModule falls back to StubAiProvider (no real model calls)
  // when this isn't set — see docs/ARCHITECTURE.md "Phase 5 notes".
  ANTHROPIC_API_KEY: Joi.string().optional(),
});
