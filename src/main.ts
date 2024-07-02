import express, { Express, Request, Response } from "express";
import WebSocket from "ws";
import { WebSocketServer } from 'ws';
import { sendMail } from "./mailer";
import bodyParser from 'body-parser';
import { log } from './logger';
import { Client } from "./classes/Client";
import { AllSessions } from "./classes/AllSessions";
import { isMessage1, isMessage2, isMessage3, isMessage4 } from "./classes/Protocol";

const app: Express = express();
const port = process.env.PORT || 3000;

// Config
app.set('view engine', 'pug');

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
	res.render('chat', {});
});


// Returns a 9 digit session id, returns 0 if error
app.get("/session/create", (req: Request, res: Response) => {
	res.json({
		sessionId: ALLSESSIONS.getUniqueSessionId()
	});
});

// Returns status code 200 if given session id is valid
app.get('/session/check/:sessionId',(req:Request,res:Response) => {
	let sessionId = parseInt(req.params['sessionId']);
	
	if (isNaN(sessionId) ||
		sessionId == null ||
		!ALLSESSIONS.sessionIdExits(sessionId)) {
		res.status(400);
		res.send();
		return;
	}

	res.status(200);
	res.send();
	return;
})

// Body Parser for nodemailer 
app.use(bodyParser.json());

// Route for sending email
app.post('/send-email', (req: Request, res: Response) => {
	const { to } = req.body;
	const text = "You have been invited for a new conversatoin! Click the link below to join.";
	sendMail(to, text);
	res.status(200).send("Email Sent");
});

// Start Process
app.listen(port, () => {
	log(0, 'SERVER', `Server is running at http://localhost:${port}`);
});

// Store connections in a Map with custom IDs
// let clients = new Map();
// let nextClientId = 1;

const WSPort = 8080;
const wss = new WebSocketServer({ port: WSPort });
log(0, 'SERVER', `WebSocket Server Live on ws://localhost:${WSPort}`);

wss.on('upgrade', (req, res) => {
	log(1, 'CLIENT', `client requested to upgrade connection`);
})


const ALLSESSIONS = new AllSessions();

wss.on('connection', function connection(ws: WebSocket) {

	let client = new Client(ws);
	ALLSESSIONS.addClient(client);

	log(1,'CLIENT',`new client joined, id assigned: ${client.getClientId()}`);

	ws.on('error', console.error);

	ws.on('message', function messageIn(rawData) {
		const message = JSON.parse(rawData.toString());
		log(1, 'MESSAGE', `received command ${message.command} from ${client.getClientId()}`);
		switch (message.command) {
			case 'JOIN': // Received M1
				handleJoin(client, message);
				break;
			case 'MESG': // Received M2
				handleMessage(client, message);
				break;
			case 'A-JN': // Received M3 Join ack
				handleAcknowledgeJoin(client, message);
				break;
			case 'A-LV': // Received M3 Leave ack
				handleAcknowledgeLeave(client,message);
				break;
			case 'A-AL': // Received M4 ack leave and all alone
				handleAllAlone(client,message);
				break;
			case 'EXIT': // Received EXIT
				handleExit(client);
				break;
			default:
				log(1,'CLIENT',`${client.getClientId()} did not find a valid command`);
				break;
		}

	});

	ws.on('close', function close() {
	})
});

setInterval(()=>{
	ALLSESSIONS.logSession();
},5000);

function handleExit(exitingClient:Client) {
	ALLSESSIONS.removeClient(exitingClient);
}

function handleAllAlone(client:Client,message:any) {
	if (ALLSESSIONS.getClientsSession(client)?.getClientCount() != 1) {
		log(1,'SESSION',`unexpected A-AL command from client:${client.getClientId()}`);
		return;
	}

  if (isMessage4(message)) {
    log(1,'SESSION',`Assuming that client:${client.getClientId()} sent A-AL`);
    client.updateState(3);
    return;
  }

  log(1, 'SESSION', `received malformed A-AL (M4) from ${client.getAlias()}(${client.getClientId()})`);
}
function handleAcknowledgeLeave(client:Client, message: any) {
	const session = ALLSESSIONS.getClientsSession(client);
  if (session === null) {
    log(1, 'SESSION', `session not found for client ${client.getClientId()}  (234)`);
    return; 
  }
	
	if (!isMessage3(message)) {
    log(1,'SOCKET',`received M3 from ${client.getAlias()}(${client.getClientId()})`);
		log(0, 'MESSAGE', `not of type M3 ${client.getAlias()}(${client.getClientId()})`);
    return;
  }
  
	
  if (message.command == 'A-LV') {
    if (!session.checkClientAck(message.alias)) {
       log(1,'SESSION',`received unexpected alias ${client.getAlias()}(${client.getClientId()})`);
      return;
    }
    log(1,'SESSION',`Assuming that client:${client.getClientId()} sent A-LV`);
    session.removeClientFromS5(client);
    return;
  } 
  log(1, 'CLIENT' , `received unexpected A-LV from ${client.getAlias()}(${client.getClientId()})`)
}

function handleAcknowledgeJoin(senderClient:Client, message:any) {
  const session = ALLSESSIONS.getClientsSession(senderClient);
  if (session === null) {
    log(1, 'SESSION', `session not found for client ${senderClient.getClientId()}  (678)`);
    return; 
  }

  if (message.command !== 'A-JN') {
    log(1, 'CLIENT' , `expected A-JN but recieved other: from ${senderClient.getAlias()}(${senderClient.getClientId()})`);
    return;
  } 

  if (!session.checkClientAck(message.alias)) {
    log(1,'SESSION',`received unexpected alias ${senderClient.getAlias()}(${senderClient.getClientId()})`);
    return;
 }
  if (senderClient.getCurrentState() == 5) {
    session.removeClientFromS5(senderClient);
    log(1,'SOCKET',`received A-JN from ${senderClient.getAlias()}(${senderClient.getClientId()})`);
 }
 log(1, 'SESSION', `client not in state 5 ${senderClient.getAlias()}(${senderClient.getClientId()})`);

}

function handleJoin(client: Client, message: any) {
	if (!isMessage1(message)) {
		log(1,'SOCKET',`received JOIN command from ${client.getAlias()}(${client.getClientId()})`);
		log(0, 'MESSAGE', `failed to parse M1 from ${client.getAlias()}(${client.getClientId()})`);
		return;
	}
	log(1, 'MESSAGE', `received command:${message.command} from Client:${client.getAlias()}(${client.getClientId()})`);
		if (!ALLSESSIONS.promoteClient(client, message))
			log(0, 'ERROR', `in upgrading client:${client.getAlias()}(${client.getClientId()})`);
}

function handleMessage(client: Client, message: any) {
	log(1,'SOCKET',`received MESG command from ${client.getAlias()}(${client.getClientId()})`);
	let session = ALLSESSIONS.getClientsSession(client);
	if (session == null) {
		log(0,'HANDLE MESG',`could not find session of client:${client.getAlias()}(${client.getClientId()})`);
		return;
	}
	if (!isMessage2(message)) {
		log(0, 'MESSAGE', `failed to parse M2 from ${client.getAlias()}(${client.getClientId()})`);
		return;
	}
	session.forwardMessage(client,message);
}
