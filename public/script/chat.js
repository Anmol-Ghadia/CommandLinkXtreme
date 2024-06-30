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
                    console.log('unexpected response from the server (100)');
                    return;
                }
                handleStateChangeFromTwo(message);
                break;
        
            default:
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

function handleStateChangeFromTwo(message) {
    switch (message.command) {
        case 'F-JN':
            // ERROR in M1, try to connect again
            console.log('Try to connect again');
            // TODO !!!
            CURRENTSTATE = 1;
            break;
        case 'A-JN':
            // Wait for user
            console.log('waiting for users to join');
            // TODO !!!
            CURRENTSTATE = 3
            break;
        case 'E-JN':
            // joined a session with other people
            for (let index = 0; index < message['payload'].length; index++) {
                const pair = message['payload'][index];
                SESSION_CLIENTS.push([pair.alias,pair.key]);
            }
            console.log('recorded pub keys');
            console.log(SESSION_CLIENTS);
            CURRENTSTATE = 4;
            break;
    
        default:
            break;
    }
}
