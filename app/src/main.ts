import express, { Express } from "express";
import bodyParser from 'body-parser';
import { log } from './helpers/logger';
import mainRouter from "./routers/mainRouter";
import pageRouter from "./routers/pageRouter";

const app: Express = express();
const port = process.env.SERVER_PORT || 3000;

// Config
app.set('view engine', 'pug');

// Middleware
app.use(express.static('public'))
app.use(bodyParser.json());

// Pages
app.use(pageRouter);

// API
app.use(mainRouter);

app.listen(port, () => {
	log(0, 'SERVER', `Server is running at http://localhost:${port}`);
});
