document.getElementById('emailY').addEventListener('change', function() {
  document.getElementById('email-input').disabled = !this.checked;
});

document.getElementById('emailN').addEventListener('change', function() {
  document.getElementById('email-input').disabled = this.checked;
});

// Redirects to chat page
async function goToChat() {
  console.log('Chat page transfer loaded');
  window.location.href = '/chat';
}

// Checks `emailY`, retrieves email if checked and not empty, calls `send()`. If not checked, calls `goToChat()`.
async function buttonClick() {
  const yesOption = document.getElementById("emailY");
  if (yesOption.checked) {
      const emailInput = document.getElementById("email-input");
      const email = emailInput.value;

      if (email === "") {
          alert("Please enter your email address");
          return;
      }

      const toEmail = email;
      console.log("Email copied for sending");
      await send(toEmail);
  } else {
      await goToChat();
  }
}

// Sends email to server
async function send(toEmail) {
  try {
      const response = await fetch('/send-email', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ to: toEmail })
      });

      if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
      }

      const data = await response.text();
      console.log(data);
      await goToChat();
  } catch (error) {
      console.error('Error:', error);
  }
}
