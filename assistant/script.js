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
  // Disable the send button
  document.getElementById('send-button').disabled = true;

  const messageInput = document.getElementById('message-input');
  const userMessage = messageInput.value.trim();

  if (userMessage) {
    console.log('Sending message:', userMessage);
    displayMessage(userMessage, 'user');
    sendMessage(userMessage);
    getFormData(userMessage);

    messageInput.value = '';
    updateTextArea();

    // Blur the textarea to hide the mobile keyboard
    messageInput.blur();
  }
}

async function getFormData(userMessage) {
  try {
    console.log('Posting to /form');
    const response = await fetch('https://api.adriandecola.com/form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
      }),
    });

    // Getting form data in JSON format
    const formData = await response.json();
    console.log('Form Data: ', formData);

    updateFormFields(formData);
  } catch (err) {
    console.error('Form fetch error:', err);
  }
}

/*

function updateFormFields(formData) {
  // Assuming formData contains the structure:
  // { travelType, initialAirport, finalAirport, numberOfPassengers, flightClass }
  // Update travel type radio buttons
  console.log('updateFormFields function called');
  console.log('Form data: ', formData);

  if (formData.travelType === 'round trip') {
    document.getElementById('return').checked = true;
  } else if (formData.travelType === 'one-way') {
    document.getElementById('one-way').checked = true;
  }

  // Update initial and final airport fields
  if (formData.initialAirport && formData.initialAirport !== 'not specified') {
    document.getElementById('from-airport').value = formData.initialAirport;
  }

  if (formData.finalAirport && formData.finalAirport !== 'not specified') {
    document.getElementById('to-airport').value = formData.finalAirport;
  }

  // Update number of passengers
  if (
    formData.numberOfPassengers &&
    formData.numberOfPassengers !== 'not specified'
  ) {
    document.getElementById('passengers').value = formData.numberOfPassengers;
  }

  // Update flight class
  if (formData.flightClass && formData.flightClass !== 'not specified') {
    const classOptions = {
      economy: 'Economy',
      'premium economy': 'Premium Economy',
      business: 'Business',
      'first class': 'First Class',
    };
    const selectedClass = classOptions[formData.flightClass.toLowerCase()];
    if (selectedClass) {
      document.getElementById('selected-class').textContent = selectedClass;
    }
  }
}

*/

function updateFormFields(formData) {
  console.log('Raw formData:', formData);

  // Parse formData from JSON string to Object
  try {
    const parsedFormData = JSON.parse(formData);
    console.log('Parsed formData:', parsedFormData);

    // Use parsedFormData for your logic
    if (parsedFormData.travelType === 'round trip') {
      document.getElementById('return').checked = true;
      console.log('Set travel type to round trip');
    } else if (parsedFormData.travelType === 'one-way') {
      document.getElementById('one-way').checked = true;
      console.log('Set travel type to one-way');
    } else {
      console.log(
        'No matching travel type found in parsedFormData, or missing travelType field'
      );
    }

    if (
      parsedFormData.initialAirport &&
      parsedFormData.initialAirport !== 'not specified'
    ) {
      document.getElementById('from-airport').value =
        parsedFormData.initialAirport;
      console.log('Set initial airport to:', parsedFormData.initialAirport);
    } else {
      console.log('Initial airport not specified or missing in parsedFormData');
    }

    if (
      parsedFormData.finalAirport &&
      parsedFormData.finalAirport !== 'not specified'
    ) {
      document.getElementById('to-airport').value = parsedFormData.finalAirport;
      console.log('Set final airport to:', parsedFormData.finalAirport);
    } else {
      console.log('Final airport not specified or missing in parsedFormData');
    }

    if (
      parsedFormData.numberOfPassengers &&
      parsedFormData.numberOfPassengers !== 'not specified'
    ) {
      document.getElementById('passengers').value =
        parsedFormData.numberOfPassengers;
      console.log(
        'Set number of passengers to:',
        parsedFormData.numberOfPassengers
      );
    } else {
      console.log(
        'Number of passengers not specified or missing in parsedFormData'
      );
    }

    if (
      parsedFormData.flightClass &&
      parsedFormData.flightClass !== 'not specified'
    ) {
      const classOptions = {
        economy: 'Economy',
        'premium economy': 'Premium Economy',
        business: 'Business',
        'first class': 'First Class',
      };
      // Ensure the flight class string is converted to lower case correctly
      const selectedClass =
        classOptions[parsedFormData.flightClass.toLowerCase()];
      if (selectedClass) {
        document.getElementById('selected-class').textContent = selectedClass;
        console.log('Set flight class to:', selectedClass);
      } else {
        console.log(
          'Flight class specified in parsedFormData not found in options:',
          parsedFormData.flightClass
        );
      }
    } else {
      console.log('Flight class not specified or missing in parsedFormData');
    }
  } catch (error) {
    console.error('Error parsing formData:', error);
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

  messageDiv.innerHTML = `<span class="content">${convertMarkdownToHTML(
    message
  )}</span>`;

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
    // Remove the loading message in case of error
    removeLoadingMessage(loadingMessageId);
    // Re-enable the send button even if there's an error
    document.getElementById('send-button').disabled = false;
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

    // Markdown to HTML conversion
    loadingMessage.querySelector('.content').innerHTML =
      convertMarkdownToHTML(newMessage);

    // Re-enable the send button
    document.getElementById('send-button').disabled = false;
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

// Function called when the submit button is clicked
function submitFunction() {
  // Placeholder for future implementation
  console.log('Submit button clicked');
}

///////////////////////////// Other helper functions ///////////////////////////////////////
function updateCompanyDetails(formData) {
  // Function body is empty
}

function convertMarkdownToHTML(markdownText) {
  let htmlText = markdownText
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold with double asterisks
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italicize with single asterisks
    .replace(/_(.*?)_/g, '<em>$1</em>') // Italicize with single underscores
    .replace(/~~(.*?)~~/g, '<del>$1</del>') // Strikethrough with double tildes
    .replace(/`(.*?)`/g, '<code>$1</code>'); // Monospace with backticks

  // Handle unordered lists
  htmlText = htmlText.replace(
    /(?:\r\n|\r|\n)(\*|\+|-) (.+)/g,
    (match, bullet, item) => {
      return `<ul><li>${item}</li></ul>`;
    }
  );

  // Handle ordered lists
  htmlText = htmlText.replace(
    /(?:\r\n|\r|\n)(\d+\.) (.+)/g,
    (match, number, item) => {
      return `<ol><li>${item}</li></ol>`;
    }
  );

  return htmlText;
}
