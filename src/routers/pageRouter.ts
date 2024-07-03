import express, { Request, Response } from "express";

let pageRouter = express.Router();

pageRouter.get("/", generalRouteFunction('index'));
pageRouter.get("/join/:sessionId", joinHandler);
pageRouter.get("/join", generalRouteFunction('join'));
pageRouter.get("/create", generalRouteFunction('create'));
pageRouter.get("/chat", generalRouteFunction('chat'));
// pageRouter.get("/email", generalRouteFunction('email')); // Use for development

// Helper function that returns a functino to respond with page
function generalRouteFunction(page: string) {
    return (req: Request, res: Response) => {
        res.render(page, {});
    }
}

function joinHandler(req:Request,res:Response) {
    res.render('join', {sessionId:req.params['sessionId']});
}

export default pageRouter;
