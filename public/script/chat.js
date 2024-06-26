const wsLink = 'ws://localhost:8080';
let socket;

connectWS();

function connectWS() {
    console.log(`WS connected at: ${wsLink}`);
    socket = new WebSocket(wsLink);

    // WebSocket event listeners
    socket.addEventListener('open', function (event) {
        console.log('WebSocket connection established.');
    });

    socket.addEventListener('message', function (event) {
        console.log('Message from server:', event.data);
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