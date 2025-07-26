import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
	email: {
		type: String,
		required: true,
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
		enum: ['user', 'admin', 'superadmin'], //All users can trigger updates, admin can create users, superadmin can create admins
		default: 'user',
	},
});

/*
 * TODO: Add relevant middleware here to speed up and simplify processes
 * Also look at relevant virtuals!
 */

export default model('user', UserSchema);
