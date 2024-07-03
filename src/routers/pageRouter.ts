import express, { Request, Response } from "express";

let pageRouter = express.Router();

pageRouter.get("/", routeFunction('index'));
pageRouter.get("/join", routeFunction('join'));
pageRouter.get("/create", routeFunction('create'));
pageRouter.get("/chat", routeFunction('chat'));

// Helper function that returns a functino to respond with page
function routeFunction(page: string) {
    return (req: Request, res: Response) => {
        res.render(page, {});
    }
}

export default pageRouter;
