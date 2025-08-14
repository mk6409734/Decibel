const sgMail = require('@sendgrid/mail');

let sendMail = async (emailId: string, content: any) => {
	try {
		// For now, just log the email instead of sending it
		console.log('Email would be sent to:', emailId);
		console.log('Email content:', content);
		
		// TODO: Uncomment this when SendGrid is properly configured
		/*
		sgMail.setApiKey(process.env.SENDGRID_API_KEY);
		const msg = {
			to: emailId,
			from: 'no-reply@quickjam.studio',
			...content,
		};
		await sgMail.send(msg);
		*/
	} catch (error) {
		console.error('Email sending error:', error);
		// Don't throw error to prevent registration from failing
	}
};

export default sendMail;
