import WebSocket from "ws";
import { log } from '../helpers/logger';
import { singlePayloadR3 } from "./Protocol";

// represents a single client
// handle all interactions with client thorugh this class
export class Client {
    private currentState: 1 | 2 | 3 | 4 | 5 = 1;
    private ws: WebSocket;
    private clientId: number;
    private alias: string = '';
    private publicKey: string = '';
    public static nextClientId = 100;

    // generates a unique clientID and other params
    constructor(ws: WebSocket) {
        this.ws = ws
        this.clientId = Client.nextClientId;
        Client.nextClientId++;
    }

    // initializes a client with alias an public key
    // this is called once the ws connection is established
    initialize(alias: string, publicKey: string) {
        this.alias = alias;
        this.publicKey = publicKey;
        this.updateState(2);
    }

    // sends a success message for join
    sendR1(): boolean {
        if (this.getCurrentState() != 2) {
            this.failureLog(1);
            return false;
        }
        const message = {
            command: 'A-JN',
        }
        this.ws.send(JSON.stringify(message));
        this.updateState(3);

        this.sendSuccesLog(1);
        return true;
    }

    // sends a failure message for join
    sendR2(error: string): boolean {
        if (this.getCurrentState() != 2) {
            this.failureLog(2);
            return false;
        }
        const message = {
            command: 'F-JN',
            message: error
        }
        this.ws.send(JSON.stringify(message));
        this.updateState(1);
        this.sendSuccesLog(2);
        return true;
    }

    // sends a success message for join
    //  along with information about other clients
    sendR3(payload: singlePayloadR3[]): boolean {
        if (this.getCurrentState() != 2) {
            this.failureLog(3);
            return false;
        }
        const message = {
            command: 'E-JN',
            payload: payload
        }
        this.ws.send(JSON.stringify(message));
        this.updateState(4);
        this.sendSuccesLog(3);
        return true;
    }

    // sends a message that new user has joined the chat
    sendR4(alias: string, publicKey: string): boolean {
        if (this.getCurrentState() != 3) {
            this.failureLog(4);
            return false;
        }
        const message = {
            command: 'JOIN',
            alias: alias,
            key: publicKey
        }
        this.ws.send(JSON.stringify(message));
        this.updateState(4);
        this.sendSuccesLog(4);
        return true;
    }

    // sends a encrypted message to the client
    sendR5(alias: string, messageEncrypted: string): boolean {
        if (this.getCurrentState() != 4) {
            this.failureLog(5);
            return false;
        }
        const message = {
            command: 'MESG',
            from: alias,
            message: messageEncrypted
        }
        this.ws.send(JSON.stringify(message));
        this.updateState(4);
        this.sendSuccesLog(5);
        return true;
    }

    // sends a message that new client has joined the chat
    //   now users in session >= 3
    sendR6join(alias: string, publicKey: string): boolean {
        if (this.getCurrentState() != 4) {
            this.failureLog(6);
            return false;
        }
        const message = {
            command: 'JOIN',
            alias: alias,
            key: publicKey
        }
        this.ws.send(JSON.stringify(message));
        this.updateState(5);
        this.sendSuccesLog(6);
        return true;
    }

    // sends a message that a client left the session
    sendR6leave(alias: string): boolean {
        if (this.getCurrentState() != 4) {
            this.failureLog(6.5);
            return false;
        }
        const message = {
            command: 'LEAV',
            alias: alias
        }
        this.ws.send(JSON.stringify(message));
        this.updateState(5);
        this.sendSuccesLog(6.5);
        return true;
    }

    // sends an error along with message
    //  either bad request or server error
    sendError(msgDescription: string) {
        const message = {
            command: 'ERRO',
            message: msgDescription
        }
        this.ws.send(JSON.stringify(message));
        log(2, 'CLIENT', `succeded in sending ERROR for (${this.clientId}) in state(${this.getCurrentState()}) of: ${msgDescription}`);
    }

    // updates the state of the this client
    updateState(newState: 1 | 2 | 3 | 4 | 5) {
        log(2, 'CLIENT', `changed the state of ${this.alias}(${this.clientId}) from (${this.getCurrentState()})->(${newState})`);
        this.currentState = newState;
    }

    // logs the failure in sending a specific message type
    private failureLog(messageCode: 1 | 2 | 3 | 4 | 5 | 6 | 6.5) {
        log(1, 'CLIENT', `failed send R${messageCode.toString()} of ${this.alias}(${this.getClientId()}) due to state=(${this.getCurrentState()})`);
    }

    // logs the success in sending a specific message type
    private sendSuccesLog(messageCode: 1 | 2 | 3 | 4 | 5 | 6 | 6.5) {
        log(2, 'CLIENT', `sent R${messageCode} to ${this.alias}(${this.clientId})`)
    }

    getClientId() {
        return this.clientId;
    }

    getPublicKey() {
        return this.publicKey;
    }

    getCurrentState() {
        return this.currentState;
    }

    getAlias() {
        return this.alias;
    }
}
