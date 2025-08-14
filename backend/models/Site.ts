import mongoose, { Schema, Document } from 'mongoose';

export interface ISite extends Document {
	id: string;
	name: string;
	location: {
		lat: number;
		lng: number;
	};
	district: mongoose.Types.ObjectId; // Reference to district
	block: string;
	description?: string;
	status: 'active' | 'inactive';
	createdBy: mongoose.Types.ObjectId; // Reference to admin who created this site
}

const siteSchema: Schema = new Schema(
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
		location: {
			lat: {
				type: Number,
				required: true,
			},
			lng: {
				type: Number,
				required: true,
			},
		},
		district: {
			type: Schema.Types.ObjectId,
			ref: 'District',
			required: true,
		},
		block: {
			type: String,
			required: true,
		},
		description: {
			type: String,
		},
		status: {
			type: String,
			enum: ['active', 'inactive'],
			default: 'active',
		},
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	},
	{ timestamps: true }
);

// Index for efficient querying
siteSchema.index({ district: 1 });
siteSchema.index({ location: '2dsphere' });

export default mongoose.model<ISite>('Site', siteSchema);
