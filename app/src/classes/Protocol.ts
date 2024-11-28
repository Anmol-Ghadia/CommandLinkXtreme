// Reading the documentation on this protocol in the project readme
//  is the best way to understand this file.

// This file provides types and corresponding functions to check
//  the type of the object 

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

export type message2 = {
    command: string,
    payload: message2SinglePayload[]
}

export type message2SinglePayload = {
    alias: string,
    message: any
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
            typeof item.message !== 'undefined'
        )
    );
}

export type message3 = {
    command: string,
    alias: string,
}

export type singlePayloadR3 = {
    alias: string,
    key: string
}

export function isMessage3(obj: any): obj is message3 {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.command === 'string' &&
        typeof obj.alias === 'string'
    );
}
