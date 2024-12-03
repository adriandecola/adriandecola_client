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
		const isSendButtonDisabled =
			document.getElementById('send-button').disabled;

		// Prevent sending message if Enter is pressed without the Shift key
		// and ensure the send button is not disabled
		if (event.key === 'Enter' && !event.shiftKey && !isSendButtonDisabled) {
			event.preventDefault(); // Prevent the default action to handle newline or form submission
			sendMessageFromInput(); // Call your function to send the message
		}
	});

document
	.getElementById('message-input')
	.addEventListener('input', updateTextArea);

function sendMessageFromInput() {
	// Disable the send button
	document.getElementById('send-button').disabled = true;

	// Also disable the submit button in the travel details form
	document.getElementById('submit-button').disabled = true;

	const messageInput = document.getElementById('message-input');
	const userMessage = messageInput.value.trim();
	const fileId = messageInput.dataset.fileId || ''; // Retrieve the fileId if it exists

	// Append flight details to user message
	const flightDetails = getFlightDetailsAsString();
	// Use the separator here for server side seperations
	// Can make this more secure later
	const finalMessage = `${userMessage}|||${flightDetails}|||${fileId}`;

	if (userMessage) {
		console.log('Sending message:', finalMessage);
		displayMessage(userMessage, 'user');
		sendMessage(finalMessage);
		getFormData(finalMessage);

		messageInput.value = '';
		updateTextArea();

		// Blur the textarea to hide the mobile keyboard
		messageInput.blur();

		// Clear the fileId after sending the message
		delete messageInput.dataset.fileId;
	}
	// Re-focus on the message input field after sending the message
	messageInput.focus();
}

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
			console.log(
				'Set initial airport to:',
				parsedFormData.initialAirport
			);
		} else {
			console.log(
				'Initial airport not specified or missing in parsedFormData'
			);
		}

		if (
			parsedFormData.finalAirport &&
			parsedFormData.finalAirport !== 'not specified'
		) {
			document.getElementById('to-airport').value =
				parsedFormData.finalAirport;
			console.log('Set final airport to:', parsedFormData.finalAirport);
		} else {
			console.log(
				'Final airport not specified or missing in parsedFormData'
			);
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
				document.getElementById('selected-class').textContent =
					selectedClass;
				console.log('Set flight class to:', selectedClass);
			} else {
				console.log(
					'Flight class specified in parsedFormData not found in options:',
					parsedFormData.flightClass
				);
			}
		} else {
			console.log(
				'Flight class not specified or missing in parsedFormData'
			);
		}
	} catch (error) {
		console.error('Error parsing formData:', error);
	}
}

function updateTextArea() {
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

/* for fosusing the right text box for correct highlighting */
document.addEventListener('DOMContentLoaded', function () {
	const dropBtn = document.getElementById('selected-class');
	const classInputDropdown = document.querySelector('.class-input-dropdown');

	// When the dropdown button is focused, add the 'focused' class to the parent
	dropBtn.addEventListener('focus', function () {
		classInputDropdown.classList.add('focused');
	});

	// When the dropdown button loses focus, remove the 'focused' class from the parent
	dropBtn.addEventListener('blur', function () {
		classInputDropdown.classList.remove('focused');
	});
});

// Event listener to close the dropdown if clicked outside
document.addEventListener('click', function (event) {
	var dropdownContent = document.getElementById('class-options');
	if (event.target.id !== 'selected-class') {
		dropdownContent.style.display = 'none';
	}
});

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
