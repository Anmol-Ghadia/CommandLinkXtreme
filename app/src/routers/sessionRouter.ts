import express from "express";
import { handleCheckSession, handleGenerateSessionId } from "../handlers/sessionHandlers";

let sessionRouter = express.Router();

// Returns a 9 digit session id, returns 0 if error
sessionRouter.get("/create", handleGenerateSessionId);
// Returns status code 200 if given session id is valid
sessionRouter.get('/check/:sessionId', handleCheckSession)


export default sessionRouter;
