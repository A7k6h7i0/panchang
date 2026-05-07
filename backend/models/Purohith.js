import mongoose from "mongoose";

const PurohithSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    categories: {
      type: String,
      trim: true,
    },
    place_id: {
      type: String,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: false,
      },
    },
    // Additional fields that may be useful
    reviews: {
      type: Array,
      default: [],
    },
    link: {
      type: String,
      trim: true,
    },
    workday_timing: {
      type: String,
      trim: true,
    },
    // Legacy fields for backward compatibility
    specialization: {
      type: String,
      trim: true,
    },
    workingTemple: {
      type: Boolean,
      default: false,
    },
    templeName: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure we don't store an empty geo object (avoids 2dsphere errors).
PurohithSchema.pre("validate", function (next) {
  const coords = this?.location?.coordinates;
  if (!Array.isArray(coords) || coords.length !== 2) {
    this.location = undefined;
  }
  next();
});

// Index for geospatial queries
PurohithSchema.index({ location: "2dsphere" });

export default mongoose.model("Purohith", PurohithSchema);
