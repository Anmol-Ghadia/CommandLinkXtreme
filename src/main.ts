import express, { Express, Request, Response } from "express";
import WebSocket from "ws";
import { WebSocketServer } from 'ws';
// import { AllSessions, SessionClass } from "./session";
import { sendMail } from "./mailer";
import bodyParser from 'body-parser';
import { log } from './logger';
import { Client } from "./states";
import { AllSessions, isMessage1, isMessage2 } from "./sessionClass";

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

app.use(bodyParser.json());

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

	console.log("new user connected");

	ws.on('error', console.error);

	ws.on('message', function messageIn(rawData) {
		const message = JSON.parse(rawData.toString());
		log(1, 'MESSAGE', `received ${rawData.toString()}`);
		switch (message.command) {
			case 'JOIN': // Received M1
				handleJoin(client, message);
				break;
			case 'MESG': // Received M2

				handleMessage(client, message);
				break;
			default:
				break;
		}

	});

	ws.on('close', function close() {
	})
});


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
