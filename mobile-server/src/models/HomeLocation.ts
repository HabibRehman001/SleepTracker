import { Schema, model, type InferSchemaType } from 'mongoose'

/**
 * Single-user home pin for geofencing (Step 137).
 * One document — upserted via PUT /home-location.
 */
export const homeLocationSchema = new Schema(
  {
    latitude: {
      type: Number,
      required: true,
      min: [-90, 'latitude must be >= -90'],
      max: [90, 'latitude must be <= 90'],
    },
    longitude: {
      type: Number,
      required: true,
      min: [-180, 'longitude must be >= -180'],
      max: [180, 'longitude must be <= 180'],
    },
    label: { type: String, default: 'home', trim: true, maxlength: 64 },
  },
  {
    timestamps: true,
    collection: 'home_locations',
  }
)

export type HomeLocationDoc = InferSchemaType<typeof homeLocationSchema>

export const HomeLocation = model('HomeLocation', homeLocationSchema)
