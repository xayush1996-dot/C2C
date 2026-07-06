import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'NEEDS_REVIEW', 'COMPLETED'],
      default: 'PENDING'
    },
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    calendlyEventId: {
      type: String
    },
    scheduledTime: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
