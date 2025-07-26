import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICAPSource extends Document {
	name: string;
	url: string;
	country: string;
	language: string;
	isActive: boolean;
	isDefault: boolean;
	fetchInterval: number; // in seconds
	lastFetched?: Date;
	lastSuccessfulFetch?: Date;
	totalFetches?: number;
	successfulFetches?: number;
	failedFetches?: number;
	lastErrorMessage?: string;
	description?: string;
	metadata?: {
		provider?: string;
		contactEmail?: string;
		documentation?: string;
	};
	needsFetching(): boolean;
	recordFetchAttempt(success: boolean, errorMessage?: string): void;
	getSuccessRate(): number;
}

export interface ICAPSourceModel extends Model<ICAPSource> {
	getDefaultSource(): Promise<ICAPSource | null>;
	getActiveSources(): Promise<ICAPSource[]>;
	getSourcesNeedingFetch(): Promise<ICAPSource[]>;
}

const CAPSourceSchema = new Schema<ICAPSource>(
	{
		name: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		url: {
			type: String,
			required: true,
			trim: true,
		},
		country: {
			type: String,
			required: true,
			trim: true,
		},
		language: {
			type: String,
			default: 'en',
			trim: true,
		},
		isActive: {
			type: Boolean,
			default: true,
			index: true,
		},
		isDefault: {
			type: Boolean,
			default: false,
		},
		fetchInterval: {
			type: Number,
			default: 60, // Default to 60 seconds
			min: 30, // Minimum 30 seconds to avoid overloading sources
		},
		lastFetched: {
			type: Date,
		},
		lastSuccessfulFetch: {
			type: Date,
		},
		totalFetches: {
			type: Number,
			default: 0,
		},
		successfulFetches: {
			type: Number,
			default: 0,
		},
		failedFetches: {
			type: Number,
			default: 0,
		},
		lastErrorMessage: {
			type: String,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},
		metadata: {
			provider: String,
			contactEmail: String,
			documentation: String,
		},
	},
	{
		timestamps: true,
	}
);

// Ensure only one default source
CAPSourceSchema.pre('save', async function (next) {
	if (this.isDefault && this.isModified('isDefault')) {
		await mongoose.model('CAPSource').updateMany({ _id: { $ne: this._id } }, { isDefault: false });
	}
	next();
});

// Static method to get default source
CAPSourceSchema.statics.getDefaultSource = function () {
	return this.findOne({ isDefault: true, isActive: true });
};

// Static method to get all active sources
CAPSourceSchema.statics.getActiveSources = function () {
	return this.find({ isActive: true }).sort({ country: 1, name: 1 });
};

// Static method to get sources that need fetching
CAPSourceSchema.statics.getSourcesNeedingFetch = function () {
	return this.find({
		isActive: true,
		lastFetched: { $lt: new Date(Date.now() - 300000) }, // Fetch if last fetched more than 5 minutes ago
	}).sort({ lastFetched: 1 });
};

// Method to check if source needs fetching
CAPSourceSchema.methods.needsFetching = function (): boolean {
	if (!this.lastFetched) return true;

	const now = new Date();
	const lastFetchTime = new Date(this.lastFetched).getTime();
	const intervalMs = this.fetchInterval * 1000;

	return now.getTime() - lastFetchTime >= intervalMs;
};

// Method to record a fetch attempt
CAPSourceSchema.methods.recordFetchAttempt = function (success: boolean, errorMessage?: string) {
	this.totalFetches = (this.totalFetches || 0) + 1;
	if (success) {
		this.successfulFetches = (this.successfulFetches || 0) + 1;
		this.lastSuccessfulFetch = new Date();
		this.lastErrorMessage = undefined;
	} else {
		this.failedFetches = (this.failedFetches || 0) + 1;
		this.lastErrorMessage = errorMessage || 'Unknown error';
	}
	this.lastFetched = new Date();
	return this.save();
};

// Method to get success rate
CAPSourceSchema.methods.getSuccessRate = function (): number {
	if (this.totalFetches === 0) return 0;
	return (this.successfulFetches || 0) / this.totalFetches;
};

const CAPSource = mongoose.model<ICAPSource, ICAPSourceModel>('CAPSource', CAPSourceSchema);

export default CAPSource;
