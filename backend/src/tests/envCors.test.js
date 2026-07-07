import { jest, describe, it, expect } from '@jest/globals';
import { envSchema } from '../config/env.js';

describe('Environment Variables and CORS Validation Tests (M-1 & M-5)', () => {
  const baseValidInput = {
    PORT: 5000,
    NODE_ENV: 'development',
    MONGO_URI: 'mongodb://localhost:27017/test_db',
    JWT_SECRET: 'testsecretjwt',
    JWT_REFRESH_SECRET: 'testsecretjwtrefresh',
    CORS_ORIGIN: 'http://localhost:3000',
    GOOGLE_CLIENT_ID: 'mock_google_client_id_12345',
    RAZORPAY_KEY_ID: 'rzp_test_mockKeyId123',
    RAZORPAY_KEY_SECRET: 'mockKeySecret456',
    RAZORPAY_WEBHOOK_SECRET: 'mockWebhookSecret789',
    CALENDLY_WEBHOOK_SECRET: 'mockCalendlyWebhookSecret123'
  };

  describe('Non-Production Validation (Development & Test)', () => {
    it('should successfully parse with development defaults', () => {
      const result = envSchema.safeParse(baseValidInput);
      expect(result.success).toBe(true);
    });

    it('should fall back to defaults for optional variables in development', () => {
      const { GOOGLE_CLIENT_ID, RAZORPAY_KEY_ID, ...minimalInput } = baseValidInput;
      const result = envSchema.safeParse(minimalInput);
      expect(result.success).toBe(true);
      expect(result.data.GOOGLE_CLIENT_ID).toBe('mock_google_client_id_12345');
      expect(result.data.RAZORPAY_KEY_ID).toBe('rzp_test_mockKeyId123');
    });
  });

  describe('Production Validation (NODE_ENV = production)', () => {
    const validProductionInput = {
      ...baseValidInput,
      NODE_ENV: 'production',
      CORS_ORIGIN: 'https://c2c.consulting.com',
      GOOGLE_CLIENT_ID: 'real_google_client_id_987654321',
      RAZORPAY_KEY_ID: 'rzp_live_realKeyId123',
      RAZORPAY_KEY_SECRET: 'realKeySecret4567890123',
      RAZORPAY_WEBHOOK_SECRET: 'realWebhookSecret78901234567',
      CALENDLY_WEBHOOK_SECRET: 'realCalendlyWebhookSecret1234567',
      EMAIL_USER: 'real_email_user@gmail.com',
      EMAIL_PASS: 'real_email_pass_1234'
    };

    it('should successfully parse when all secrets are real and CORS is explicit', () => {
      const result = envSchema.safeParse(validProductionInput);
      expect(result.success).toBe(true);
    });

    it('should support multiple explicit CORS origins in production', () => {
      const input = {
        ...validProductionInput,
        CORS_ORIGIN: 'https://c2c.consulting.com, https://admin.c2c.consulting.com'
      };
      const result = envSchema.safeParse(input);
      expect(result.success).toBe(true);
      expect(result.data.CORS_ORIGIN).toBe('https://c2c.consulting.com, https://admin.c2c.consulting.com');
    });

    // M-1: Unsafe production secret defaults
    describe('M-1: Required Secrets Defaults', () => {
      const secretsToTest = [
        'GOOGLE_CLIENT_ID',
        'RAZORPAY_KEY_ID',
        'RAZORPAY_KEY_SECRET',
        'RAZORPAY_WEBHOOK_SECRET',
        'CALENDLY_WEBHOOK_SECRET'
      ];

      secretsToTest.forEach((secretKey) => {
        it(`should fail startup in production if ${secretKey} is using its default mock value`, () => {
          const input = {
            ...validProductionInput,
            [secretKey]: baseValidInput[secretKey] // Set back to mock default
          };
          const result = envSchema.safeParse(input);
          expect(result.success).toBe(false);
          const errors = result.error.format();
          expect(errors[secretKey]).toBeDefined();
          expect(errors[secretKey]?._errors[0]).toContain('Production mode requires a real, non-default value');
        });

        it(`should fail startup in production if ${secretKey} is empty or missing`, () => {
          const input = { ...validProductionInput };
          delete input[secretKey]; // Zod will fill with default, which will trigger the check
          const result = envSchema.safeParse(input);
          expect(result.success).toBe(false);
          const errors = result.error.format();
          expect(errors[secretKey]).toBeDefined();
          expect(errors[secretKey]?._errors[0]).toContain('Production mode requires a real, non-default value');
        });
      });
    });

    // M-5: Unsafe wildcard CORS fallback
    describe('M-5: CORS Wildcard Fallback', () => {
      it('should fail startup in production if CORS_ORIGIN is wildcard (*)', () => {
        const input = {
          ...validProductionInput,
          CORS_ORIGIN: '*'
        };
        const result = envSchema.safeParse(input);
        expect(result.success).toBe(false);
        const errors = result.error.format();
        expect(errors.CORS_ORIGIN).toBeDefined();
        expect(errors.CORS_ORIGIN?._errors[0]).toContain('does not allow wildcard (*) CORS origins');
      });

      it('should fail startup in production if CORS_ORIGIN contains a wildcard in a list', () => {
        const input = {
          ...validProductionInput,
          CORS_ORIGIN: 'https://c2c.consulting.com, *'
        };
        const result = envSchema.safeParse(input);
        expect(result.success).toBe(false);
        const errors = result.error.format();
        expect(errors.CORS_ORIGIN).toBeDefined();
        expect(errors.CORS_ORIGIN?._errors[0]).toContain('does not allow wildcard (*) CORS origins');
      });

      it('should fail startup in production if CORS_ORIGIN is empty', () => {
        const input = {
          ...validProductionInput,
          CORS_ORIGIN: '   '
        };
        const result = envSchema.safeParse(input);
        expect(result.success).toBe(false);
        const errors = result.error.format();
        expect(errors.CORS_ORIGIN).toBeDefined();
        expect(errors.CORS_ORIGIN?._errors[0]).toContain('Production mode requires explicit trusted CORS origins');
      });
    });
  });
});
