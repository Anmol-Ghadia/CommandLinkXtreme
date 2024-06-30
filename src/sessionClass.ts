import { log } from "console";
import { Client, singlePayloadR3 } from "./states";
import { BlobOptions } from "buffer";

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
    promoteClient(clientToPromote:Client,message:message1) {
        let newList:Client[] = [];
        for (let index = 0; index < this.unInitializedClients.length; index++) {
            const unInitializedClient = this.unInitializedClients[index];
            if (unInitializedClient.getClientId() != clientToPromote.getClientId()) {
                newList.push(unInitializedClient);
            }
        }
        this.unInitializedClients = newList;
        const session = this.getSession(message.sessionID);
        session.addClient(clientToPromote);
        this.clientSessionPairs.push([clientToPromote,session]);
    }

    // gets the session if exists else creates new one
    getSession(sessionId: number): Session {
        this.clientSessionPairs.forEach((pair)=>{
            if (pair[1].getSessionId() == sessionId) {
                return pair[1];
            }
        })
        return new Session(sessionId);
    }

}


// Represents a single session with all clients 
//     and their messages with corresponding offset times
//     from starting
export class Session {

    protected sessionId:number;
    protected clients: Client[];

    constructor(sessionId:number) {
        this.sessionId = sessionId;
        this.clients = [];
    }

    addClient(newClient: Client) {
        newClient.updateState(2);
        if (this.clients.length == 0) {
            newClient.sendR1();
        } else {
            newClient.sendR3(this.generateR3Payload());
            this.sendR6ToAll(newClient.getPublicKey(),newClient.getAlias());
        }
        this.clients.push(newClient);
        log(1,'SESSION',`added new client (${newClient.getClientId()}) to session: ${this.sessionId}`);
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

    private sendR6ToAll(publicKey:string,alias:string) {
        // TODO !!!
    }

    getSessionId():number {
        return this.sessionId;
    }
 
}


export type message1 = {
    command: string,
    sessionID: number,
    key: string,
    alias: string
}

export function isMessage1(obj: any): obj is message1 {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.command === 'string' &&
        typeof obj.sessionID === 'number' &&
        typeof obj.key === 'string' &&
        typeof obj.alias === 'string'
    );
}
