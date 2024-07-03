import express, {Request, Response} from 'express';
import sessionRouter from './sessionRouter';
import invitationRouter from './invitationRouter';
import { getWSServerLink } from '../Socket';

let mainRouter = express.Router();

mainRouter.use(invitationRouter);
mainRouter.use('/session', sessionRouter);
mainRouter.get('/wss',(req:Request,res:Response)=>{
    res.send({url:getWSServerLink()});
})

export default mainRouter;
