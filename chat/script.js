// chat/script.js
let messageHistory = [];

document
  .getElementById('message-form')
  .addEventListener('submit', function (event) {
    event.preventDefault();
    sendMessageFromInput();
  });

document
  .getElementById('message-input')
  .addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessageFromInput();
    }
  });

document
  .getElementById('message-input')
  .addEventListener('input', updateTextarea);

function sendMessageFromInput() {
  const messageInput = document.getElementById('message-input');
  const userMessage = messageInput.value.trim();

  if (userMessage) {
    console.log('Sending message:', userMessage);
    displayMessage(userMessage, 'user');
    sendMessage(userMessage);

    messageInput.value = '';
    updateTextarea();
  }
}

function updateTextarea() {
  const messageInput = document.getElementById('message-input');
  let words = messageInput.value.split(/\s+/).filter(Boolean);

  if (words.length > 120) {
    words = words.slice(0, 120);
    messageInput.value = words.join(' ');
  }

  document.getElementById('word-count').textContent = `${words.length}/120`;

  // Reset and then adjust the height of the textarea
  resizeTextarea(messageInput);
}

function displayMessage(message, role) {
  console.log('Displaying message:', message, 'Role:', role);
  const messagesContainer = document.getElementById('messages');

  // Create a wrapper for alignment
  const messageWrapper = document.createElement('div');
  messageWrapper.classList.add('message-wrapper', role);

  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', role);

  // Replace newline characters with HTML line breaks for display
  const formattedMessage = message.replace(/\n/g, '<br>');
  messageDiv.innerHTML = `<span class="content">${formattedMessage}</span>`;

  messageWrapper.appendChild(messageDiv);
  messagesContainer.appendChild(messageWrapper);
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
  // Check if the currentAssistantMessageDiv is already created
  if (!currentAssistantMessageDiv) {
    // Create a new message div for streaming content
    currentAssistantMessageDiv = createMessageDiv('assistant');

    // Wrap the message div in a message-wrapper for alignment
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('message-wrapper', 'assistant');
    messageWrapper.appendChild(currentAssistantMessageDiv);

    // Append the wrapper to the messages container
    const messagesContainer = document.getElementById('messages');
    messagesContainer.appendChild(messageWrapper);
  }

  // Replace newline characters with HTML line breaks
  const formattedMessage = message.replace(/\n/g, '<br>');
  currentAssistantMessageDiv.querySelector('.content').innerHTML =
    formattedMessage;
}

function createMessageDiv(role) {
  // Create the message div
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', role);
  messageDiv.innerHTML = '<span class="content"></span>';

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

function updateWordCount(count) {
  document.getElementById('word-count').textContent = `${count}/120`;
}

function resizeTextarea(textarea) {
  textarea.style.height = '30px'; // Set initial height
  textarea.style.height = Math.max(textarea.scrollHeight - 20, 30) + 'px'; // Adjust if needed
}
