// chat/script.js
let messageHistory = [];

document
  .getElementById('message-form')
  .addEventListener('submit', function (event) {
    event.preventDefault();
    const messageInput = document.getElementById('message-input');
    const userMessage = messageInput.value;
    messageInput.value = '';

    console.log('Sending message:', userMessage);
    displayMessage(userMessage, 'user');
    sendMessage(userMessage);
  });

function displayMessage(message, role) {
  console.log('Displaying message:', message, 'Role:', role);
  const messagesContainer = document.getElementById('messages');
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', role);
  messageDiv.innerHTML = `<span class="content">${message}</span>`;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage(userMessage) {
  try {
    console.log('Posting to /chat');
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
    readStream(reader);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

let currentAssistantMessageDiv = null; // Reference to the current assistant message element

async function readStream(reader) {
  try {
    let done, value;
    let accumulatedMessage = ''; // To accumulate the message content

    while ((({ done, value } = await reader.read()), !done)) {
      const chunk = new TextDecoder().decode(value);
      console.log('Received chunk:', chunk);

      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data:')) {
          try {
            const data = JSON.parse(line.slice(5)); // Remove 'data:' prefix
            console.log('Parsed data:', data);

            if (data.completeHistory) {
              messageHistory = data.completeHistory;
              console.log('Updating complete history:', messageHistory);
              displayCompleteHistory();
              currentAssistantMessageDiv = null; // Reset after displaying history
            } else if (data.message) {
              accumulatedMessage += data.message; // Accumulate the message content
              updateAssistantMessage(accumulatedMessage);
            }
          } catch (parseError) {
            console.error('Error parsing line:', parseError);
          }
        }
      }
    }
    console.log('Stream reading completed');
  } catch (err) {
    console.error('Stream reading error:', err);
  }
}

function updateAssistantMessage(message) {
  if (!currentAssistantMessageDiv) {
    currentAssistantMessageDiv = createMessageDiv('assistant');
  }
  currentAssistantMessageDiv.querySelector('.content').textContent = message;
}

function createMessageDiv(role) {
  const messagesContainer = document.getElementById('messages');
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', role);
  messageDiv.innerHTML = '<span class="content"></span>';
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  return messageDiv;
}

function displayCompleteHistory() {
  console.log('Displaying complete history:', messageHistory);
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
