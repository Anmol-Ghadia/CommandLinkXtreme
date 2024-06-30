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
            // if (!newClient.sendR3(this.generateR3Payload())) return false;
            // if (!this.sendR6ToAll(newClient.getPublicKey(),newClient.getAlias())) return false;
        }
        this.clients.push(newClient);
        log(1,'SESSION',`added new client:${newClient.getAlias()}(${newClient.getClientId()}) to session: ${this.sessionId}`);
        return true;
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

    private sendR6ToAll(publicKey:string,alias:string):boolean {
        // TODO !!!
        return false;
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
