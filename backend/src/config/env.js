import dotenv from 'dotenv';
import { z } from 'zod';

// Load env variables
dotenv.config();

const isTestExecution = process.env.NODE_ENV === 'test' && process.env.JEST_WORKER_ID;
if (isTestExecution) {
  if (!process.env.MONGO_URI) {
    process.env.MONGO_URI = 'mongodb://localhost:27017/test_db';
  }
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'mock_jwt_secret_for_testing';
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    process.env.JWT_REFRESH_SECRET = 'mock_jwt_refresh_secret_for_testing';
  }
}

export const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().url({ message: 'MONGO_URI must be a valid MongoDB connection string' }),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(8, { message: 'JWT_SECRET must be at least 8 characters long' }),
  JWT_REFRESH_SECRET: z.string().min(8, { message: 'JWT_REFRESH_SECRET must be at least 8 characters long' }),
  TRUST_PROXY: z.string().default('loopback'),
  GOOGLE_CLIENT_ID: z.string().default('mock_google_client_id_12345'),
  RAZORPAY_KEY_ID: z.string().default('rzp_test_mockKeyId123'),
  RAZORPAY_KEY_SECRET: z.string().default('mockKeySecret456'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('mockWebhookSecret789'),
  CALENDLY_WEBHOOK_SECRET: z.string().default('mockCalendlyWebhookSecret123')
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production') {
    const mockSecrets = {
      GOOGLE_CLIENT_ID: 'mock_google_client_id_12345',
      RAZORPAY_KEY_ID: 'rzp_test_mockKeyId123',
      RAZORPAY_KEY_SECRET: 'mockKeySecret456',
      RAZORPAY_WEBHOOK_SECRET: 'mockWebhookSecret789',
      CALENDLY_WEBHOOK_SECRET: 'mockCalendlyWebhookSecret123'
    };

    for (const [key, defaultValue] of Object.entries(mockSecrets)) {
      const val = data[key];
      if (!val || val.trim() === '' || val === defaultValue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `Production mode requires a real, non-default value for ${key}`
        });
      }
    }

    const corsOrigin = data.CORS_ORIGIN;
    if (!corsOrigin || corsOrigin.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGIN'],
        message: 'Production mode requires explicit trusted CORS origins. CORS_ORIGIN must be set.'
      });
    } else {
      const origins = corsOrigin.split(',').map((o) => o.trim());
      if (origins.includes('*')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ORIGIN'],
          message: 'Production mode does not allow wildcard (*) CORS origins. Please set explicit trusted origins.'
        });
      }
    }
  }
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Environment validation failed:', JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
