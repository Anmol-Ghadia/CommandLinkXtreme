import WebSocket from "ws";
import { WebSocketServer } from 'ws';
import { log } from './helpers/logger';
import { Client } from "./classes/Client";
import { AllSessions } from "./classes/AllSessions";
import { isMessage1, isMessage2, isMessage3 } from "./classes/Protocol";
import dotenv from 'dotenv';
dotenv.config();

let WSPort = 8080;
if (typeof process.env.WS_SERVER_PORT != 'undefined') {
	WSPort = parseInt(process.env.WS_SERVER_PORT);
}
const WSLink = `ws://localhost:${WSPort}`;

let ALLSESSIONS: AllSessions;
const webSocketServer = new WebSocketServer({ port: WSPort }, () => {
	log(0, 'SERVER', `WebSocket Server Live on ${WSLink}`);
	ALLSESSIONS = new AllSessions();
});


webSocketServer.on('upgrade', () => {
	log(2, 'CLIENT', `new request to upgrade connection`);
})

webSocketServer.on('connection', function connection(ws: WebSocket) {

	let client = new Client(ws);
	ALLSESSIONS.addClient(client);

	log(2, 'CLIENT', `new client joined with client id: ${client.getClientId()}`);

	ws.on('error', (err) => {
		log(1, 'CLIENT', `encountered error with WebSocket of client id: ${client.getClientId()}`);
		log(1, 'CLIENT', `${err}`);
		handleClientExit(client);
		console.error(err);
	});

	ws.on('message', (rawData) => {
		const message = JSON.parse(rawData.toString());
		log(2, 'MESSAGE', `received command ${message.command} from ${client.getClientId()}`);
		handleClientMessage(client, message);

	});

	ws.on('close', () => {
		handleClientExit(client);
	})
});

// makes all sessions object accessible across modules
export function getAllSessions() {
	return ALLSESSIONS;
}

export function getWSServerLink(): string {
	return WSLink;
}

// interprets the message received by client according to protocol
function handleClientMessage(senderClient: Client, message: any) {
	if (typeof message !== 'object' ||
		message == null ||
		typeof message.command != 'string') {
		log(1, 'CLIENT', `recevied malformed message, either no message or no command exists for ${senderClient.getAlias()}(${senderClient.getClientId()})`)
		senderClient.sendError('bad request (ID:Socket99)')
		return;
	}
	switch (message.command) {
		case 'JOIN': // Received M1
			handleJoin(senderClient, message);
			break;
		case 'MESG': // Received M2
			handleMessage(senderClient, message);
			break;
		case 'A-JN': // Received M3 Join ack
			handleAcknowledgeJoin(senderClient, message);
			break;
		case 'A-LV': // Received M3 Leave ack
			handleAcknowledgeLeave(senderClient, message);
			break;
		case 'A-AL': // Received M4 ack leave and all alone
			handleAllAlone(senderClient);
			break;
		case 'EXIT': // Received EXIT
			handleClientExit(senderClient);
			break;
		default:
			log(1, 'CLIENT', `client: ${senderClient.getAlias()}(${senderClient.getClientId()}) sent "${message.command}", an invalid command`);
			break;
	}
}

// adds the client to a session,
// if message1 is valid
function handleJoin(senderClient: Client, message: any) {

	// check the format of message
	if (!isMessage1(message)) {
		log(1, 'CLIENT', `failed to parse M1 from client ${senderClient.getAlias()}(${senderClient.getClientId()})`);
		senderClient.sendError('bad request (ID:Socket100)');
		return;
	}

	// check that the chosen alias can be added
	if (ALLSESSIONS.clientAliasExists(message.sessionId, message.alias)) {
		log(1, 'CLIENT', `chosen alias exists for client ${senderClient.getAlias()}(${senderClient.getClientId()}) in session: ${message.sessionId}`);
		senderClient.sendError('alias not available (ID:Socket101)');
		return;
	}

	// add the client to the requested session
	if (!ALLSESSIONS.promoteClient(senderClient, message)) {
		log(1, 'ERROR', `in upgrading client:${senderClient.getAlias()}(${senderClient.getClientId()})`);
		senderClient.sendError('internal error (ID:Socket102)');
	}

	// success in adding the client to section
	log(2, 'CLIENT', `received command:${message.command} from Client:${senderClient.getAlias()}(${senderClient.getClientId()})`);
}

