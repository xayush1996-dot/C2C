import dotenv from 'dotenv';
import { z } from 'zod';

// Load env variables
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().url({ message: 'MONGO_URI must be a valid MongoDB connection string' }),
  CORS_ORIGIN: z.string().default('*'),
  JWT_SECRET: z.string().min(8, { message: 'JWT_SECRET must be at least 8 characters long' }),
  JWT_REFRESH_SECRET: z.string().min(8, { message: 'JWT_REFRESH_SECRET must be at least 8 characters long' }),
  TRUST_PROXY: z.string().default('loopback'),
  GOOGLE_CLIENT_ID: z.string().default('mock_google_client_id_12345'),
  RAZORPAY_KEY_ID: z.string().default('rzp_test_mockKeyId123'),
  RAZORPAY_KEY_SECRET: z.string().default('mockKeySecret456'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('mockWebhookSecret789'),
  CALENDLY_WEBHOOK_SECRET: z.string().default('mockCalendlyWebhookSecret123')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Environment validation failed:', JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
