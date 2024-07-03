import express from 'express';
import sessionRouter from './sessionRouter';
import invitationRouter from './invitationRouter';

let mainRouter = express.Router();

mainRouter.use(invitationRouter);
mainRouter.use('/session', sessionRouter);

export default mainRouter;
