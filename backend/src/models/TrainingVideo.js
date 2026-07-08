import mongoose from 'mongoose';

const trainingVideoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    duration: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    thumbnailUrl: {
      type: String,
      trim: true
    },
    videoUrl: {
      type: String,
      required: true,
      trim: true
    },
    isHomePreview: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const TrainingVideo = mongoose.model('TrainingVideo', trainingVideoSchema);

export default TrainingVideo;
