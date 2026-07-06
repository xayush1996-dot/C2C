import mongoose from 'mongoose';

const processedWebhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    processedAt: {
      type: Date,
      default: Date.now,
      required: true
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
