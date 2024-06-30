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

    sendR2(error: string): boolean {
        if (this.currentState != 2) {
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

    sendR3(payload: singlePayloadR3[]):boolean {
        if (this.currentState != 2) {
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

    sendR4(alias: string, publicKey:string):boolean {
        if (this.currentState != 3) {
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

    sendR5(alias: string, messageEncrypted:string):boolean {
        if (this.currentState != 4) {
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

    sendR6join(alias: string, publicKey:string):boolean {
        if (this.currentState != 4) {
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

    sendR6leave(alias: string):boolean {
        if (this.currentState != 4) {
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

    private failureLog(messageCode:1|2|3|4|5|6|6.5) {
        log(1,'CLIENT',`failed send R${messageCode.toString} of ${this.alias}(${this.getClientId}) due to state=(${this.currentState})`);
    }

    private sendSuccesLog(messageCode:1|2|3|4|5|6|6.5) {
        log(2,'CLIENT',`sent R${messageCode} to ${this.alias}(${this.clientId})`)
    }
}


export type singlePayloadR3 = {
    alias: string,
    key: string
}
