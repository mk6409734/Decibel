import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { ErrorCode, errorWrapper } from '../utils/consts';
import User from '../models/User';
import Site from '../models/Site';
const config = require('config');

// Extend Request interface to include user
declare global {
	namespace Express {
		interface Request {
			user?: { id: string };
		}
	}
}

let userAuth = async (req: Request, res: Response, next: NextFunction) => {
	const token = req.header('x-auth-token');

	if (!token) {
		return res
			.status(ErrorCode.HTTP_NOT_AUTH)
			.json(errorWrapper('Token Not Found'));
	}

	try {
		verify(token, config.get('jwtSecret'), (error: any, decoded: any) => {
			if (error) {
				res
					.status(ErrorCode.HTTP_NOT_AUTH)
					.json(errorWrapper('Token is not valid'));
			} else {
				req.user = decoded.user;
				next();
			}
		});
	} catch (err: any) {
		console.error('Token Error ' + err.message);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
};

// Middleware to check if user is admin
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user || user.userType !== 'admin') {
			return res
				.status(ErrorCode.HTTP_FORBIDDEN)
				.json(errorWrapper('Admin access required'));
		}
		next();
	} catch (err: any) {
		console.error('Admin check error: ' + err.message);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
};

// Middleware to check if user is admin or manager
export const requireAdminOrManager = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user || (user.userType !== 'admin' && user.userType !== 'manager')) {
			return res
				.status(ErrorCode.HTTP_FORBIDDEN)
				.json(errorWrapper('Admin or Manager access required'));
		}
		next();
	} catch (err: any) {
		console.error('Admin/Manager check error: ' + err.message);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
};

// Middleware to check district access for managers and operators
export const checkDistrictAccess = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const user = await User.findById(req.user.id).populate('assignedDistricts');
		if (!user) {
			return res
				.status(ErrorCode.HTTP_NOT_AUTH)
				.json(errorWrapper('User not found'));
		}

		// Admins have access to all districts
		if (user.userType === 'admin') {
			return next();
		}

		// For managers and operators, check if they have access to the requested district
		const districtId = req.params.districtId || req.body.districtId || req.query.districtId;
		if (districtId) {
			const hasAccess = user.assignedDistricts.some((district: any) => 
				district._id.toString() === districtId.toString()
			);
			if (!hasAccess) {
				return res
					.status(ErrorCode.HTTP_FORBIDDEN)
					.json(errorWrapper('Access denied to this district'));
			}
		}

		next();
	} catch (err: any) {
		console.error('District access check error: ' + err.message);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
};

// Middleware to check site access for managers and operators
export const checkSiteAccess = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const user = await User.findById(req.user.id).populate('assignedDistricts');
		if (!user) {
			return res
				.status(ErrorCode.HTTP_NOT_AUTH)
				.json(errorWrapper('User not found'));
		}

		// Admins have access to all sites
		if (user.userType === 'admin') {
			return next();
		}

		// For managers and operators, check if they have access to the requested site
		const siteId = req.params.siteId || req.body.siteId || req.query.siteId;
		if (siteId) {
			const site = await Site.findById(siteId);
			if (!site) {
				return res
					.status(ErrorCode.HTTP_NOT_FOUND)
					.json(errorWrapper('Site not found'));
			}

			const hasAccess = user.assignedDistricts.some((district: any) => 
				district._id.toString() === site.district.toString()
			);
			if (!hasAccess) {
				return res
					.status(ErrorCode.HTTP_FORBIDDEN)
					.json(errorWrapper('Access denied to this site'));
			}
		}

		next();
	} catch (err: any) {
		console.error('Site access check error: ' + err.message);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
};

export default userAuth;
