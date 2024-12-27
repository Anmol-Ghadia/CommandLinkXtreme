// const { clear } = require("console");

const wsLink = 'ws://localhost/ws/';
let socket;

let CURRENTSTATE = 0;
// contains pairs of [alias,key];
let SESSION_CLIENTS = []; // Excluding self
let ALIAS = '';
let PUBLICKEY = '';
let PRIVATEKEY = '';
let LASTMESSAGETIME = 0;
let LASTMESSAGEBY = ''; // store alias here
let CONTINUENEXTMESSAGE = false;
let SESSIONID = 0;
let DEBUG = false; // Set to true to see debug messages


connectWS();

function computeTextAreaHeight() {
    const field = document.getElementById('input-text-area');
    field.style.height = 'auto';
    field.style.height = `${field.scrollHeight}px`;
}

function clearTextArea() {
    document.getElementById('input-text-area').value = '';
    computeTextAreaHeight();
}

document.addEventListener('DOMContentLoaded', () => {
    const textArea = document.getElementById('input-text-area');

    textArea.addEventListener("keydown", function() {
        computeTextAreaHeight();
    });
    textArea.addEventListener("keyup", function() {
        computeTextAreaHeight();
    });
});

function connectWS() {
    if (DEBUG) console.log(`WS connected at: ${wsLink}`);
    socket = new WebSocket(wsLink);
    CURRENTSTATE = 1;

    // WebSocket event listeners
    socket.addEventListener('open', async function (event) {
        if (DEBUG) console.log('WebSocket connection established.');
        
        await sendM1(socket);
        CURRENTSTATE = 2;
    });

    socket.addEventListener('message',async function (event) {
        let message = JSON.parse(event.data);
        if (DEBUG) console.log('Message from server:', message);
        let command = message.command;
        switch (CURRENTSTATE) {
            case 2:
                if (command != 'A-JN' && command != 'F-JN' && command != 'E-JN') {
                    console.log('unexpected response from the server (102)');
                    displayMessage('Server mesbehaving (102)',true, null);
                    return;
                }
                await handleStateChangeFrom2(message);
                break;
            case 3:
                if (command != 'JOIN') {
                    if (DEBUG) console.log('unexpected response from the server (103)');
                    displayMessage('Server mesbehaving (103)',true,null);
                    return;
                }
                await handleStateChangeFrom3(message);
                break;
            case 4:
                if (command != 'MESG' && command != 'LEAV' && command != 'JOIN') {
                    console.log('unexpected response from the server (104)');
                    displayMessage('Server mesbehaving (104)',true,null);
                    return;
                }
                await handleStateChangeFrom4(message);
                break;
            default:
            
                console.log('unexpected or unimplemented command received');
                displayMessage(`unexpected or unimplemented command received`,true,null);
                break;
        }
        updateUserCount()
    });

    socket.addEventListener('close', function (event) {
        if (DEBUG) console.log('received close event from server');
        handleExit();
    });

    socket.addEventListener('error', function (event) {
        console.error('WebSocket encountered an error:', event);
    });

}

function exitPage() {
    handleExit();
    window.location.href = "/";
}

function handleExit() {
    let message = {
        command: 'EXIT'
    }
    socket.send(JSON.stringify(message));

    if (DEBUG) console.log("socket Closed");
    socket.close();
}

function updateUserCount() {
    const clients_online = SESSION_CLIENTS.length + 1;
    document.getElementById('onlineInfo').innerHTML = clients_online;
    if (clients_online > 1) {
        document.getElementById('onlineInfoSignal').dataset.active = '1'
    } else {
        document.getElementById('onlineInfoSignal').dataset.active = '0'
    }
}

