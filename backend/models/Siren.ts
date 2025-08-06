import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation {
  lat: number;
  lng: number;
}

export interface ISirenLog {
  action: 'on' | 'off';
  timestamp: Date;
  alertType?: string; // Optional: Type of alert if provided
  message?: string;   // Optional: Message played during 'on'
}

export interface ISiren extends Document {
  id: string;
  name: string;
  location: ILocation;
  playing: boolean;
  type: string[];
  status: 'active' | 'inactive' | 'warning' | 'alert';
  lastChecked: Date;
  district: string;
  block: string;
  parent_site: string;
  color: string;
  labels: string[];
  logs: ISirenLog[]; // Added logs array
}

const sirenSchema: Schema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    labels: [
      {
        type: String,
      },
    ],
    location: {
      type: {
        lat: Number,
        lng: Number,
      },
      required: true,
    },
    playing: {
      type: Boolean,
      required: true,
      default: false,
    },
    type: [
      {
        type: String,
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ['active', 'inactive', 'warning', 'alert'],
      default: 'inactive',
    },
    lastChecked: {
      type: Date,
      default: Date.now,
    },
    district: {
      type: String,
      required: true,
    },
    block: {
      type: String,
      required: true,
    },
    parent_site: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: '#000000',
    },
    logs: [
      {
        action: {
          type: String,
          enum: ['on', 'off'],
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        alertType: {
          type: String,
        },
        message: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<ISiren>('Siren', sirenSchema);