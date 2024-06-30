import express, { Express, Request, Response } from "express";
import WebSocket from "ws";
import { WebSocketServer } from 'ws';
// import { AllSessions, SessionClass } from "./session";
import { sendMail } from "./mailer";
import bodyParser from 'body-parser';
import { log } from './logger';
import { Client } from "./states";
import { AllSessions, isMessage1 } from "./sessionClass";

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

app.use(bodyParser.json());

app.post('/send-email', (req: Request, res: Response) => {
  const {to} = req.body;
  const text = "You have been invited for a new conversatoin! Click the link below to join.";
  sendMail(to,text);
  res.status(200).send("Email Sent");
});

// Start Process
app.listen(port, () => {
  log(0,'SERVER',`Server is running at http://localhost:${port}`);
});

// Store connections in a Map with custom IDs
// let clients = new Map();
// let nextClientId = 1;

const WSPort = 8080;
const wss = new WebSocketServer({ port: WSPort });
log(0,'SERVER',`WebSocket Server Live on ws://localhost:${WSPort}`);

wss.on('upgrade',(req,res)=>{
  log(1,'CLIENT',`client requested to upgrade connection`);
})


const ALLSESSIONS = new AllSessions();

wss.on('connection', function connection(ws: WebSocket) {

  let client = new Client(ws);
  ALLSESSIONS.addClient(client);

  console.log("new user connected");
  
  ws.on('error', console.error);

  ws.on('message', function messageIn(rawData) {
    const message = JSON.parse(rawData.toString());
    log(1,'MESSAGE',`received ${message}`);
    switch (message.command) {
      case 'JOIN':
          if (isMessage1(message)) {
            log(1,'MESSAGE',`received ${message.command}`);
            ALLSESSIONS.promoteClient(client,message);
          } else {
            log(1,'MESSAGE',`FAILED`);
            // send error !!! TODO
          }
          ALLSESSIONS.promoteClient(client,message);
        break;
      case '':
          // ALLSESSIONS.promoteClient(client);
        break;
      default:
        break;
    }
    
  });

  ws.on('close', function close() {
  })
});
