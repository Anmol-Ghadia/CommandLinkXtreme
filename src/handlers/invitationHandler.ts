import { Request, Response } from "express";
import { sendMail } from "../helpers/mailer";

// Sends email to the person according to body
//   body.sendTo: string
//   body.sessionId: number
// TODO !!!
export function handleSendEmail(req: Request, res: Response) {
	const { to } = req.body;
	const text = "You have been invited for a new conversatoin! Click the link below to join.";
	sendMail(to, text);
	res.status(200).send("Email Sent");
}
