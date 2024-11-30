import { log } from "../helpers/logger";
import { Client } from "./Client";
import { message2, singlePayloadR3 } from "./Protocol";

// Represents a single session with all clients
export class Session {

    protected sessionId: number;
    protected clients: Client[];
    protected clientsInS5: Client[];
    protected aliasBeingAck: string;

    constructor(sessionId: number) {
        this.sessionId = sessionId;
        this.clients = [];
        this.clientsInS5 = [];
        this.aliasBeingAck = '';
    }


    // Send appropriate RX messages to each client 
    //   according to the state of other
    //   clients in this session
    // returns true if the addition succeded
    addClient(newClient: Client): boolean {
        let alias = newClient.getAlias();
        let publicKey = newClient.getPublicKey();
        
        if (this.clients.length == 0) { // Add user in a waiting state (S3)
            if (!newClient.sendR1()) return false;

        } else if (this.clients.length == 1) { // Add user in Established state (S4)
            // Send R3 to this client and R4 to the other
            if (!this.clients[0].sendR4(alias, publicKey)) return false;
            if (!newClient.sendR3(this.generateR3Payload())) return false;
        
        } else { // Add user in Established state (s4)
            // Send R3 to this client and R6 to all other
            if (!this.sendR6JoinToAll(alias, publicKey)) return false;
            if (!newClient.sendR3(this.generateR3Payload())) return false;
        }
        this.clients.push(newClient);
        log(2, 'SESSION', `added new client:${alias}(${newClient.getClientId()}) to session: ${this.sessionId}`);
        return true;
    }

    // forwards the message from a client "senderCient" to appropriate clients
    forwardMessage(senderCient: Client, message: message2) {
        
        // check that message2 has correct payload for each client, in length
        if (message.payload.length != this.clients.length - 1) {
            log(1, 'SESSION', `received malformed MESG (ERR:1) from ${senderCient.getAlias()}(${senderCient.getClientId()})`);
            senderCient.sendError('bad request (ID:Session100)');
            return;
        }

        // Check that all clients except 'senderClient' were addressed in the message otherwise raise error
        let count = 0;
        for (let index = 0; index < this.clients.length; index++) {
            const client = this.clients[index];
            if (client.getClientId() == senderCient.getClientId()) {
                continue; // do nothing for the sender client
            }
            for (let index = 0; index < message.payload.length; index++) {
                const subMessage = message.payload[index];
                if (client.getAlias() == subMessage.alias) {
                    count++;
                }
            }
        }
        if (count != this.clients.length - 1) {
            log(1, 'SESSION', `received malformed MESG (ERR:2) from ${senderCient.getAlias()}(${senderCient.getClientId()})`);
            senderCient.sendError('bad request (ID:Session101)');
            return;
        }
        
        // Forward the appropriate messages
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
                    client.sendR5(senderCient.getAlias(), subMessage.message);
                    didClientGetR5 = true;
                }
            }
            if (!didClientGetR5) {
                senderCient.sendError('internal error (ID:Session102)');
            }
        }
    }

    // removes the client from this session
    removeClient(clientToRemove: Client) {
        let out: Client[] = [];
        this.aliasBeingAck = clientToRemove.getAlias();
        for (let index = 0; index < this.clients.length; index++) {
            const currentClient = this.clients[index];
            if (currentClient.getClientId() == clientToRemove.getClientId()) {
                // found the client to remove, do nothing
                continue;
            }
            currentClient.sendR6leave(clientToRemove.getAlias());
            out.push(currentClient);
        }
        this.clients = out;
    }
    
    // Helper to generate R3 message body
    private generateR3Payload(): singlePayloadR3[] {
        let payload: singlePayloadR3[] = [];
        this.clients.forEach((client) => {
            payload.push({
                alias: client.getAlias(),
                key: client.getPublicKey()
            })
        })
        return payload;
    }

    // Helper, sends join message (R6) to all users
    // returns true if success
    private sendR6JoinToAll(alias: string, publicKey: string): boolean {
        this.aliasBeingAck = alias;
        for (let index = 0; index < this.clients.length; index++) {
            const client = this.clients[index];
            if (!client.sendR6join(alias, publicKey)) {
                log(1, 'SESSION', `unable to send R6 to all clients in session: ${this.sessionId}`);
                return false;
            }
            this.clientsInS5.push(client);
        }
        return true;
    }

    // removes a client from S5
    removeClientFromS5(client: Client) {
        let out: Client[] = [];
        for (let index = 0; index < this.clientsInS5.length; index++) {
            const currentClient = this.clientsInS5[index];
            if (currentClient.getClientId() == client.getClientId()) {
                // found the client to remove, do nothing
                continue;
            }
            out.push(currentClient);
        }
        this.clientsInS5 = out;
        client.updateState(4);
    }

    // returns true if the alias matched the alias that needs to be acked
    checkClientAck(alias: string): boolean {
        if (this.aliasBeingAck == alias) {
            return true;
        }
        return false;
    }

    // returns true if the alias is already in use inside this session
    containsAlias(alias: string): boolean {
        for (let index = 0; index < this.clients.length; index++) {
            if (this.clients[index].getAlias() == alias) return true;
        }
        return false;
    }

    getSessionId(): number {
        return this.sessionId;
    }

    getClientCount(): number {
        return this.clients.length;
    }
}
