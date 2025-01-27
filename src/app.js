class ChatApp {
    constructor() {
        this.messages = document.getElementById('messages');
        this.input = document.getElementById('user-input');
        this.setupEventListeners();
    }

    async handleSend() {
        const content = this.input.value.trim();
        if (!content) return;

        this.addMessage('user', content);
        this.input.value = '';

        try {
            const loadingId = this.addMessage('assistant', 'Thinking...');

            const response = await fetch(
                'https://api.github.com/repos/jondoran/boomhauer-bot/actions/workflows/api.yml/dispatches',
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ref: 'main',
                        inputs: {
                            message: content
                        }
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to reach workflow');
            }

            const loadingMessage = document.getElementById(loadingId);
            loadingMessage.textContent = 'Message sent successfully';
        } catch (error) {
            console.error('Error:', error);
            this.addMessage('error', 'Failed to send message: ' + error.message);
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

    setupEventListeners() {
        document.getElementById('send-button').addEventListener('click', () => this.handleSend());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });
    }
}

// Initialize app with GitHub configuration
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp({
        githubRepo: 'jondoran/boomhauer-bot',  // Replace with your GitHub repository
        githubToken: 'your-github-token'    // Replace with your GitHub token
    });
});
