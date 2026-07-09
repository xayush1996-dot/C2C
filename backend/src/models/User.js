import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      select: false
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      default: 'CUSTOMER',
      enum: ['CUSTOMER'],
      immutable: true,
      required: true
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    resetPasswordToken: {
      type: String,
      select: false
    },
    resetPasswordExpire: {
      type: Date,
      select: false
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      required: true
    },
    lockoutUntil: {
      type: Date
    },
    isPremium: {
      type: Boolean,
      default: false
    },
    premiumExpiryDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to hash user passwords
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-update hook to hash passwords on query updates
userSchema.pre(['findOneAndUpdate', 'updateOne'], async function (next) {
  const update = this.getUpdate();
  if (update && update.password) {
    try {
      const salt = await bcrypt.genSalt(12);
      update.password = await bcrypt.hash(update.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Instance method to compare candidate passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
