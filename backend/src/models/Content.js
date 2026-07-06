import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    value: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Content = mongoose.model('Content', contentSchema);

export default Content;
