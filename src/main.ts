import express, { Express, Request, Response } from "express";
// import dotenv from "dotenv";

// dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Config
app.set('view engine','pug');

// Make static files public
app.use(express.static('public'))

// Route for home page
app.get("/", (req: Request, res: Response) => {
  res.render('index', {});
});

app.get("/join", (req: Request, res: Response) => {
  res.render('join', {});
});

app.get("/create", (req: Request, res: Response) => {
  res.render('create', {});
});

app.get("/chat", (req: Request, res: Response) => {
  res.render('chat',{});
});

// Start Process
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
