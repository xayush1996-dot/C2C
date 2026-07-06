import mongoose from 'mongoose';

const userRefreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    familyId: {
      type: String,
      required: true
    },
    isUsed: {
      type: Boolean,
      default: false,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// TTL index to automatically purge expired user tokens from the DB
userRefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const UserRefreshToken = mongoose.model('UserRefreshToken', userRefreshTokenSchema);

export default UserRefreshToken;
