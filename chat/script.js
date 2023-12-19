// chat/script.js
let messageHistory = [];

document
  .getElementById('message-form')
  .addEventListener('submit', function (event) {
    event.preventDefault();
    const messageInput = document.getElementById('message-input');
    const userMessage = messageInput.value;
    messageInput.value = '';

    displayMessage(userMessage, 'user');
    sendMessage(userMessage);
  });

function displayMessage(message, role) {
  const messagesContainer = document.getElementById('messages');
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', role);
  messageDiv.innerHTML = `<span class="content">${message}</span>`;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage(userMessage) {
  try {
    // Send the user's message to the server
    await fetch('https://api.adriandecola.com/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        messageHistory: messageHistory,
      }),
    });

    // Setup EventSource to listen for messages from the server
    const eventSource = new EventSource('https://api.adriandecola.com/chat');

    eventSource.onmessage = function (event) {
      const data = JSON.parse(event.data);

      // Check if data contains the completeHistory
      if (data.completeHistory) {
        messageHistory = data.completeHistory;
        displayCompleteHistory();
      } else {
        // Handle individual message parts
        displayMessage(data.message, 'assistant');
      }
    };

    eventSource.onerror = function (err) {
      console.error('EventSource error:', err);
      eventSource.close();
    };
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

function handleStreamChunk(chunk) {
  if (chunk.startsWith('data:')) {
    const message = JSON.parse(chunk.replace('data:', '').trim());
    if (!message.completeHistory) {
      displayMessage(message, 'assistant');
    }
  }
}

function displayCompleteHistory() {
  const messagesContainer = document.getElementById('messages');
  messagesContainer.innerHTML = '';
  messageHistory.forEach((msg) => {
    displayMessage(msg.content, msg.role);
  });
}

///////TEST
document
  .getElementById('test-button')
  .addEventListener('click', async function () {
    const outputDiv = document.getElementById('test-output');
    try {
      const response = await fetch('https://api.adriandecola.com/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      outputDiv.textContent = 'Test response: ' + data.message;
    } catch (err) {
      outputDiv.textContent = 'Test failed: ' + err.message;
      console.error('Fetch error:', err);
    }
  });
