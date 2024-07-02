import { log } from "../logger";
import { Client } from "./Client";
import { message2, singlePayloadR3 } from "./Protocol";

// Represents a single session with all clients
export class Session {

    protected sessionId:number;
    protected clients: Client[];
    protected clientsInS5: Client[];
    protected aliasBeingAck: string;

    constructor(sessionId:number) {
        this.sessionId = sessionId;
        this.clients = [];
        this.clientsInS5 = [];
        this.aliasBeingAck = '';
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
        // TODO !!!
        // Check that all clients except 'senderClient' were sent a message otherwise raise error
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
        this.aliasBeingAck = clientToRemove.getAlias();
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
        this.aliasBeingAck = alias;
        for (let index = 0; index < this.clients.length; index++) {
            const client = this.clients[index];
            if (!client.sendR6join(alias,publicKey) ) {
                log(1,'SESSION',`unable to send R6 to all clients in session: ${this.sessionId}`);
                return false;
            }
            this.clientsInS5.push(client);
        }
        return true;
    }

    // removes a client from S5
    removeClientFromS5(client:Client) {
        let out:Client[] = [];
        for (let index = 0; index < this.clientsInS5.length; index++) {
            const currentClient = this.clientsInS5[index];
            if (currentClient.getClientId() == client.getClientId()) {
                // found the client to remove
                // do nothing
                continue;
            }
            out.push(currentClient);
        }
        this.clientsInS5 = out;
        client.updateState(4);
    }

    checkClientAck(alias:string):boolean {
        if (this.aliasBeingAck == alias) {
            return true;
        }
        return false;
    }

    getSessionId():number {
        return this.sessionId;
    }
}