async function sendM1(socket) {

    SESSIONID = parseInt(window.localStorage.getItem('sessionId'));
    if (isNaN(SESSIONID) || typeof SESSIONID !== 'number') {
        displayMessage('error in session id',true,null);
        return;
    }
    ALIAS = window.localStorage.getItem('alias');
    if (typeof ALIAS !== 'string') {
        displayMessage('error in alias',true,null);
        return;
    }
    const keyPair = await generateKeyPair();

    PUBLICKEY = JSON.stringify(await exportPublicKey(keyPair.publicKey));
    PRIVATEKEY = keyPair.privateKey;

    let message = {
        command: 'JOIN',
        sessionId: SESSIONID,
        key: PUBLICKEY,
        alias: ALIAS
    }

    socket.send(JSON.stringify(message));
}

async function sendM2() {
    const maxTextLengthForOnePacket = 125;
    if (CURRENTSTATE != 4) {
        displayMessage('Not in state 4, hence cannot send message',true,null);
        return;
    }
    const text = document.getElementById('input-text-area').value
    
    let textLength = text.length;
    let totalLoopCount = Math.floor(textLength / maxTextLengthForOnePacket);
    for (let index = 0; index < totalLoopCount; index++) {
        await sendM2Helper(text.substring(index*125, (index+1)*125) + 'a'); // a acts as a placeholder that increases the char count more than 125, indicating the receiver that the next message will be a continuation of this one
    }
    let reaminingChars = textLength % maxTextLengthForOnePacket;
    if (reaminingChars != 0) {
        await sendM2Helper(text.substring(totalLoopCount*125,totalLoopCount*125+reaminingChars));
    }
}

async function sendM2Helper(text) {
    let message = {
        command: 'MESG',
        payload: await generateEncryptedPayload(text)
    }
    socket.send(JSON.stringify(message));
    if (DEBUG) console.log(`sent message ${message}`);
    if (DEBUG) displayMessage(`message sent`,true,null);
    displayMessage(text,false,null);
}

async function generateEncryptedPayload(text) {
    let payload = [];
    for (let index = 0; index < SESSION_CLIENTS.length; index++) {
        const pair = SESSION_CLIENTS[index];
        payload.push({
            alias: pair[0],
            message: await encryptMessage(text,pair[1])
        })
    }
    return payload;
}

function sendM3Join(alias) {
    let message = {
        command: 'A-JN',
        alias: alias
    }

    socket.send(JSON.stringify(message));
    displayMessage(`${alias} has joined the chat`,true,null);
}

function sendM3Leave(alias) {
    let message = {
        command: 'A-LV',
        alias: alias
    }

    socket.send(JSON.stringify(message));
    displayMessage(`${alias} has left the chat`,true,null);
}

function sendM4(alias) {
    let message = {
        command: 'A-AL',
        alias: alias
    }

    socket.send(JSON.stringify(message));
    displayMessage(`${alias} has left the chat`,true,null);
}

async function handleStateChangeFrom4(message) { 
    // Check the message TODO !!!
    switch (message.command) {
        case 'MESG':  // R5
            // decrypt the messge and display with timestam and alias
            const plainTextMessageReceived = await decryptMessage(message.message,PRIVATEKEY);
            displayMessage(plainTextMessageReceived,false,message.from);
            if (DEBUG) console.log('received a message');
            if (DEBUG) displayMessage(`received a message from ${message.from}`,true,null);
            // No change in state
            break;
        case 'JOIN': // R6J
            // TODO !!! new client joined
            CURRENTSTATE = 5;
            let publicKey = await importPublicKey(JSON.parse(message.key))
            SESSION_CLIENTS.push([message.alias,publicKey]);
            if (DEBUG) console.log('MESAGE JOIN received');
            if (DEBUG) displayMessage(`received join message, ${message.alias} joined`,true,null);
            sendM3Join(message.alias);
            CURRENTSTATE = 4;
            break;
        case 'LEAV':// R6L
            // TODO !!!
            if (DEBUG) console.log('MESAGE LEAV received');
            if (DEBUG) displayMessage(`received leave message`,true,null);
            SESSION_CLIENTS = SESSION_CLIENTS.filter((pair)=>{
                return pair[0] !== message.alias;
            })
            if (SESSION_CLIENTS.length == 0) {
                // Last client leaving
                // Send M4
                sendM4(message.alias);
                CURRENTSTATE = 3;
                if (DEBUG) displayMessage(`number of remaining users: ${SESSION_CLIENTS.length}`,true,null);
                return;
            }
            // more clients remaining after a given client leaves
            // Send M3
            sendM3Leave(message.alias);
            if (DEBUG) displayMessage(`number of remaining users: ${SESSION_CLIENTS.length+1}`,true,null);
            break;
    
        default:
            
            console.log('unexpected message in state 4');
            displayMessage(`unexpected message in state 4`,true,null);
            break;
    }   
    
}

