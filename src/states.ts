import WebSocket from "ws";
import {log} from './logger';

// represents a clients state
export class Client {
    private currentState: 1 | 2 | 3 | 4 | 5;
    private ws: WebSocket;
    private clientId: number;
    private alias: string = '';
    private publicKey: string = '';
    public static nextClientId = 1; 

    // generates a unique clientID and other params
    constructor(ws:WebSocket) {
        this.currentState = 1
        this.ws = ws
        this.clientId = Client.nextClientId;
        Client.nextClientId++;
    }

    initialize(alias:string, publicKey: string) {
        this.alias = alias;
        this.publicKey = publicKey;
        this.updateState(2);
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

    getWS() {
        return this.ws;
    }

    sendR1(): boolean {
        if (this.currentState != 2) {
            log(1,'CLIENT',`failed to send R1 due to state of (${this.clientId}) being (${this.currentState})`);
            return false;
        }
        const message = {
            command: 'A-JN',
        }
        this.ws.send(JSON.stringify(message));
        this.updateState(3);
        log(2,'CLIENT',`succeded in sending R1 for (${this.clientId})`);
        return true;
    }

    sendR2(error: string): boolean {
        if (this.currentState != 2) {
            log(1,'CLIENT',`failed to send R2 due to state of (${this.clientId}) being (${this.currentState})`);
            return false;
        }
        const message = {
            command: 'F-JN',
            message: error
        }
        this.ws.send(JSON.stringify(message));
        this.updateState(1);
        log(2,'CLIENT',`succeded in sending R2 for (${this.clientId})`);
        return true;
    }

    sendR3(payload: singlePayloadR3[]):boolean {
        if (this.currentState != 2) {
            log(1,'CLIENT',`failed to send R3 due to state of (${this.clientId}) being (${this.currentState})`);
            return false;
        }
        const message = {
            command: 'E-JN',
            payload: payload
        }
        this.ws.send(JSON.stringify(message));
        this.updateState(4);
        log(2,'CLIENT',`succeded in sending R3 for (${this.clientId})`);
        return true;
    }

    sendR4(alias: string, publicKey:string):boolean {
        if (this.currentState != 3) {
            log(1,'CLIENT',`failed to send R4 due to state of (${this.clientId}) being (${this.currentState})`);
            return false;
        }
        const message = {
            command: 'JOIN',
            alias: alias,
            key: publicKey
        }
        this.ws.send(JSON.stringify(message));
        this.updateState(4);
        log(2,'CLIENT',`succeded in sending R4 for (${this.clientId})`);
        return true;
    }

    sendR5(alias: string, messageEncrypted:string):boolean {
        if (this.currentState != 4) {
            log(1,'CLIENT',`failed to send R5 due to state of (${this.clientId}) being (${this.currentState})`);
            return false;
        }
        const message = {
            command: 'MESG',
            from: alias,
            message: messageEncrypted
        }
        this.ws.send(JSON.stringify(message));
        this.updateState(4);
        log(2,'CLIENT',`succeded in sending R5 for (${this.clientId})`);
        return true;
    }

    sendR6join(alias: string, publicKey:string):boolean {
        if (this.currentState != 4) {
            log(1,'CLIENT',`failed to send R6J due to state of (${this.clientId}) being (${this.currentState})`);
            return false;
        }
        const message = {
            command: 'JOIN',
            alias: alias,
            key: publicKey
        }
        this.ws.send(JSON.stringify(message));
        this.updateState(5);
        log(2,'CLIENT',`succeded in sending R6J for (${this.clientId})`);
        return true;
    }

    sendR6leave(alias: string):boolean {
        if (this.currentState != 4) {
            log(1,'CLIENT',`failed to send R6L due to state of (${this.clientId}) being (${this.currentState})`);
            return false;
        }
        const message = {
            command: 'LEAV',
            alias: alias
        }
        this.ws.send(JSON.stringify(message));
        this.updateState(5);
        log(2,'CLIENT',`succeded in sending R6L for (${this.clientId})`);
        return true;
    }

    sendError(msgDescription:string) {
        const message = {
            command: 'ERRO',
            message: msgDescription
        }
        this.ws.send(JSON.stringify(message));
        log(2,'CLIENT',`succeded in sending ERROR for (${this.clientId}) in state(${this.currentState}) of: ${msgDescription}`);
    }

    updateState(newState: 1 | 2 | 3 | 4 | 5) {
        log(2,'CLIENT',`changed the state of (${this.clientId}) from (${this.currentState})->(${newState})`);
        this.currentState = newState;
    }
}


export type singlePayloadR3 = {
    alias: string,
    key: string
}
