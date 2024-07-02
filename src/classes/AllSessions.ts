import { log } from "../logger";
import { Client } from "./Client";
import { Session } from "./Session";
import { message1 } from "./Protocol";


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

    // returns a unique session id
    getUniqueSessionId(): number {
        let maxAttempts = 10;
        let count = 0
        while (maxAttempts > count) {
            let random = Math.floor(Math.random()*1_000_000_000);
            if (random < 99_999_999) continue;
            if (!this.sessionIdExits(random)) {
                return random;
            }
            count++;
        }
        log(0,'ALL-SESSIONS',`unable to find a unique id with ${maxAttempts}`)
        return 0;
    }


    sessionIdExits(checkId:number):boolean {
        for (let index = 0; index < this.clientSessionPairs.length; index++) {
            const pair = this.clientSessionPairs[index];
            if (pair[1].getSessionId() == checkId) {
                return true;       
            }
        }
        return false;
    }
}
