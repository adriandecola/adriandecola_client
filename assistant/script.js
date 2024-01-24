// assistant/script.js
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
  .addEventListener('input', updateTextArea);

function sendMessageFromInput() {
  const messageInput = document.getElementById('message-input');
  const userMessage = messageInput.value.trim();

  if (userMessage) {
    console.log('Sending message:', userMessage);
    displayMessage(userMessage, 'user');
    sendMessage(userMessage);

    messageInput.value = '';
    updateTextArea();

    // Blur the textarea to hide the mobile keyboard
    messageInput.blur();
  }
}

function updateTextArea() {
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
    console.log('Posting to /assistant');
    const response = await fetch('https://api.adriandecola.com/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
      }),
    });

    const responseData = await response.json();
    displayMessage(responseData.response, 'assistant');
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

function resizeTextarea(textarea) {
  textarea.style.height = '30px'; // Set initial height
  textarea.style.height = Math.max(textarea.scrollHeight - 20, 30) + 'px'; // Adjust if needed
}
