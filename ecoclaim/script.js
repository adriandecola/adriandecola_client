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
//	MUST WAIT UNTIL ||| functionality and ability to add materials is added
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
		// Convert markdown to HTML too in case user used markdown functionality
		displayMessage(convertMarkdownToHTML(userMessage), 'user');

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

		// Converting any markdown in the assistant's response to HTML
		assistantResponseHTML = convertMarkdownToHTML(
			responseData.assistantResponse
		);

		// Update the loading message with the assistant's response
		updateLoadingMessage(loadingMessageId, assistantResponseHTML);

		// Re-enable the buttons
		setButtonStates(false);
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

// Helper function that displays a message in the scrollable-messages div.
// Currently it only displays user messages, but if streaming is integrated
// it can display user or assistant messages.
// Assumes the message does not contain markdown.
// Currently the only roles that are styled are 'assistant' and 'user'
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

	// Add ellipses over time
	let ellipses = '';
	const maxEllipses = 3; // Grows to '...'
	const ellipsisInterval = setInterval(() => {
		// Adds a period
		ellipses += '.';

		/// Starts back at '.' after '...' (replaces '....' with '.')
		if (ellipses.length > maxEllipses) ellipses = '.';

		// Updates the loading message's content
		loadingDiv.querySelector('.content').innerHTML = ellipses;

		// Check if the loading message still exists, clear interval if it's removed
		// In case there is an error later in clearing the interval
		if (!document.getElementById(loadingWrapper.id)) {
			clearInterval(ellipsisInterval);
		}
	}, 500); // Adjust the interval time as needed

	// Returns the unique ID of the assistant loading message wrapper
	return loadingWrapper.id;
}

// Helper function to update loading message with backend response
function updateLoadingMessage(loadingMessageId, assistantResponseHTML) {
	// Gets loading message
	const loadingMessage = document.getElementById(loadingMessageId);

	// Ensures loading message exists
	if (loadingMessage) {
		// Clears interval for ellipses
		clearInterval(loadingMessage.ellipsisInterval);

		// Adding assistant's response to loading message
		loadingMessage.querySelector('.content').innerHTML =
			assistantResponseHTML;
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

///////////////////////////// Beta function for assistant to call ///////////////////////////////////////
// probably no need for either of those checks as the assistant should fill out all fields and only fields
// specified
function calculateCarbonEmissionsForAllCommonMaterials(materials) {
	// Emissions factors (kg CO₂ per kg of material)
	const emissionsFactors = {
		asphalt: 0.05, // Example: Asphalt generates 0.05 kg CO₂ per kg
		brick_block: 0.03, // Example: Brick/Block generates 0.03 kg CO₂ per kg
		cardboard: 0.02, // Example: Cardboard generates 0.02 kg CO₂ per kg
		concrete: 0.1, // Example: Concrete generates 0.1 kg CO₂ per kg
		drywall: 0.07, // Example: Drywall generates 0.07 kg CO₂ per kg
		glass: 0.2, // Example: Glass generates 0.2 kg CO₂ per kg
		landfill: 0.15, // Example: Landfill generates 0.15 kg CO₂ per kg
		metal: 0.5, // Example: Metal generates 0.5 kg CO₂ per kg
		plastic_hard: 0.4, // Example: Hard plastic generates 0.4 kg CO₂ per kg
		plastic_soft: 0.3, // Example: Soft plastic generates 0.3 kg CO₂ per kg
		wood: 0.01, // Example: Wood generates 0.01 kg CO₂ per kg
	};

	// Calculate emissions for each material
	const emissions = {};
	let totalEmissions = 0;

	for (const material in materials) {
		if (
			materials.hasOwnProperty(material) &&
			emissionsFactors[material] !== undefined
		) {
			// Calculate emissions for the current material
			emissions[material] =
				materials[material] * emissionsFactors[material];
			// Add to the overall total emissions
			totalEmissions += emissions[material];
		}
	}

	// Add the total emissions to the result
	emissions.total = totalEmissions;

	return emissions;
}
