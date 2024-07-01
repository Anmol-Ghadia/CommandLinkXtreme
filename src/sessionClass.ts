import { log } from "./logger";
import { Client, singlePayloadR3 } from "./states";


// Is the aggregation of all sessions on the server
//    only works with session class which is one level below
export class AllSessions {
    private unInitializedClients: Client[];
    private clientSessionPairs: [Client,Session][];

    constructor() {
        this.unInitializedClients = [];
        this.clientSessionPairs = [];
    }

    // adds a new client to unInitialized list
    addClient(newClient:Client) {
        this.unInitializedClients.push(newClient);
    }
    
    // REQUIRES message is well formed
    // upgrades client from unInitialized list initialized
    // returns true if not succesfull
    promoteClient(clientToPromote:Client,message:message1): boolean {
        clientToPromote.initialize(message.alias,message.key);
        let newList:Client[] = [];
        for (let index = 0; index < this.unInitializedClients.length; index++) {
            const unInitializedClient = this.unInitializedClients[index];
            if (unInitializedClient.getClientId() != clientToPromote.getClientId()) {
                newList.push(unInitializedClient);
            }
        }
        this.unInitializedClients = newList;
        const session = this.getSession(message.sessionId);
        if (!session.addClient(clientToPromote)) return false;
        this.clientSessionPairs.push([clientToPromote,session]);
        return true;
    }

    // gets the session if exists else creates new one
    getSession(sessionId: number): Session {
        for (let index = 0; index < this.clientSessionPairs.length; index++) {
            const pair = this.clientSessionPairs[index];   
            if (pair[1].getSessionId() == sessionId) {
                log(1,'ALL-SESSION',`request to join old session ${sessionId}`);
                return pair[1];
            }
        }
        log(1,'ALL-SESSION',`request to join new session ${sessionId}`);
        return new Session(sessionId);
    }

    getClientsSession(client:Client) : Session | null {
        for (let index = 0; index < this.clientSessionPairs.length; index++) {
            const pair = this.clientSessionPairs[index];
            if (pair[0].getClientId() == client.getClientId()) {
                return pair[1];
            }
        }
        return null;
    }

    removeClient(client: Client) {
        let out: Client[] = [];
        let foundClient = false;
        for (let index = 0; index < this.unInitializedClients.length; index++) {
            const currentClient = this.unInitializedClients[index];
            if (client.getClientId() == currentClient.getClientId()) {
                foundClient = true;
                continue;
            }
            out.push(currentClient);
        }
        this.unInitializedClients = out;
        if (foundClient) return;
        // Client is part of a session
        let session = this.getClientsSession(client);
        if (session == null) {
            log(1,'ALL-SESSION',`client: ${client.getAlias()}(${client.getClientId()}) not found in any list`);
            return;
        }
        session.removeClient(client);
    }
}


// Represents a single session with all clients
export class Session {

    protected sessionId:number;
    protected clients: Client[];

    constructor(sessionId:number) {
        this.sessionId = sessionId;
        this.clients = [];
    }

    // returns true if the addition succeded
    addClient(newClient: Client): boolean {
        if (this.clients.length == 0) {
            if (!newClient.sendR1()) return false;
        } else if (this.clients.length == 1) { 
            // Send the other client R4
            // Send this client R3
            if (!this.clients[0].sendR4(newClient.getAlias(),newClient.getPublicKey())) return false;
            if (!newClient.sendR3(this.generateR3Payload())) return false;
        } else {
            // Send R6 to all clients
            // Send R3 to this client
            if (!this.sendR6JoinToAll(newClient.getAlias(),newClient.getPublicKey())) return false;
            if (!newClient.sendR3(this.generateR3Payload())) return false;
        }
        this.clients.push(newClient);
        log(1,'SESSION',`added new client:${newClient.getAlias()}(${newClient.getClientId()}) to session: ${this.sessionId}`);
        return true;
    }

    // forwards the message from a client "senderCient" to appropriate clients
    forwardMessage(senderCient:Client,message:message2) {
        // check that message2 has correct payload for each client
        log(1,'TEMPORARY',`message.payload.length = ${message.payload.length}`)
        log(1,'TEMPORARY',`this.clients.length = ${this.clients.length}`)
        if (message.payload.length != this.clients.length-1) {
            log(1,'SESSION',`received malformed MESG (ERR:1) from ${senderCient.getAlias()}(${senderCient.getClientId()})`);
            return;
        }
        for (let index = 0; index < this.clients.length; index++) {
            const client = this.clients[index];
            if (client.getClientId() == senderCient.getClientId()) {
                continue; // do nothing for the sender client
            }
            let alias = client.getAlias();
            let didClientGetR5 = false;
            for (let index = 0; index < message.payload.length; index++) {
                const subMessage = message.payload[index];
                if (alias == subMessage.alias) {
                    client.sendR5(senderCient.getAlias(),subMessage.message);
                    didClientGetR5 = true
                }
            }
            if (!didClientGetR5) {
                log(1,'SESSION',`received malformed MESG (ERR:2) from ${senderCient.getAlias()}(${senderCient.getClientId()})`)
            }
        }
    }

    removeClient(clientToRemove: Client) {
        let out:Client[] = [];
        for (let index = 0; index < this.clients.length; index++) {
            const currentClient = this.clients[index];
            if (currentClient.getClientId() == clientToRemove.getClientId()) {
                // found the client to remove
                // do nothing
                continue;
            }
            currentClient.sendR6leave(clientToRemove.getAlias());
            out.push(currentClient);
        }
        this.clients = out;
    }

    getClientCount() : number {
        return this.clients.length;
    }

    private generateR3Payload():singlePayloadR3[] {
        let payload: singlePayloadR3[]=[];
        this.clients.forEach((client)=>{
            payload.push({
                alias: client.getAlias(),
                key: client.getPublicKey()
            })
        })
        return payload;
    }

    // send R6 to all existing clients that new user joined
    private sendR6JoinToAll(alias:string,publicKey:string):boolean {
        for (let index = 0; index < this.clients.length; index++) {
            const client = this.clients[index];
            if (!client.sendR6join(alias,publicKey) ) {
                log(1,'SESSION',`unable to send R6 to all clients in session: ${this.sessionId}`);
                return false;
            }
        }
        return true;
    }

    getSessionId():number {
        return this.sessionId;
    }
}


export type message1 = {
    command: string,
    sessionId: number,
    key: string,
    alias: string
}

export function isMessage1(obj: any): obj is message1 {
    
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.command === 'string' &&
        typeof obj.sessionId === 'number' &&
        typeof obj.key === 'string' &&
        typeof obj.alias === 'string'
    );
}


export type message2SinglePayload = {
    alias: string,
    message: string
}

export type message2 = {
    command: string,
    payload: message2SinglePayload[]
}

export function isMessage2(obj: any): obj is message2 {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.command === 'string' &&
        Array.isArray(obj.payload) &&
        obj.payload.every((item: any) =>
            typeof item === 'object' &&
            item !== null &&
            typeof item.alias === 'string' &&
            typeof item.message === 'string'
        )
    );
}
