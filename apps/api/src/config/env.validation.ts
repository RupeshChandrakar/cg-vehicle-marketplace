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
});
