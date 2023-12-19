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
    const response = await fetch('https://api.adriandecola.com/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        messageHistory: messageHistory,
      }),
    });

    const reader = response.body.getReader();
    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          const chunk = new TextDecoder().decode(value);
          handleStreamChunk(chunk);
          controller.enqueue(value);
        }
        controller.close();
      },
    });

    const newResponse = new Response(stream);
    const data = await newResponse.json();

    if (data.completeHistory) {
      messageHistory = data.completeHistory;
      displayCompleteHistory();
    }
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
