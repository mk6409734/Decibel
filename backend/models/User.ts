import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
	email: string;
	name: string;
	userName?: string;
	password: string;
	emailVerified: boolean;
	avatar?: string;
	verificationToken?: string;
	verificationValid?: Date;
	userType: 'admin' | 'manager' | 'operator';
	assignedDistricts: mongoose.Types.ObjectId[]; // Only for managers and operators
	createdBy?: mongoose.Types.ObjectId; // Reference to admin who created this user
}

const UserSchema: Schema = new Schema({
	email: {
		type: String,
		required: true,
		unique: true,
	},
	name: {
		type: String,
		required: true,
	},
	userName: {
		type: String,
	},
	password: {
		type: String,
		required: true,
	},
	emailVerified: {
		type: Boolean,
		default: false,
	},
	avatar: {
		type: String,
	},
	verificationToken: {
		type: String,
	},
	verificationValid: {
		type: Date,
	},
	userType: {
		type: String,
		enum: ['admin', 'manager', 'operator'],
		default: 'operator',
	},
	assignedDistricts: [{
		type: Schema.Types.ObjectId,
		ref: 'District',
	}],
	createdBy: {
		type: Schema.Types.ObjectId,
		ref: 'User',
	},
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
