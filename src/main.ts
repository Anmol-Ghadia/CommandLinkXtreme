import express, { Express, Request, Response } from "express";
import WebSocket from "ws";
import { WebSocketServer } from 'ws';
import { AllSessions, SessionClass } from "./session";
import { sendMail } from "./mailer";
import bodyParser from 'body-parser';

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
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

// Store connections in a Map with custom IDs
// let clients = new Map();
// let nextClientId = 1;

const wss = new WebSocketServer({ port: 8080 });
console.log("WebSocket Server Live on ws://localhost:8080")

// wss.on('upgrade',(req,res,))
const allSessions = new AllSessions();
let usersWithoutSessionId: number[] = [];

function removeUserfromTemporaryList(clientId: number) {
  let newList:number[] = [];
  for (let index = 0; index < usersWithoutSessionId.length; index++) {
    const element = usersWithoutSessionId[index];
    if (element != clientId) {
      newList.push(element);
    }
  }
  usersWithoutSessionId = newList;
}

wss.on('connection', function connection(ws: WebSocket) {
  
  // const clientId = nextClientId++;
  // clients.set(clientId, ws);
  console.log("new user connected");
  const clientId = allSessions.generateClientId();

  usersWithoutSessionId.push(clientId);
  
  ws.on('error', console.error);

  ws.on('message', function messageIn(rawData) {
    console.log("==================================");
    console.log(usersWithoutSessionId);
    console.log("==================================");
    let data = rawData.toString('utf-8');
    if (usersWithoutSessionId.includes(clientId)) {
      // First message
      let data = rawData.toString('utf-8');
      let sessionId = parseInt(data);
      
      if (isNaN(sessionId)) {
        ws.send("incorrect Session ID");
        return;
      }

      // sessionID is valid,
      //    if session is created, join the user
      //    else create a new session
      console.log("user sent: ", data);
      if (allSessions.hasSession(sessionId)) {
        //     join the user
        console.log("joining user to: ", data);
        allSessions.addClient(sessionId,clientId,ws);
        console.log("Joined ses: ", data);
      } else {
        console.log("creating new session: ", data);
        //   create a new session
        allSessions.createSession(sessionId,clientId,ws);
        console.log("created new session: ", data);
      }

      removeUserfromTemporaryList(clientId);

    } else {
      // Later messages
      let ses = allSessions.getSessionByClientId(clientId);
      let session = allSessions.getSession(ses) as SessionClass;
      session.insertMesage(data,clientId);
      console.log(data);
    }
    // console.log(`(${clientId}) sent: (${data})`);
  });

  ws.on('close', function close() {
    // clients.delete(clientId);
    // console.log(`(${clientId}) closed connection`)
  })
});

setInterval(()=>{
  // console.log(`Current clients: ${clients.size}`);
  console.log(usersWithoutSessionId);
},10*1000)