async function handleStateChangeFrom3(message) { 
    // Check the message TODO !!!
    const importedPublicKey = await importPublicKey(JSON.parse(message.key));
    SESSION_CLIENTS.push([message.alias,importedPublicKey]);
    displayMessage(` ${message.alias} joined the chat`,true,null);
    CURRENTSTATE = 4;
}

async function handleStateChangeFrom2(message) {
    switch (message.command) {
        case 'F-JN': // Check the message TODO !!!
            // ERROR in M1, try to connect again
            console.log('Try to connect again');
            displayMessage('Failed to connect, please try again',true,null);
            // TODO !!!
            CURRENTSTATE = 1;
            break;
        case 'A-JN': // Check the message TODO !!!
            // Wait for user
            if (DEBUG) console.log('waiting for users to join');
            displayMessage('Alone in the session, waiting for users to join',true,null);
            if (DEBUG) displayMessage(`joined as ${ALIAS} on session: ${SESSIONID}`,true,null);
            // TODO !!!
            CURRENTSTATE = 3
            break;
        case 'E-JN': // Check the message TODO !!!
            // joined a session with other people
            displayMessage(`joined as ${ALIAS} on session: ${SESSIONID}`,true,null);
            let userAliases = '';
            for (let index = 0; index < message['payload'].length; index++) {
                const pair = message['payload'][index];
                const usersPublicKey = await importPublicKey(JSON.parse(pair.key));
                SESSION_CLIENTS.push([pair.alias,usersPublicKey]);
                userAliases += pair.alias + ', ';
            }
            if (DEBUG) displayMessage(`existing users are: ${userAliases}`,true,null);
            if (DEBUG) displayMessage(`joined session with ${message['payload'].length} users`,true,null);
            if (DEBUG) console.log(SESSION_CLIENTS);
            CURRENTSTATE = 4;
            break;
    
        default:
            break;
    }
}

// function addMessage(from,msg) {
//     // Check params to combine text
//     let cond1 = CONTINUENEXTMESSAGE
//     let cond2 = Date.now() - LASTMESSAGETIME <= 5*1000;
//     let cond3 = LASTMESSAGEBY == from;

//     // Update params for next addMessage call
//     LASTMESSAGEBY = from;
//     LASTMESSAGETIME = Date.now();
//     CONTINUENEXTMESSAGE = msg.length > 125;

//     // Remove the Continuation placeholder char from message
//     if (CONTINUENEXTMESSAGE) {
//         msg = msg.substring(0,125);
//     }

//     // Check if params meet criteria to continue previous text
//     if (cond1 && cond2 && cond3) {
//         // Combine with previous message
//         document.getElementById('chatDisplay').innerHTML += msg;
//         return;
//     }

//     // check if params meet the criteria to omit time and alias
//     if (cond2 && cond3) {
//         document.getElementById('chatDisplay').innerHTML += `<br><u>${from}</u>:${msg}`;
//         return;
//     }

//     // Do not combine
//     let now = new Date();
//     document.getElementById('chatDisplay').innerHTML += `<br>${now.getHours()}:${now.getMinutes()}<br><u>${from}</u>:${msg}`;
//     clearTextArea();
// }

