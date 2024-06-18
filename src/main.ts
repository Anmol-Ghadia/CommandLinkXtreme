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
  res.render('index', {
    title: 'Home Page',
    message: 'Home page'
  });
});

// Start Process
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
