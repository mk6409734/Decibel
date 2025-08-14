import mongoose, { Schema, Document } from 'mongoose';

export interface IDistrict extends Document {
	id: string;
	name: string;
	blocks: string[];
	sites: mongoose.Types.ObjectId[]; // Reference to sites
	createdBy: mongoose.Types.ObjectId; // Reference to admin who created this district
}

const districtSchema: Schema = new Schema(
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
		blocks: [String],
		sites: [{
			type: Schema.Types.ObjectId,
			ref: 'Site',
		}],
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	},
	{ timestamps: true }
);

export default mongoose.model<IDistrict>('District', districtSchema);
