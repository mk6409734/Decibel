import { connect } from 'mongoose';
const config = require('config');
import { ErrorCode } from '../utils/consts';
const db = config.get('mongoURI');

const connectDB = async () => {
	try {
		await connect(db);
		console.log('DB Success');
	} catch (err) {
		console.log('Error Connecting', err);
		process.exit(ErrorCode.DB_CONN_ERR);
	}
};

export default connectDB;
