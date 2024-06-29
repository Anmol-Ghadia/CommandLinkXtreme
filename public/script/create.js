//require('dotenv').config();

async function goToChat() {
    console.log('entering the chat');
    const yesOption = document.getElementById("emailY");
    const email = "rmehta07student@ubc.ca"
    if (yesOption.checked) {
        try {
            const response = await fetch('/sendMail', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ to: email, text: "link" })
            });
            if (response.ok) {
              console.log("Mail Sent");
              window.location.href = '/chat'; 
            } else {
              throw new Error('Failed to send email');
            }
        } catch (error) {
            console.error("Error sending mail:", error);
        }
    } 
    console.log('Chat without email');
    window.location.href='/chat';
}



// async function createSessionId() {
//     try {
//         const response = await fetch('create-session', {
//             method: 'POST'
//         });
//         const data = await response.json();
//         console.log('Session ID:', data.sessionId);
//         return data.sessionId;
//     } catch (error) {
//         console.error('Error fetching session ID:', error);
//     }
// }

// async function storeId() {
//     const sessionId = await createSessionId();
//     localStorage.setItem('sessionId', sessionId);
// }