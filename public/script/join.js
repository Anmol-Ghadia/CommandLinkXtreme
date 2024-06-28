
let storedId = localStorage.getItem('sessionId'); // for now, later will use server to send session id 

function joinSession() {
    const sessionId = document.getElementById('input-session-id').value;
    if (sessionId === '') {
        alert('Please enter a session ID');
        return;
    } else if (sessionId === storedId) {
        window.location.href = '/chat';
        return;
    } else {
        alert('Invalid session ID');
        return;
    }
}