// forwards the message to other clients if message2 is valid
function handleMessage(senderClient: Client, message: any) {

	// get client's session
	let session = ALLSESSIONS.getClientsSession(senderClient);
	if (session == null) {
		log(1, 'CLIENT', `could not find session of client:${senderClient.getAlias()}(${senderClient.getClientId()})`);
		senderClient.sendError('internal error (ID:Socket103)');
		return;
	}

	// check that the format of message is correct
	if (!isMessage2(message)) {
		log(1, 'CLIENT', `failed to parse M2 from ${senderClient.getAlias()}(${senderClient.getClientId()})`);
		senderClient.sendError('bad request (ID:Socket104)');
		return;
	}

	// forward the message to other clients in the session
	session.forwardMessage(senderClient, message);
	log(2, 'CLIENT', `forwarding MESG from ${senderClient.getAlias()}(${senderClient.getClientId()})`);
}

// checks that the joining alias is properly acknowledged
function handleAcknowledgeJoin(senderClient: Client, message: any) {

	// get client's session
	const session = ALLSESSIONS.getClientsSession(senderClient);
	if (session === null) {
		log(1, 'CLIENT', `session not found for client ${senderClient.getClientId()}  (678)`);
		senderClient.sendError('intrnal error (ID:Socket105)');
		return;
	}

	// check alias being acked is correct
	if (!session.checkClientAck(message.alias)) {
		log(1, 'CLIENT', `received incorrect alias with A-JN  ${senderClient.getAlias()}(${senderClient.getClientId()})`);
		senderClient.sendError('bad request (ID:Socket106)');
		return;
	}

	// check that this client was supposed to ack
	if (senderClient.getCurrentState() != 5) {
		log(1, 'CLIENT', `client not in state 5 ${senderClient.getAlias()}(${senderClient.getClientId()})`);
		senderClient.sendError('bad request (ID:Socket107)');
		return;
	}

	// remove this client from the list of clients who are yet to ack
	session.removeClientFromS5(senderClient);
	log(2, 'CLIENT', `received A-JN from ${senderClient.getAlias()}(${senderClient.getClientId()})`);
}

// checks that the leaving alias is properly acknowledged
function handleAcknowledgeLeave(senderClient: Client, message: any) {

	// get client's session
	const session = ALLSESSIONS.getClientsSession(senderClient);
	if (session === null) {
		log(1, 'CLIENT', `session not found for client ${senderClient.getClientId()}  (234)`);
		senderClient.sendError('intrnal error (ID:Socket108)');
		return;
	}

	// check the message is in correct format
	if (!isMessage3(message)) {
		log(1, 'MESSAGE', `malformed M3 sent by client: ${senderClient.getAlias()}(${senderClient.getClientId()})`);
		senderClient.sendError('bad request (ID:Socket109)');
		return;
	}


	// check that this client was supposed to ack
	if (!session.checkClientAck(message.alias)) {
		log(1, 'SESSION', `received unexpected alias ${senderClient.getAlias()}(${senderClient.getClientId()})`);
		senderClient.sendError('bad request (ID:Socket110)');
		return;
	}

	session.removeClientFromS5(senderClient);
	log(2, 'CLIENT', `received A-LV from ${senderClient.getAlias()}(${senderClient.getClientId()})`);
}

// verify if the all alone ack is appropriate and upadte client's state 
function handleAllAlone(senderClient: Client) {

	// get client's session
	const session = ALLSESSIONS.getClientsSession(senderClient);
	if (session === null) {
		log(1, 'CLIENT', `session not found for client ${senderClient.getClientId()}  (234)`);
		senderClient.sendError('intrnal error (ID:Socket111)');
		return;
	}

	// check the client is alone
	if (session.getClientCount() != 1) {
		log(1, 'SESSION', `unexpected A-AL command from client:${senderClient.getClientId()}`);
		senderClient.sendError('bad request (ID:Socket112)');
		return;
	}

	// update clients state: to be alone :(
	log(1, 'SESSION', `Assuming that client:${senderClient.getClientId()} sent A-AL`);
	senderClient.updateState(3);
}

// handles the client exit such that all references are cleared
function handleClientExit(exitingClient: Client) {
	ALLSESSIONS.removeClient(exitingClient);
}


