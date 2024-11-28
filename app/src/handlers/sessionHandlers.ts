import { Request, Response } from 'express';
import { getAllSessions } from "../Socket";

// checks if the session id is valid, passed as parameter
export function handleCheckSession(req: Request, res: Response) {
	let sessionId = parseInt(req.params['sessionId']);

	if (isNaN(sessionId) ||
		sessionId == null ||
		!getAllSessions().sessionIdExits(sessionId)) {
		res.status(400);
		res.send();
		return;
	}

	res.status(200);
	res.send();
	return;
}

// responds with a new unique session id that can be used
export function handleGenerateSessionId(req: Request, res: Response) {
	res.json({
		sessionId: getAllSessions().getUniqueSessionId()
	});
}
