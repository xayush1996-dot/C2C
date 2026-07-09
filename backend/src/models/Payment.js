import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    amount: {
      type: Number,
      required: true // in paise
    },
    currency: {
      type: String,
      required: true,
      default: 'INR'
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    razorpaySignature: {
      type: String
    },
    paymentMethod: {
      type: String
    },
    failureReason: {
      type: String
    },
    failedAttempts: [
      {
        razorpayPaymentId: {
          type: String
        },
        failureReason: {
          type: String
        },
        failedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    refundedAmount: {
      type: Number,
      default: 0
    },
    processedRefunds: [
      {
        refundId: {
          type: String
        },
        amount: {
          type: Number
        },
        processedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    signatureVerifiedAt: {
      type: Date
    },
    providerVerifiedAt: {
      type: Date
    },
    paidAt: {
      type: Date
    },
    paymentConfirmationEmailSentAt: {
      type: Date
    },
    invoiceEmailState: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SENT', 'FAILED'],
      default: 'PENDING'
    },
    calendlyEmailSentAt: {
      type: Date
    },
    calendlyEmailState: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SENT', 'FAILED'],
      default: 'PENDING'
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
      default: 'PENDING'
    }
  },
  {
    timestamps: true
  }
);

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
