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
		await connect(db!);
		console.log('DB Success');
	} catch (err) {
		console.log('Error Connecting', err);
		process.exit(ErrorCode.DB_CONN_ERR);
	}
};

export default connectDB;
