import express from 'express';
import { handleSendEmail } from '../handlers/invitationHandler';

let invitationRouter = express.Router();

invitationRouter.post('/send-email', handleSendEmail);

export default invitationRouter;
