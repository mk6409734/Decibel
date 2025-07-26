import { Request, Response, Router } from 'express';
const router = Router();
import { check, validationResult } from 'express-validator';
const config = require('config');
import crypto from 'crypto';
import User from '../../models/User';
import { sign } from 'jsonwebtoken';
import { compare, genSalt, hash } from 'bcryptjs';
import userAuth from '../../middleware/userAuth';
import { Types } from 'mongoose';
import sendMail from '../../utils/mail/sendMail';
import { confirm, forgot } from '../../utils/mail/templateMail';
import { ErrorCode, errorWrapper, cleanMap } from '../../utils/consts';

// @route       POST api/user/register
// @desc        Create/Add a new user
// @access      Public
router.post(
	'/register',
	//**********************************Validations**********************************/
	[
		check('name', 'Name is required').not().isEmpty(),

		check('email', 'Please input valid email').isEmail(),

		check('password', 'Please enter a password with 6 or more characters').isLength({
			min: 6,
		}),
	],
	async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			console.log(errors);
			return res.status(ErrorCode.HTTP_BAD_REQ).json({ errors: errors.array() });
		}

		try {
			//**********************************Handler Code**********************************/

			const { email, name, password } = req.body;
			let user = await User.findOne({ email });
			const salt = await genSalt(10);

			if (user) {
				return res.status(ErrorCode.HTTP_BAD_REQ).json(errorWrapper('User Already Exists'));
			}

			const avatar = config.get('avatarBaseURI') + name.replace(' ', '+');
			const verificationToken = crypto.randomBytes(128).toString('hex');
			user = new User({
				name,
				email,
				password,
				avatar,
				verificationToken,
				verificationValid: Date.now() + 43200000,
			});

			user.password = await hash(password, salt);

			await user.save();
			sendMail(email, confirm(verificationToken));

			const payload = {
				user: {
					id: user.id,
					verified: false,
				},
			};

			sign(payload, config.get('jwtSecret'), { expiresIn: 36000 }, (err, token) => {
				if (err) throw err;
				res.json({ token });
			});
		} catch (err) {
			console.error(`Err register:`, err);
			res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
		}
	}
);

// @route       POST api/user/login
// @desc        Login/ Get auth token
// @access      Public
router.post(
	'/login',
	//**********************************Validations**********************************/
	[
		check('email', 'Please input valid email').isEmail(),
		check('password', 'Password is required').exists(),
	],

	async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(ErrorCode.HTTP_BAD_REQ).json(errorWrapper(errors.array()[0].msg));
		}

		//**********************************Handler Code**********************************/

		try {
			const { email, password } = req.body;
			let user = await User.findOne({ email });

			if (!user) {
				return res.status(ErrorCode.HTTP_BAD_REQ).json(errorWrapper('Invalid Credentials'));
			}

			const cresentialCheck = await compare(password, user.password);
			if (!cresentialCheck) {
				return res.status(ErrorCode.HTTP_BAD_REQ).json(errorWrapper('Invalid Credentials'));
			}
			const payload = {
				user: {
					id: user.id,
				},
			};
			sign(payload, config.get('jwtSecret'), { expiresIn: 36000 }, (err, token) => {
				if (err) throw err;
				res.json({ token, emailVerified: user?.emailVerified });
			});
		} catch (err) {
			console.error(`Err login:`, err);
			res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
		}
	}
);

// @route       POST api/user/forgot
// @desc        Forgot password mail trigger
// @access      Public
router.post(
	'/forgot',
	//**********************************Validations**********************************/
	[check('email', 'Please input valid email').isEmail()],

	async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(ErrorCode.HTTP_BAD_REQ).json(errorWrapper(errors.array()[0].msg));
		}

		//**********************************Handler Code**********************************/
		try {
			const { email } = req.body;
			let user = await User.findOne({ email });
			if (!user) {
				return res.status(ErrorCode.HTTP_BAD_REQ).json(errorWrapper('Email Not Found'));
			}
			const verificationToken = crypto.randomBytes(128).toString('hex');
			user.verificationToken = verificationToken;
			user.verificationValid = new Date(new Date().getTime() + 43200000);

			await sendMail(email, forgot(verificationToken));
			await user.save();
			res.json({ success: 'Email Sent!' });
		} catch (err) {
			console.error(`Err forgot:`, err);
			res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
		}
	}
);

// @route       GET api/user/confirm/:verificationToken
// @desc        Confirmation for verification and reset password
// @access      Public
router.get('/confirm/:verificationToken', async (req: Request, res: Response) => {
	try {
		const { verificationToken } = req.params;
		let user = await User.findOne({ verificationToken });

		if (!user) {
			return res.status(ErrorCode.HTTP_BAD_REQ).json(errorWrapper('Token Invalid'));
		}
		if (!user.verificationValid) {
			return res
				.status(ErrorCode.HTTP_BAD_REQ)
				.json(errorWrapper('User Validation Completed Already!'));
		}
		let timeLeft = Date.now() - user.verificationValid?.getTime();
		if (timeLeft > 0) {
			user.verificationToken = '';
			user.verificationValid = undefined;
			await user.save();
			return res.status(ErrorCode.HTTP_FORBIDDEN).json(errorWrapper('Token Expired'));
		}
		user.verificationToken = '';
		user.verificationValid = undefined;
		user.emailVerified = true;
		await user.save();
		return res.json({ emailVerification: !user.emailVerified });
	} catch (err) {
		console.error(`Err confirm:`, err);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
});

// @route       POST api/user/
// @desc        Get user details
// @access      Public
router.get('/', userAuth, async (req: Request, res: Response) => {
	try {
		let user;
		if (req.user && req.user.id !== undefined && req.user.id !== null)
			user = await User.findOne(new Types.ObjectId(req.user.id));
		res.json(user);
	} catch (err) {
		console.error(`Err loadUser:`, err);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
});

// @route       POST api/auth/update
// @desc        Update user details
// @access      Private
router.post('/update', userAuth, async (req, res) => {
	try {
		const { name, avatar, userName } = req.body;
		let updateObject = {
			name,
			avatar,
			userName,
		};
		cleanMap(updateObject);
		if (updateObject.name) {
			updateObject.avatar = config.get('avatarBaseURI') + name.replace(' ', '+');
		}
		if (!req.user || req.user.id === undefined || req.user.id === null) {
			return res.status(ErrorCode.HTTP_BAD_REQ).json(errorWrapper('Invalid Token'));
		} else {
			const user = await User.findByIdAndUpdate(
				new Types.ObjectId(req.user.id),
				{
					$set: {
						...updateObject,
					},
				},
				{ new: true }
			);
			if (!user) {
				return res.status(ErrorCode.HTTP_NOT_FOUND).json(errorWrapper('User Not Found'));
			}
			res.json(user);
		}
	} catch (err) {
		console.error(`Err updateUser:`, err);
		res.status(ErrorCode.HTTP_SERVER_ERROR).json(errorWrapper('Server Error'));
	}
});

export default router;
