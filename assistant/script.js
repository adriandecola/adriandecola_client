// assistant/script.js

let currentThreadId = null;

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
  const loadingMessageId = displayLoadingMessage(); // Display loading message

  try {
    console.log('Posting to /assistant');
    const response = await fetch('https://api.adriandecola.com/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        threadId: currentThreadId, // Pass the currentThreadId
      }),
    });
    // Getting response data in JSON format
    const responseData = await response.json();

    // Update the currentThreadId (if one was created)
    currentThreadId = responseData.threadId;

    if (responseData.formData) {
      // If the form was filled, update the company details
      updateCompanyDetails(responseData.formData);
    }

    // Update the loading message with the response
    updateLoadingMessage(loadingMessageId, responseData.response);
  } catch (err) {
    console.error('Fetch error:', err);
    removeLoadingMessage(loadingMessageId); // Remove the loading message in case of error
  }
}

function displayLoadingMessage() {
  const messagesContainer = document.getElementById('messages');
  const loadingWrapper = document.createElement('div');
  loadingWrapper.classList.add('message-wrapper', 'assistant');
  loadingWrapper.id = 'loading-' + new Date().getTime(); // Unique ID for the loading message

  const loadingDiv = document.createElement('div');
  loadingDiv.classList.add('message', 'assistant');
  loadingDiv.innerHTML = '<span class="content">...</span>'; // Initial "..." message

  loadingWrapper.appendChild(loadingDiv);
  messagesContainer.appendChild(loadingWrapper);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Add ellipses over time
  let ellipses = '';
  const maxEllipses = 3;
  const ellipsisInterval = setInterval(() => {
    ellipses += '.';
    if (ellipses.length > maxEllipses) ellipses = '.';
    loadingDiv.querySelector('.content').innerHTML = ellipses;

    // Check if the loading message still exists, clear interval if it's removed
    if (!document.getElementById(loadingWrapper.id)) {
      clearInterval(ellipsisInterval);
    }
  }, 500); // Adjust the interval time as needed

  loadingWrapper.ellipsisInterval = ellipsisInterval;

  return loadingWrapper.id;
}

function updateLoadingMessage(loadingMessageId, newMessage) {
  const loadingMessage = document.getElementById(loadingMessageId);
  if (loadingMessage) {
    clearInterval(loadingMessage.ellipsisInterval);
    loadingMessage.querySelector('.content').innerHTML = newMessage.replace(
      /\n/g,
      '<br>'
    );
  }
}

function removeLoadingMessage(loadingMessageId) {
  const loadingMessage = document.getElementById(loadingMessageId);
  if (loadingMessage) {
    clearInterval(loadingMessage.ellipsisInterval);
    loadingMessage.remove();
  }
}

function resizeTextarea(textarea) {
  textarea.style.height = '30px'; // Set initial height
  textarea.style.height = Math.max(textarea.scrollHeight - 20, 30) + 'px'; // Adjust if needed
}

//////////////////////////////// Travel Details JS ////////////////////////////////
document.getElementById('passengers').addEventListener('focus', function () {
  this.parentNode.classList.add('focused');
});

document.getElementById('passengers').addEventListener('blur', function () {
  this.parentNode.classList.remove('focused');
});

function incrementValue() {
  var value = parseInt(document.getElementById('passengers').value, 10);
  value = isNaN(value) ? 1 : value;
  value++;
  document.getElementById('passengers').value = value;
}

function decrementValue() {
  var value = parseInt(document.getElementById('passengers').value, 10);
  value = isNaN(value) ? 1 : value;
  value < 2 ? (value = 1) : value--;
  document.getElementById('passengers').value = value;
}

// For the passanger input field's input
document.getElementById('passengers').addEventListener('blur', function (e) {
  if (e.target.value === '0' || e.target.value === '') {
    e.target.value = '1';
  }
});
document.getElementById('passengers').addEventListener('input', function (e) {
  const cursorPosition = e.target.selectionStart - 1;
  const originalValue = e.target.value;
  const newValue = originalValue.replace(/\D+/g, '');

  if (newValue !== originalValue) {
    e.target.value = newValue;
    e.target.setSelectionRange(cursorPosition, cursorPosition);
  }

  if (e.target.value === '0' || e.target.value === '') {
    return;
  }

  if (e.target.value.length > 1 && e.target.value.startsWith('0')) {
    e.target.value = e.target.value.substring(1);
  }
});

//////// For flight class selection /////////
// Function to set the selected class and close the dropdown
function chooseClass(selectedClass) {
  document.getElementById('selected-class').textContent = selectedClass;
  document.getElementById('class-options').style.display = 'none';
}

// Event listener to open/close the dropdown
document
  .getElementById('selected-class')
  .addEventListener('click', function (event) {
    var dropdownContent = document.getElementById('class-options');
    if (dropdownContent.style.display === 'block') {
      dropdownContent.style.display = 'none';
    } else {
      dropdownContent.style.display = 'block';
    }
    // Prevent the event from bubbling up to the document
    event.stopPropagation();
  });

// Event listener to close the dropdown if clicked outside
document.addEventListener('click', function (event) {
  var dropdownContent = document.getElementById('class-options');
  if (event.target.id !== 'selected-class') {
    dropdownContent.style.display = 'none';
  }
});
