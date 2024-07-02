// ================= NOTE =================
// sessionId and alias are stored in localStorage, upon generation

// ================= Top Level Code =================
window.localStorage.removeItem('sessionId');
window.localStorage.removeItem('alias');

// ================= FUNCTIONS =================
// handles form submit
//  1) generate alias if empty
//  2) send email if not empty
//  3) get session id from server
//  exit if any step returns failure
async function createSessionHandler() {
    let chosenAlias = document.getElementById('alias-input').value;
    if (chosenAlias.length == 0) {
        chosenAlias = generateAlias();
    }
    window.localStorage.setItem('alias', chosenAlias);

    let chosenEmail = document.getElementById('email-input').value;
    if (chosenEmail.length != 0) {
        if (!await send(chosenEmail)) {
            notifyUser('Error in sending email (CODE:100)')
            return;
        }
    }

    let sessionId = await getId();
    if (sessionId == 0) {
        notifyUser('Error in generating Id (CODE:102)')
        return;
    }
    window.localStorage.setItem('sessionId', sessionId);

    goToChat();
}


// ================= HELPERS =================

// picks a random alias from a list of aliases
function generateAlias() {

    const names = [
        "Alex", "Casey", "Riley", "Jordan", "Taylor", "Morgan", "Avery",
        "Peyton", "Quinn", "Skyler", "Rowan", "Emerson", "Dakota", "Reese",
        "Charlie", "Sawyer", "Cameron", "Finley", "Elliot", "Bailey",
        "Jules", "Blake", "Robin", "Kai", "Logan", "Drew",
        "Sage", "Adrian", "Aubrey", "Phoenix", "Remy", "Kendall", "Lane",
        "Spencer", "Case", "Ellis", "Harley", "Indigo", "Leighton", "Marley",
        "Sasha", "Tatum", "Parker", "Shiloh", "Sidney", "Sky", "Alexis",
        "Briar", "Haven", "Justice"
    ];

    const randomIndex = Math.floor(Math.random() * names.length);
    return names[randomIndex];
}

// Gets a unique session id from the server
async function getId() {
    let id = 0;
    await fetch('/create/session')
        .then(res => res.json())
        .then(body => {
            id = body['sessionId'];
        })
        .catch(err => {
            notifyUser("Error in generating Id (CODE:103)");
            console.log(err);
        })
    return id;
}

// Sends email to server, returns true if success
async function send(toEmail) {
    let parameters = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ to: toEmail })
    }

    try {
        let response = await fetch('/send-email', parameters);
        if (response.ok) {
            return true;
        }
        notifyUser(`Error sending email (CODE:104)`)
        console.log(response);
        return false;
    } catch (error) {
        notifyUser(`Error sending email (CODE:105)`);
        console.log(error)
        return false;
    }
}

// Redirects to chat page
function goToChat() {
    window.location.href = '/chat';
}

// Displays the notification to user in a designated area
function notifyUser(message) {
    console.log(message);
    document.getElementById('notification-area').innerHTML = message;
}
