// Configuration
const WORKER_URL = 'https://boomhauer-bot.jon-fb0.workers.dev';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// DOM Elements
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Chat history
let messageHistory = [];

// Helper function to create message elements
function createMessageElement(content, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
    messageDiv.textContent = content;
    return messageDiv;
}

// Helper function to scroll to bottom of chat
function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Function to disable/enable input during processing
function setInputState(disabled) {
    userInput.disabled = disabled;
    sendButton.disabled = disabled;
}

// Function to handle message sending with retries
async function sendMessageWithRetry(messages, retries = MAX_RETRIES) {
    try {
        console.log('Sending request to worker:', messages); // Debug log

        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Worker response not OK:', response.status, errorText); // Debug log
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        const data = await response.json();
        console.log('Worker response:', data); // Debug log

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response format from worker');
        }

        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error in sendMessageWithRetry:', error); // Debug log
        if (retries > 0) {
            console.log(`Retrying... ${retries} attempts left`); // Debug log
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return sendMessageWithRetry(messages, retries - 1);
        }
        throw error;
    }
}

// Function to handle sending messages
async function handleSend() {
    const message = userInput.value.trim();
    if (!message) return;

    // Clear input and disable controls
    userInput.value = '';
    setInputState(true);

    // Add user message to chat
    chatContainer.appendChild(createMessageElement(message, true));
    scrollToBottom();

    // Update message history
    messageHistory.push({ role: 'user', content: message });

    try {
        // Get AI response
        const response = await sendMessageWithRetry(messageHistory);

        // Add AI response to chat
        messageHistory.push({ role: 'assistant', content: response });
        chatContainer.appendChild(createMessageElement(response, false));
        scrollToBottom();
    } catch (error) {
        console.error('Error in handleSend:', error); // Debug log
        const errorMessage = 'Sorry, there was an error processing your message. Please try again.';
        chatContainer.appendChild(createMessageElement(errorMessage, false));
        scrollToBottom();
    } finally {
        setInputState(false);
    }
}

// Event Listeners
sendButton.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

// Initial focus
userInput.focus();
