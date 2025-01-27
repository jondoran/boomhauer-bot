// src/app.js
class ChatApp {
    constructor() {
        this.messages = document.getElementById('messages');
        this.input = document.getElementById('user-input');
        this.setupEventListeners();
        // Replace with your GitHub repository details
        this.githubRepo = 'YOUR_USERNAME/YOUR_REPO';
        this.githubToken = 'YOUR_PAT_TOKEN'; // We'll set this up next
    }

    async sendToGitHub(content) {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.githubRepo}/dispatches`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${this.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        event_type: 'api-request',
                        client_payload: {
                            message: content
                        }
                    })
                }
            );
            return response.ok;
        } catch (error) {
            console.error('Error:', error);
            return false;
        }
    }

    setupEventListeners() {
        document.getElementById('send-button').addEventListener('click', () => this.handleSend());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });
    }

    async handleSend() {
        const content = this.input.value.trim();
        if (!content) return;

        // Add user message to chat
        this.addMessage('user', content);
        this.input.value = '';

        try {
            // Add loading indicator
            const loadingId = this.addMessage('assistant', '...');

            // In development, we'll just simulate a response
            // Later this will be replaced with actual API call
            await this.simulateResponse(content, loadingId);
        } catch (error) {
            console.error('Error:', error);
            this.addMessage('error', 'Failed to send message');
        }
    }

    addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        messageDiv.textContent = content;
        this.messages.appendChild(messageDiv);
        this.messages.scrollTop = this.messages.scrollHeight;
        return messageDiv.id;
    }

    // Development only - simulate API response
    async simulateResponse(content, loadingId) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const loadingMessage = document.getElementById(loadingId);
        loadingMessage.textContent = `Response to: ${content}`;
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp();
});
