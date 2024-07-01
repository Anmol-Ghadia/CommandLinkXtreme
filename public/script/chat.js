const wsLink = 'ws://localhost:8080';
let socket;

let CURRENTSTATE = 0;
let SESSION_CLIENTS = []; // Excluding self

connectWS();
function connectWS() {
    console.log(`WS connected at: ${wsLink}`);
    socket = new WebSocket(wsLink);
    CURRENTSTATE = 1;

    // WebSocket event listeners
    socket.addEventListener('open', function (event) {
        console.log('WebSocket connection established.');
        
        sendM1(socket);
        CURRENTSTATE = 2;
    });

    socket.addEventListener('message', function (event) {
        let message = JSON.parse(event.data);
        console.log('Message from server:', message);
        let command = message.command;
        switch (CURRENTSTATE) {
            case 2:
                if (command != 'A-JN' && command != 'F-JN' && command != 'E-JN') {
                    console.log('unexpected response from the server (102)');
                    displayNotification('Server mesbehaving (102)');
                    return;
                }
                handleStateChangeFrom2(message);
                break;
            case 3:
                if (command != 'JOIN') {
                    console.log('unexpected response from the server (103)');
                    displayNotification('Server mesbehaving (103)');
                    return;
                }
                handleStateChangeFrom3(message);
                break;
            case 4:
                if (command != 'MESG' && command != 'LEAV' && command != 'JOIN') {
                    console.log('unexpected response from the server (104)');
                    displayNotification('Server mesbehaving (104)');
                    return;
                }
                handleStateChangeFrom4(message);
                break;
            default:
            
                console.log('unexpected or unimplemented command received');
                displayNotification(`unexpected or unimplemented command received`);
                break;
        }
    });

    socket.addEventListener('close', function (event) {
        console.log('WebSocket connection closed.');
    });

    socket.addEventListener('error', function (event) {
        console.error('WebSocket encountered an error:', event);
    });

}

function displayNotification(msg) {
    document.getElementById('display-notification').innerHTML = msg;
}

function closeWS() {
    socket.close();
    console.log("socket Closed");
}

function sendWS() {
    const text = document.getElementById('input-text-area').value
    socket.send(text);
    console.log(`sent data: ${text}`);
}

function exitPage() {
    closeWS();
    window.location.href = "/";
}

function sendM1(socket) {
    let random = Math.floor(Math.random()*100);
    let message = {
        command: 'JOIN',
        sessionId: 990011,
        key: `abc${random}`,
        alias: `alice${random}`
    }

    socket.send(JSON.stringify(message));
}


function handleStateChangeFrom4(message) { 
    // Check the message TODO !!!
    switch (message.command) {
        case 'MESG':  // R5
            // decrypt the messge and display with timestam and alias
            document.getElementById('chat-display').innerHTML += `${message.alias}:${message.message} <br>`;
            console.log('received a message');
            displayNotification(`received a message from ${message.alias}`);
            // No change in state
            break;
        case 'JOIN': // R6J
            // TODO !!!
            console.log('MESAGE JOIN received');
            displayNotification(`received join message`);
            break;
        case 'LEAV':// R6L
            // TODO !!!
            console.log('MESAGE LEAV received');
            displayNotification(`received leave message`);
            break;
    
        default:
            
            console.log('unexpected message in state 4');
            displayNotification(`unexpected message in state 4`);
            break;
    }   
    
}

function handleStateChangeFrom3(message) { 
    // Check the message TODO !!!
    SESSION_CLIENTS.push([message.alias,message.key]);
    displayNotification(`user joined with alias: ${message.alias}`);
    CURRENTSTATE = 4;
}

function handleStateChangeFrom2(message) {
    switch (message.command) {
        case 'F-JN': // Check the message TODO !!!
            // ERROR in M1, try to connect again
            console.log('Try to connect again');
            displayNotification('Failed to connect, please try again');
            // TODO !!!
            CURRENTSTATE = 1;
            break;
        case 'A-JN': // Check the message TODO !!!
            // Wait for user
            console.log('waiting for users to join');
            displayNotification('Alone in the session, waiting for users to join');
            // TODO !!!
            CURRENTSTATE = 3
            break;
        case 'E-JN': // Check the message TODO !!!
            // joined a session with other people
            for (let index = 0; index < message['payload'].length; index++) {
                const pair = message['payload'][index];
                SESSION_CLIENTS.push([pair.alias,pair.key]);
            }
            displayNotification(`joined session with ${message['payload'].length} users`);
            console.log(SESSION_CLIENTS);
            CURRENTSTATE = 4;
            break;
    
        default:
            break;
    }
}
