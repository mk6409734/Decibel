import { connect } from 'mongoose';
import dotenv from "dotenv";
import { ErrorCode } from '../utils/consts';
import mongoose from 'mongoose';
mongoose.set('strictQuery', true); // or false if needed

const config = require('config');

dotenv.config();

const db = process.env.MONGO_URI;

const connectDB = async () => {
	try {
		console.log('Attempting to connect to MongoDB at:', db);
		await connect(db!);
		console.log('MongoDB connected successfully!');
	} catch (err) {
		console.log('Error Connecting to MongoDB:', err);
		process.exit(ErrorCode.DB_CONN_ERR);
	}
};

export default connectDB;
