import mongoose from 'mongoose';

const processedWebhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    eventType: {
      type: String
    },
    status: {
      type: String,
      required: true,
      enum: ['PROCESSING', 'PROCESSED', 'FAILED'],
      default: 'PROCESSING'
    },
    attemptCount: {
      type: Number,
      default: 1
    },
    lockedAt: {
      type: Date,
      default: Date.now
    },
    lastAttemptAt: {
      type: Date,
      default: Date.now
    },
    processedAt: {
      type: Date
    },
    safeLastError: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// TTL index to automatically purge old processed events after 30 days (2592000 seconds)
processedWebhookEventSchema.index({ processedAt: 1 }, { expireAfterSeconds: 2592000 });

const ProcessedWebhookEvent = mongoose.model('ProcessedWebhookEvent', processedWebhookEventSchema);

export default ProcessedWebhookEvent;
