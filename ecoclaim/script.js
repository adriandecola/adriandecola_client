// assistant/script.js

// Global Variable Definitions (could have this passed in functions)
let currentThreadId = null;

// Handles Send Button
document
	.getElementById('bottom-area')
	.addEventListener('submit', function (event) {
		event.preventDefault();
		sendMessageFromInput();
	});

// Handles Submit Button
document
	.getElementById('message-input')
	.addEventListener('keydown', function (event) {
		const isSendButtonDisabled =
			document.getElementById('send-button').disabled;

		/* 
		Prevent sending message if Enter is pressed without the Shift key
		and ensure the send button is not disabled 
		*/
		if (event.key === 'Enter' && !event.shiftKey && !isSendButtonDisabled) {
			event.preventDefault(); // Prevent the default action to handle newline or form submission
			sendMessageFromInput(); // Call your function to send the message
		}
	});

// Handles Changes to message input
document
	.getElementById('message-input')
	.addEventListener('input', updateMessageInput);

function sendMessageFromInput() {
	// Disable the send button
	document.getElementById('send-button').disabled = true;

	// Also disable the submit button in the travel details form
	document.getElementById('submit-button').disabled = true;

	// Get the message
	const messageInput = document.getElementById('message-input');
	const userMessage = messageInput.value.trim();

	// Append material details to user message
	const flightDetails = getFlightDetailsAsString();
	// Use the separator here for server side seperations
	// Can make this more secure later
	const finalMessage = `${userMessage}|||${flightDetails}|||`;

	if (userMessage) {
		console.log('Sending message:', finalMessage);
		displayMessage(userMessage, 'user');
		sendMessage(finalMessage);
		getFormData(finalMessage);

		messageInput.value = '';
		updateMessageInput();

		// Blur the textarea to hide the mobile keyboard
		messageInput.blur();

		// Clear the fileId after sending the message
		delete messageInput.dataset.fileId;
	}
	// Re-focus on the message input field after sending the message
	messageInput.focus();
}

function updateMessageInput() {
	const messageInput = document.getElementById('message-input');
	let words = messageInput.value.split(/\s+/).filter(Boolean);

	if (words.length > 150) {
		words = words.slice(0, 150);
		messageInput.value = words.join(' ');
	}

	document.getElementById('word-count').textContent = `${words.length}/150`;
}

function displayMessage(message, role) {
	console.log('Displaying message:', message, 'Role:', role);
	const messagesContainer = document.getElementById('scrollable-messages');

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
		// For debugging
		console.log(response);

		// Getting response data in JSON format
		const responseData = await response.json();

		// Update the currentThreadId (if one was created)
		currentThreadId = responseData.threadId;

		// If the form was filled, update the company details // from chat completion gpt
		if (responseData.formData) {
			updateCompanyDetails(responseData.formData);
		}

		//If form data was filled from flight function, update the travel details
		if (responseData.flightFormData) {
			updateFlightDetails(
				responseData.flightFormData,
				responseData.flightEmissions
			);
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

function removeLoadingMessage(loadingMessageId) {
	const loadingMessage = document.getElementById(loadingMessageId);
	if (loadingMessage) {
		clearInterval(loadingMessage.ellipsisInterval);
		loadingMessage.remove();
	}
}

/////////////////////// Handles the submit button ///////////////////////
function submitFunction() {
	// For error highlighting
	let isFormValid = true;

	// Reset error states
	document.querySelectorAll('.error-highlight').forEach((element) => {
		element.classList.remove('error-highlight');
	});

	const errorMessageDiv = document.getElementById('error-message');
	errorMessageDiv.style.display = 'none'; // Hide error message by default

	// Input validation checks
	const travelTypeChecked = document.querySelector(
		'input[name="travel"]:checked'
	);
	const fromAirport = document.getElementById('from-airport');
	const toAirport = document.getElementById('to-airport');
	const passengers = document.getElementById('passengers');
	const selectedClassText =
		document.getElementById('selected-class').textContent;

	if (!travelTypeChecked) {
		document.querySelector('#travel-type').classList.add('error-highlight');
		isFormValid = false;
	}
	if (fromAirport.value.trim() === '') {
		fromAirport.classList.add('error-highlight');
		isFormValid = false;
	}
	if (toAirport.value.trim() === '') {
		toAirport.classList.add('error-highlight');
		isFormValid = false;
	}
	if (parseInt(passengers.value, 10) < 1 || passengers.value.trim() === '') {
		passengers.classList.add('error-highlight');
		isFormValid = false;
	}
	if (
		selectedClassText === 'Select Class' ||
		selectedClassText.trim() === ''
	) {
		document
			.querySelector('.class-input-dropdown')
			.classList.add('error-highlight');
		isFormValid = false;
	}

	// Show error message if form is invalid
	if (!isFormValid) {
		errorMessageDiv.textContent =
			'Please fill out all aspects of your flight before submitting.';
		errorMessageDiv.style.display = 'block'; // Make the error message visible
	} else {
		// Sending message...
		// Construct the request message with CO2 in subscript
		const co2RequestMessage =
			'Can you calculate the CO<sub>2</sub> emissions for my flight?';

		// Append flight details to the request message
		const flightDetails = getFlightDetailsAsString();
		const finalMessage = `${co2RequestMessage}|||${flightDetails}`;

		// Use displayMessage to show the request in the chat
		displayMessage(co2RequestMessage, 'user');

		// Send the finalMessage to the backend for processing
		sendMessage(finalMessage);

		// No need go get form data since its filled out

		console.log('CO2 Emissions request sent:', finalMessage);
	}
}

///////////////////////////// Other helper functions ///////////////////////////////////////
function updateCompanyDetails(formData) {
	// This is a relic, still here for compiliation
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

	// Handle LaTeX-like syntax for equations
	htmlText = htmlText.replace(/\\\((.*?)\\\)/g, (match, equation) => {
		// Replace LaTeX equation markers with MathJax delimiters
		return `\\(${equation}\\)`; // Inline equations
	});

	return htmlText;
}
