import mongoose, { Schema, Document } from 'mongoose';

export interface IDistrict extends Document {
	id: string;
	name: string;
	blocks: string[];
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
	},
	{ timestamps: true }
);

export default mongoose.model<IDistrict>('District', districtSchema);
