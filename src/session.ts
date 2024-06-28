import WebSocket from "ws";
// 0 ClientId is always the server

import { time } from "console";
import { BlockList } from "net";

// first number is timestamp
// string is message
// second number is clientId (Sender)
export type message = [number,string,number];

// number is clientId, and the websocket is the
//     connection to that client
export type clientSocketPair = [number, WebSocket];

const AliasIdMap = new Map<number,string>();
const clientSessionMap = new Map<number,number>();


// Represents a single session with all clients 
//     and their messages with corresponding offset times
//     from starting
export class SessionClass {

    protected sessionId:number;
    protected clients: clientSocketPair[];
    protected startTime: number;

    constructor(sessionId:number) {
        this.sessionId = sessionId;
        this.clients = [];
        this.startTime = Date.now();
    }

    addClient(clientId:number,ws:WebSocket) {
        this.clients.forEach((ele)=>{
            ele[1].send(`${AliasIdMap.get(clientId)} has joined the chat`)
        })
        this.clients.push([clientId,ws]);
    }

    // Notifies all clients of the new message and stores it 
    insertMesage(msg:string, clientId:number) {
        let time = this.getOffsetTime()

        let messageWrapper = {
            time: time,
            message: msg,
            name: AliasIdMap.get(clientId)
        };
        for (let index = 0; index < this.clients.length; index++) {
            const clientSocketElement = this.clients[index];
            if (clientSocketElement[0] != clientId) {
                clientSocketElement[1].send(JSON.stringify(messageWrapper));
            }
        }
    }

    // Notifies all clients of session notifications
    notifyUser(msg:string) {
        let time = this.getOffsetTime();
        let messageWrapper = {
            time: time,
            message: msg,
            name: "server"
        };
        this.clients.forEach((ele)=>{
            ele[1].send(JSON.stringify(messageWrapper));
        })
    }

    // returns true if the session should be closed
    removeClient(clientId:number): boolean {
        this.clients.filter((ele)=>{
            return (ele[0] != clientId);
        })
        this.clients.forEach((ele)=>{
            ele[1].send(`${AliasIdMap.get(clientId)} has left the chat`)
        })
        if (this.clients.length == 0) {
            return true;
        }
        return false;
    }

    private getOffsetTime(): number {
        return Date.now() - this.startTime;
    }

    getSessionId():number {
        return this.sessionId;
    }
 
}


export class AllSessions {
    protected sessions: SessionClass[];
    protected nextClientId: number;
    constructor() {
        this.sessions = [];
        this.nextClientId = 99;
    }

    createSession(sessionId:number,clientId:number,ws: WebSocket) {
        const newSession = new SessionClass(sessionId);
        this.sessions.push(newSession);

        this.addClient(sessionId,clientId,ws);
    }

    addClient(sessionId: number, clientId:number, ws: WebSocket) {
        let ses = this.getSession(sessionId);
        if (ses != null) {
           ses.addClient(clientId,ws);
           clientSessionMap.set(clientId,sessionId);
        }
    }

    // Returns the session
    getSession(sessionId:number): SessionClass | null {
        for (let index = 0; index < this.sessions.length; index++) {
            const session = this.sessions[index];
            if (session.getSessionId() == sessionId) {
                return session;
            }
        }
        console.log('ERROR: session not found', sessionId);
        return null;
    }

    getClientId(): number {
        return this.nextClientId;
    }

    generateClientId(): number {
        this.nextClientId++;
        return this.nextClientId;
    }

    // Returns true if the session is already created
    hasSession(sessionId:number) {
        return this.getSession(sessionId)!=null;
    }

    getSessionByClientId(clientId:number): number {
        return clientSessionMap.get(clientId) as number;
    }

}


// class AliasIdMap {
//     private map: Map<number,string>;
//     constructor() {
//         this.map = new Map();
//     }

//     addClient(clientId:number, alias: string) {
//         this.map.set(clientId,alias);
//     }

//     getAlias(clientId:number) {
//         return this.map.get(clientId);
//     }
// }



// class clientSocketPair


// let ds = {
//     "sessionId": [
//         clientSocketPair,
//         clientSocketPair
//     ]
//     .
//     .
//     .
// }