async function generateKeyPair() {
    return { publicKey, privateKey } = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048, // can be 1024, 2048, or 4096
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
          hash: { name: "SHA-256" }, // can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
        },
        true, // whether the key is extractable (i.e. can be used in exportKey)
        ["encrypt", "decrypt"] // can be any combination of "encrypt" and "decrypt"
    );
} 


async function encryptMessage(message,publicKey) {
    const encodedMessage = new TextEncoder().encode(message);
    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: "RSA-OAEP"
        },
        publicKey,
        encodedMessage
    );
    const base64String = arrayBufferToBase64(encrypted);
    return base64String;
}

async function decryptMessage(encryptedMessageAsBase64,privateKey) {
    const arrayBuffer = base64ToArrayBuffer(encryptedMessageAsBase64);
    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: "RSA-OAEP"
        },
        privateKey,
        arrayBuffer
    );
    
    return new TextDecoder().decode(decrypted);
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

async function exportPublicKeyToPEM(publicKey) {
    const exported = await window.crypto.subtle.exportKey(
        "spki",
        publicKey
    );

    const exportedAsBase64 = window.btoa(String.fromCharCode.apply(null, new Uint8Array(exported)));
    const pemExported = `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;

    return pemExported;
}

async function exportPublicKey(key) {
    const exported = await window.crypto.subtle.exportKey("jwk", key);
    return JSON.stringify(exported);
}

async function importPublicKey(jwk) {
    const key = await window.crypto.subtle.importKey(
        "jwk",
        JSON.parse(jwk),
        {
            name: "RSA-OAEP",
            hash: "SHA-256"
        },
        true,
        ["encrypt"]
    );
    return key;
}

// all messages have content as string
// messages sent by the server have serverSentTheMessage == true
// messages sent by this user have senderName == null
// messages sent by other user have senderName as string
function displayMessage(content, serverSentTheMessage, senderName) {
    
    // Server sent this message
    if (serverSentTheMessage) {
        displayServerNotification(content)
        return;
    }

    // this user sent the message
    if (senderName === null) {
        displaySentMessage(content);
        return;
    }

    // regular message
    displayUserMessage(content,senderName);
}

// displays the content (string) to user as server notification
function displayServerNotification(content) {
    // create notification element
    const notification = document.createElement('div');
    notification.classList.add('server-notification-container');
    
    const notificationContent = document.createElement('div');
    notificationContent.classList.add('server-notification-content');
    notificationContent.innerHTML = content;

    notification.appendChild(notificationContent)

    // display notification element
    document.getElementById('chatDisplay').appendChild(notification)

}

// displays the message as sent by this user
function displaySentMessage(content) {
    // create message element
    const message = document.createElement('div');
    message.classList.add('message-sent-container');

    const bubble = document.createElement('div');
    bubble.classList.add('message-sent-bubble');

    const messageContent = document.createElement('div');
    messageContent.classList.add('message-sent-content');
    messageContent.innerHTML = content;

    bubble.appendChild(messageContent);
    message.appendChild(bubble);

    // display message element
    document.getElementById('chatDisplay').appendChild(message)

}

// displays the content (string) to user as a user message
function displayUserMessage(content,senderName) {
    
    // create message element
    const message = document.createElement('div');
    message.classList.add('message-received-container');
    
    const bubble = document.createElement('div');
    bubble.classList.add('message-received-bubble');
    
    // create div for senders name
    const messageSender = document.createElement('div');
    messageSender.classList.add('message-received-sender');
    messageSender.innerHTML = senderName;
    
    // create div for senders content
    const messageContent = document.createElement('div');
    messageContent.classList.add('message-received-content');
    messageContent.innerHTML = content;
    
    bubble.appendChild(messageSender)
    bubble.appendChild(messageContent)
    message.appendChild(bubble)

    // display message element
    document.getElementById('chatDisplay').appendChild(message)
}