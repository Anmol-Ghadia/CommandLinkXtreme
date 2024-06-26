

async function goToChat() {
    // window.location.href = '/chat';
    await storeId();
    window.location.href='/chat';
}

async function createSessionId() {
    try {
        const response = await fetch('create-session', {
            method: 'POST'
        });
        const data = await response.json();
        console.log('Session ID:', data.sessionId);
        return data.sessionId;
    } catch (error) {
        console.error('Error fetching session ID:', error);
    }
}

async function storeId() {
    const sessionId = await createSessionId();
    localStorage.setItem('sessionId', sessionId);
}