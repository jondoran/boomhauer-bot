class ChatApp {
    constructor() {
        this.messages = document.getElementById('messages');
        this.input = document.getElementById('user-input');
        this.setupEventListeners();
        // Update these with your actual details
        this.githubRepo = 'jondoran/boomhauer-bot';
        // Store token in localStorage or as environment variable
        this.githubToken = process.env.GITHUB_TOKEN || localStorage.getItem('github_token');
    }

    async handleSend() {
        const content = this.input.value.trim();
        if (!content) return;

        // Add user message to chat
        this.addMessage('user', content);
        this.input.value = '';

        try {
            // Add loading indicator
            const loadingId = this.addMessage('assistant', 'Thinking...');

            // Actually send to GitHub
            const success = await this.sendToGitHub(content);

            if (!success) {
                throw new Error('Failed to reach GitHub API');
            }

            // Update loading message
            const loadingMessage = document.getElementById(loadingId);
            loadingMessage.textContent = 'Message sent successfully';
        } catch (error) {
            console.error('Error:', error);
            this.addMessage('error', 'Failed to send message: ' + error.message);
        }
    }

    async sendToGitHub(content) {
        if (!this.githubRepo || !this.githubToken) {
            throw new Error('GitHub configuration missing');
        }

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

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`GitHub API error: ${errorData}`);
            }

            return true;
        } catch (error) {
            console.error('GitHub API Error:', error);
            throw error;
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

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp();
});
