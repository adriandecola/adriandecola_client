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
///////////////////////////FILL THIS OUT//////////////////////////////483912457*(&$#(*)&$#@(*))
//	MUST WAIT UNTIL ||| functionality and ability to add materials is added
//////////////////////////////////////////////////////////////////////

// Handles sending message via clicking the Send button
sendButton.addEventListener('click', function (event) {
	// makes sure the Send button is not disabled
	if (!sendButton.disabled) {
		event.preventDefault(); // Let's me define what happens
		handleSendingUserMessage();
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
		handleSendingUserMessage();
	}
});

// Handles changes to message input
messageInput.addEventListener('input', updateAndEnforceWordCount);

/////////////////////////////////// Primary Functions ///////////////////////////////////

async function handleSendingUserMessage() {
	// Disable both buttons
	setButtonStates(true);

	// Get the message
	const userMessage = messageInput.value.trim();

	// Clear the message input area
	messageInput.value = '';
	updateAndEnforceWordCount();

	// Blur the textarea to hide the mobile keyboard
	messageInput.blur();

	// Makes sure message isn't empty before displaying it and getting an assistant
	// response for it
	if (userMessage) {
		// Console log for debugging
		console.log('Sending message:', userMessage);

		// Displays the user message
		// Convert markdown to HTML too in case user used markdown functionality
		displayMessage(convertMarkdownToHTML(userMessage), 'user');

		// Display loading message while we wait on backend response
		const loadingMessageId = displayLoadingMessage();

		try {
			// Getting a response from the backend
			const assistantResponse = await sendMessageToBackend(userMessage);

			// Converting any markdown in the assistant's response to HTML
			const assistantResponseHTML =
				convertMarkdownToHTML(assistantResponse);

			// If no error is raised then we update the loading message
			// with the assistant's response
			updateLoadingMessage(loadingMessageId, assistantResponseHTML);
		} catch (error) {
			// Console logging for error handling
			console.log('Error from sendMessageToBackend():: ', error);

			// Displaying ***Error*** message from assistant (theres probably better
			// ways to notify the user of an error, update this later)
			removeLoadingMessage(loadingMessageId);
			displayMessage('<strong>***Error***</strong>', 'assistant');
		}
	}

	/////////////////// SHOULD I BLUR THAN REFOCUS WHY IS REFOCUS HERE??
	// Re-focus on the message input field after sending the message
	messageInput.focus();

	// Re-enable the buttons
	setButtonStates(false);
}

async function sendMessageToBackend(userMessage) {
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

		// Console log of response data for debugging
		console.log('Backend Response Data::', responseData);

		// Update the currentThreadId (if one was created)
		currentThreadId = responseData.threadId;

		// Grabbing the assistant's response
		assistantResponse = responseData.assistantResponse;

		// Returning the assistant's response
		return assistantResponse;
	} catch (err) {
		// Console log the error for debugging
		console.log('Fetch error:', err);

		// Throwing the error
		throw err;
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

// Helper function that displays a message in the scrollable-messages div.
// Assumes the message does not contain markdown.
// It can render HTML in the message
// Currently the only roles that are styled are 'assistant' and 'user'
// -> could definetly apply TypeScript to this whole project
function displayMessage(messageHTML, role) {
	// Console log for debugging
	console.log('Displaying message:', messageHTML, 'Role:', role);

	// Create a wrapper for alignment
	const messageWrapper = document.createElement('div');
	messageWrapper.classList.add('message-wrapper', role);

	// Create a div for message background
	const messageDiv = document.createElement('div');
	messageDiv.classList.add('message', role);

	// Add message content
	messageDiv.innerHTML = `<span class="message-content">${messageHTML}</span>`;

	// Add elements to DOM
	messageWrapper.appendChild(messageDiv);
	messagesContainer.appendChild(messageWrapper);

	// Ensures message container is scrolled to the bottom
	// when new message is added
	messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Helper function that displays an assistant loading message while waiting on
// backend response and returns its ID
function displayLoadingMessage() {
	// Creating a div for the message wrapper (for alignment)
	// and adding assistant styles
	const loadingWrapper = document.createElement('div');
	loadingWrapper.classList.add('message-wrapper', 'assistant');

	// Creating a unique ID for the loading message
	loadingWrapper.id = 'loading-' + new Date().getTime();

	// Creating message div (for background) and adding assistant styles
	const loadingDiv = document.createElement('div');
	loadingDiv.classList.add('message', 'assistant');

	// Initial "..." message
	loadingDiv.innerHTML = '<span class="message-content">...</span>';

	// Adding elements to DOM
	loadingWrapper.appendChild(loadingDiv);
	messagesContainer.appendChild(loadingWrapper);

	// Ensures message container is scrolled to the bottom
	// when new message is added
	messagesContainer.scrollTop = messagesContainer.scrollHeight;

	// Add ellipses interval to the loading message that cycle over time
	let ellipses = '';
	const maxEllipses = 3; // Grows to '...'

	const ellipsisInterval = setInterval(() => {
		// Adds a period
		ellipses += '.';

		/// Starts back at '.' after '...' (replaces '....' with '.')
		if (ellipses.length > maxEllipses) ellipses = '.';

		// Clears interval if the loading message wrapper has been removed
		if (!document.getElementById(loadingWrapper.id)) {
			clearInterval(ellipsisInterval);
		}

		// Updates the loading message's content to the new proper ellipses state
		loadingDiv.querySelector('.message-content').innerHTML = ellipses;
	}, 500); // Adjust the interval time as needed

	// Attach interval to wrapper
	loadingWrapper.ellipsisInterval = ellipsisInterval;

	// Returns the unique ID of the assistant loading message wrapper
	return loadingWrapper.id;
}

// Helper function to update loading message with backend response
function updateLoadingMessage(loadingMessageId, assistantResponseHTML) {
	// Gets the loading message
	const loadingMessage = document.getElementById(loadingMessageId);

	// Ensures the loading message exists before modifying its properties
	if (loadingMessage) {
		// Clears interval for ellipses
		clearInterval(loadingMessage.ellipsisInterval);

		// Adding assistant's response to loading message
		loadingMessage.querySelector('.message-content').innerHTML =
			assistantResponseHTML;
	}
}

// Helper function to remove the loading message if there has been an error
// in updating it.
function removeLoadingMessage(loadingMessageId) {
	// Gets the loading message
	const loadingMessage = document.getElementById(loadingMessageId);

	// Ensures the loading message exists before modifying its properties
	if (loadingMessage) {
		// Clears interval for ellipses
		clearInterval(loadingMessage.ellipsisInterval);

		//Removes the loading message
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
