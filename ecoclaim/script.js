// assistant/script.js

/////////////////////////////// Global Variable Definitions /////////////////////////////

let currentThreadId = null; //(could have this passed in functions)

//////////////////////////////////// Event Listeners ////////////////////////////////////

// DOM references
const submitButton = document.getElementById('submit-button');
const sendButton = document.getElementById('send-button');
const messageInput = document.getElementById('message-input');
const wordCount = document.getElementById('word-count');
const messagesContainer = document.getElementById('scrollable-messages');

// Handles sending generated message via clicking the Sumbit button
//////////////////////////////////////////////////////////////////////
///////////////////////////FILL THIS OUT//////////////////////////////
//////////////////////////////////////////////////////////////////////

// Handles sending message via clicking the Send button
sendButton.addEventListener('click', function (event) {
	// makes sure the Send button is not disabled
	if (!sendButton.disabled) {
		event.preventDefault(); // Let's me define what happens
		sendMessageFromInput();
	}
});

// Handles sending message via Enter in message-input
messageInput.addEventListener('keydown', function (event) {
	/* 
	Prevent sending message if:
		- Enter is pressed with the Shift key
						or 
		- The send button is disabled
	*/
	if (event.key === 'Enter' && !event.shiftKey && !sendButton.disabled) {
		event.preventDefault(); // Let's me define what happens
		sendMessageFromInput();
	}
});

// Handles changes to message input
messageInput.addEventListener('input', updateAndEnforceWordCount);

/////////////////////////////////// Primary Functions ///////////////////////////////////

function sendMessageFromInput() {
	// Disable both buttons
	setButtonStates(true);

	// Get the message
	const userMessage = messageInput.value.trim();

	// Makes sure message isn't empty
	if (userMessage) {
		// Console log for debugging
		console.log('Sending message:', userMessage);

		// Displays the user message
		displayMessage(userMessage, 'user');

		// Gets response from backend
		sendMessageToBackend(userMessage);

		// Clear the message input area
		messageInput.value = '';
		updateAndEnforceWordCount();

		// Blur the textarea to hide the mobile keyboard
		messageInput.blur();
	}
	/////////////////// SHOULD I BLUR THAN REFOCUS WHY IS REFOCUS HERE??
	// Re-focus on the message input field after sending the message
	messageInput.focus();
}

async function sendMessageToBackend(userMessage) {
	// Display loading message while we wait on backend response
	const loadingMessageId = displayLoadingMessage();

	try {
		// Console log for debugging
		console.log('Posting to /ecoclaim_assistant');

		// Hitting the backend endpoint
		const response = await fetch(
			'https://api.adriandecola.com/ecoclaim_assistant',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					message: userMessage,
					threadId: currentThreadId, // Pass the currentThreadId
				}),
			}
		);

		// Console log of response for debugging
		console.log('Backend response: ', response);

		// Getting response data in JSON format
		const responseData = await response.json();

		// Update the currentThreadId (if one was created)
		currentThreadId = responseData.threadId;

		// Update the loading message with the assistant's response
		updateLoadingMessage(loadingMessageId, responseData.assistantResponse);
	} catch (err) {
		// Console log the error for debugging
		console.error('Fetch error:', err);

		// Remove the loading message in case of error
		removeLoadingMessage(loadingMessageId);

		// Re-enable the buttons even if there's an error
		setButtonStates(false);
	}
}

///////////////////////////// Other helper functions ///////////////////////////////////////

// Helper function to set button states
function setButtonStates(isDisabled) {
	submitButton.disabled = isDisabled;
	sendButton.disabled = isDisabled;
}

// Helper function that updates and enforces the word count in the
// message-input
function updateAndEnforceWordCount() {
	let words = messageInput.value.split(/\s+/).filter(Boolean);

	if (words.length > 150) {
		words = words.slice(0, 150);
		messageInput.value = words.join(' ');
	}

	wordCount.textContent = `${words.length}/150`;
}

// Helper function that displays a message in the scrollable-messages div
function displayMessage(message, role) {
	// Console log for debugging
	console.log('Displaying message:', message, 'Role:', role);

	// Create a wrapper for alignment
	const messageWrapper = document.createElement('div');
	messageWrapper.classList.add('message-wrapper', role);

	// Create a div for message background
	const messageDiv = document.createElement('div');
	messageDiv.classList.add('message', role);

	// Add message content
	messageDiv.innerHTML = `<span class="message-content">${convertMarkdownToHTML(
		message
	)}</span>`;

	// Add elements to DOM
	messageWrapper.appendChild(messageDiv);
	messagesContainer.appendChild(messageWrapper);
	messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Helper function that displays loading message while waiting on backend response
function displayLoadingMessage() {
	const messagesContainer = document.getElementById('scrollable-messages');
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

// Helper function to update loading message with backend response
function updateLoadingMessage(loadingMessageId, newMessage) {
	const loadingMessage = document.getElementById(loadingMessageId);
	if (loadingMessage) {
		clearInterval(loadingMessage.ellipsisInterval);

		// Markdown to HTML conversion
		loadingMessage.querySelector('.content').innerHTML =
			convertMarkdownToHTML(newMessage);

		// Re-enable the send button
		document.getElementById('send-button').disabled = false;

		// Also re-enable the submit button in the travel details form
		document.getElementById('submit-button').disabled = false;
	}
}

// Helper function to remove the loading message if there has been an error
// in updating it.
function removeLoadingMessage(loadingMessageId) {
	const loadingMessage = document.getElementById(loadingMessageId);
	if (loadingMessage) {
		clearInterval(loadingMessage.ellipsisInterval);
		loadingMessage.remove();
	}
}

// Helper function to convert markdown (from assistant response) to HTML
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

	// Handle LaTeX-like syntax for equations
	htmlText = htmlText.replace(/\\\((.*?)\\\)/g, (match, equation) => {
		// Replace LaTeX equation markers with MathJax delimiters
		return `\\(${equation}\\)`; // Inline equations
	});

	return htmlText;
}