// ================= Top Level Code =================
window.addEventListener('load',onLoad);

// ================= FUNCTIONS =================

// Checks if any session id is stored on localstorage
//   if there is an old id autofill the session id box
function onLoad() {
    let id = window.localStorage.getItem('sessionId');
    console.log(id);
    if (typeof id !== 'string') {
        return;
    }
    document.getElementById('session-id-input').value = id;
}

// Joins the session after
//  1) checking session id is valid
//  2) alias is supplied or generated
async function doJoin() {
    let sessionId = document.getElementById('session-id-input').value;
    if (sessionId.length == 0) {
        notifyUser('Please enter a session Id');
        return;
    }
    if (!await checkIdExists(sessionId)) {
        notifyUser('Session Id is not valid');
        return;
    }
    window.localStorage.setItem('sessionId',sessionId);

    let alias = document.getElementById('alias-input').value;
    if (alias.length == 0) {
        alias = generateAlias();
    }
    window.localStorage.setItem('alias',alias);

    window.location.href='/chat';
}

// ================= HELPERS =================

// REQUIRES: session ID is number
// returns true if the session id is valid according to the server
async function checkIdExists(sessionId) {
    let isValid = false;
    await fetch(`/session/check/${sessionId}`)
    .then(res=>{
        if (!res.ok) {
            console.log('Session Id is no longer valid (CODE:101)');
            console.log(res);
            return;
        }
        isValid = true;
    })
    .catch(err=>{
        console.log('Error determining validity of the session (CODE:102)');
        console.log(err);
    })
    return isValid;
} 

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

// Displays the notification to user in a designated area
function notifyUser(message) {
    console.log(message);
    document.getElementById('notification-area').innerHTML = message;
}
