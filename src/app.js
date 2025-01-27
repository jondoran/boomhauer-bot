class ChatApp {
    constructor(config) {
        this.messages = document.getElementById('messages');
        this.input = document.getElementById('user-input');
        this.githubToken = config.githubToken; // Add this line
        this.githubRepo = config.githubRepo;   // Add this line
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
                `https://api.github.com/repos/${this.githubRepo}/dispatches`, // Use template literal
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.githubToken}`,  // Use class property
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
                throw new Error('Failed to reach GitHub API');
            }

            const loadingMessage = document.getElementById(loadingId);
            loadingMessage.textContent = 'Message sent successfully';
        } catch (error) {
            console.error('Error:', error);
            this.addMessage('error', 'Failed to send message: ' + error.message);
        }

        const startTime = new Date().toISOString();
        let attempts = 0;
        const maxAttempts = 30;
    
        const checkInterval = setInterval(async () => {
            attempts++;
            const response = await this.checkResponse(
                owner,
                repo,
                startTime
            );
    
            if (response) {
                clearInterval(checkInterval);
                const loadingMessage = document.getElementById(loadingId);
                loadingMessage.textContent = response;
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                this.addMessage('error', 'Timeout waiting for response');
            }
        }, 2000);
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

async function checkResponse(owner, repo, since) {
    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues?since=${since}&sort=created&direction=desc`,
        {
            headers: {
                'Authorization': `Bearer ${this.githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
            }
        }
    );

    if (response.ok) {
        const issues = await response.json();
        if (issues.length > 0) {
            return issues[0].body;
        }
    }
    return null;
}
