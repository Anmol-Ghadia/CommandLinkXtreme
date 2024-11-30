import { Request, Response } from "express";
import { sendMail } from "../helpers/mailer";
import { log } from "../helpers/logger";

// Sends email to the person according to body
//   body.from: alias
//   body.to: string
//   body.sessionId: number
export function handleSendEmail(req: Request, res: Response) {
	// Get request details
	let { from, to, sessionId } = req.body;
	sessionId = parseInt(sessionId);
	
	// do data validation
	if (!isValidEmail(to) || !isValidUsername(from) ||
		isNaN(sessionId) || typeof sessionId != 'number') {
		log(1,'MAIL',`failed to send email to:${to} from client:${from} on sessionId:${sessionId}`);	
		return;
	}

	sendMail(from, to, sessionId);
	res.status(200).send("Email Sent");
}

// returns true if the email follows email contraints
function isValidEmail(email:string) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// returns true if the username follows username contraints
function isValidUsername(username:string) {
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    return usernameRegex.test(username);
}
