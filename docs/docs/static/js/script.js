class AIWebInterface {
    constructor() {
        this.baseURL = window.location.origin;
        this.sessionId = 'default';
        this.currentSession = 'default';
        this.isLearningMode = false;
        this.currentQuestion = null;
        this.isTyping = false;
        
        this.initElements();
        this.initEventListeners();
        this.initApp();
    }
    
    initElements() {
        // Core elements
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.chatMessages = document.getElementById('chatMessages');
        this.aiName = document.getElementById('aiName');
        this.learnedCount = document.getElementById('learnedCount');
        this.totalKnowledge = document.getElementById('totalKnowledge');
        this.statusDot = document.getElementById('statusDot');
        this.statusText = document.getElementById('statusText');
        this.currentTime = document.getElementById('currentTime');
        this.welcomeTime = document.getElementById('welcomeTime');
        
        // Buttons
        this.newChatBtn = document.getElementById('newChatBtn');
        this.teachBtn = document.getElementById('teachBtn');
        this.commandsBtn = document.getElementById('commandsBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.micBtn = document.getElementById('micBtn');
        this.attachBtn = document.getElementById('attachBtn');
        
        // Modals
        this.teachModal = document.getElementById('teachModal');
        this.commandsModal = document.getElementById('commandsModal');
        this.saveTeachingBtn = document.getElementById('saveTeaching');
        this.teachQuestion = document.getElementById('teachQuestion');
        this.teachAnswer = document.getElementById('teachAnswer');
        
        // Sidebar
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.closeSidebar = document.getElementById('closeSidebar');
        this.sessionsList = document.getElementById('sessionsList');
        this.questionsList = document.getElementById('questionsList');
        
        // Hints
        this.learningModeHint = document.getElementById('learningModeHint');
        
        // Set welcome time
        if (this.welcomeTime) {
            this.welcomeTime.textContent = this.formatTime(new Date());
        }
    }
    
    initEventListeners() {
        // Send message
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
        });
        
        // Clear input
        this.clearBtn.addEventListener('click', () => {
            this.messageInput.value = '';
            this.messageInput.style.height = 'auto';
            this.messageInput.focus();
        });
        
        // Buttons
        this.newChatBtn.addEventListener('click', () => this.newChat());
        this.teachBtn.addEventListener('click', () => this.openTeachModal());
        this.commandsBtn.addEventListener('click', () => this.openCommandsModal());
        
        // Modal controls
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                this.closeModal(modal);
            });
        });
        
        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
        
        // Save teaching
        if (this.saveTeachingBtn) {
            this.saveTeachingBtn.addEventListener('click', () => this.saveTeaching());
        }
        
        // Sidebar controls
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        if (this.closeSidebar) {
            this.closeSidebar.addEventListener('click', () => this.closeSidebarFunc());
        }
        
        // Session switching
        this.sessionsList.addEventListener('click', (e) => {
            const sessionItem = e.target.closest('.session-item');
            if (sessionItem && sessionItem.dataset.session) {
                this.switchSession(sessionItem.dataset.session);
            }
        });
        
        // Update time every minute
        setInterval(() => this.updateTime(), 60000);
    }
    
    async initApp() {
        // Check connection
        await this.checkConnection();
        
        // Load AI stats
        await this.loadAIStats();
        
        // Load initial chat history
        await this.loadChatHistory();
        
        // Update time
        this.updateTime();
        
        // Focus input
        this.messageInput.focus();
    }
    
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseURL}/ai/stats`);
            if (response.ok) {
                this.setConnectionStatus(true);
            } else {
                this.setConnectionStatus(false);
            }
        } catch (error) {
            this.setConnectionStatus(false);
            console.error('Connection check failed:', error);
        }
    }
    
    setConnectionStatus(connected) {
        if (connected) {
            this.statusDot.classList.add('connected');
            this.statusText.textContent = 'Connected to AI';
        } else {
            this.statusDot.classList.remove('connected');
            this.statusText.textContent = 'Disconnected';
        }
    }
    
    async loadAIStats() {
        try {
            const response = await fetch(`${this.baseURL}/ai/stats`);
            if (response.ok) {
                const data = await response.json();
                this.aiName.textContent = data.name || 'AI Assistant';
                this.learnedCount.textContent = data.learned_questions || 0;
                this.totalKnowledge.textContent = data.total_knowledge || 0;
            }
        } catch (error) {
            console.error('Failed to load AI stats:', error);
        }
    }
    
    async loadChatHistory() {
        try {
            const response = await fetch(`${this.baseURL}/session/${this.sessionId}/history`);
            if (response.ok) {
                const data = await response.json();
                if (data.messages && data.messages.length > 0) {
                    // Clear welcome message
                    this.chatMessages.innerHTML = '';
                    
                    // Add messages
                    data.messages.forEach(msg => {
                        this.addMessage(msg.content, msg.type, msg.time);
                    });
                    
                    // Scroll to bottom
                    this.scrollToBottom();
                }
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Clear input
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            const response = await fetch(`${this.baseURL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    session_id: this.sessionId
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Remove typing indicator
                this.removeTypingIndicator();
                
                // Add AI response
                this.addMessage(data.response, 'ai');
                
                // Check if AI is in learning mode
                if (data.response.includes("teach me") || data.response.includes("I don't know")) {
                    this.isLearningMode = true;
                    this.currentQuestion = message;
                    this.learningModeHint.style.display = 'flex';
                } else {
                    this.isLearningMode = false;
                    this.currentQuestion = null;
                    this.learningModeHint.style.display = 'none';
                }
                
                // Update stats
                await this.loadAIStats();
                
                // Scroll to bottom
                this.scrollToBottom();
            } else {
                throw new Error('Failed to get response');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.removeTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'ai');
        }
    }
    
    addMessage(content, type, timestamp = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const time = timestamp || new Date().toISOString();
        const formattedTime = this.formatTime(new Date(time));
        
        const avatarIcon = type === 'user' ? 'fas fa-user' : 'fas fa-robot';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="${avatarIcon}"></i>
            </div>
            <div class="message-content">
                <div class="message-text">
                    ${this.formatMessageContent(content)}
                </div>
                <div class="message-time">${formattedTime}</div>
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    formatMessageContent(content) {
        // Convert line breaks to <br>
        let formatted = content.replace(/\n/g, '<br>');
        
        // Convert URLs to links
        formatted = formatted.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        
        // Convert markdown-style bold
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        return formatted;
    }
    
    showTypingIndicator() {
        this.isTyping = true;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message typing-indicator';
        typingDiv.id = 'typingIndicator';
        
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-text">
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }
    
    removeTypingIndicator() {
        this.isTyping = false;
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    async newChat() {
        try {
            const response = await fetch(`${this.baseURL}/session/new`, {
                method: 'POST'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.sessionId = data.session_id;
                this.currentSession = data.session_id;
                
                // Clear chat
                this.chatMessages.innerHTML = '';
                
                // Add welcome message
                this.addWelcomeMessage();
                
                // Update sessions list
                this.addSessionToList(data.session_id);
                
                // Update stats
                await this.loadAIStats();
            }
        } catch (error) {
            console.error('Error creating new chat:', error);
        }
    }
    
    addSessionToList(sessionId) {
        const sessionItem = document.createElement('div');
        sessionItem.className = 'session-item';
        sessionItem.dataset.session = sessionId;
        
        // Format session name
        const sessionName = sessionId === 'default' ? 'Current Chat' : 
                           `Chat ${sessionId.split('_').slice(1, 3).join(' ')}`;
        
        sessionItem.innerHTML = `
            <i class="fas fa-comment"></i>
            <span>${sessionName}</span>
        `;
        
        // Remove active class from all
        document.querySelectorAll('.session-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to new item
        sessionItem.classList.add('active');
        
        this.sessionsList.appendChild(sessionItem);
    }
    
    async switchSession(sessionId) {
        this.sessionId = sessionId;
        this.currentSession = sessionId;
        
        // Update active class
        document.querySelectorAll('.session-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.session === sessionId) {
                item.classList.add('active');
            }
        });
        
        // Load session history
        await this.loadChatHistory();
    }
    
    openTeachModal() {
        this.teachModal.classList.add('active');
        this.teachQuestion.focus();
    }
    
    openCommandsModal() {
        this.commandsModal.classList.add('active');
    }
    
    closeModal(modal) {
        modal.classList.remove('active');
        
        // Clear form if it's the teach modal
        if (modal === this.teachModal) {
            this.teachQuestion.value = '';
            this.teachAnswer.value = '';
        }
    }
    
    async saveTeaching() {
        const question = this.teachQuestion.value.trim();
        const answer = this.teachAnswer.value.trim();
        
        if (!question || !answer) {
            alert('Please enter both a question and an answer');
            return;
        }
        
        try {
            const response = await fetch(`${this.baseURL}/ai/learn`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: question,
                    answer: answer
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                alert(data.message || 'AI learned successfully!');
                
                // Close modal
                this.closeModal(this.teachModal);
                
                // Update stats
                await this.loadAIStats();
                
                // Add a system message to chat
                this.addMessage(`I just learned something new! You can now ask me: "${question}"`, 'ai');
            } else {
                throw new Error('Failed to teach AI');
            }
        } catch (error) {
            console.error('Error teaching AI:', error);
            alert('Failed to teach AI. Please try again.');
        }
    }
    
    toggleSidebar() {
        this.sidebar.classList.toggle('active');
    }
    
    closeSidebarFunc() {
        this.sidebar.classList.remove('active');
    }
    
    addWelcomeMessage() {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'message ai-message';
        
        const currentTime = this.formatTime(new Date());
        
        welcomeDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-text">
                    <p>Hello! I'm your AI Assistant. I can answer questions, perform calculations, tell time, and learn from you! Ask me anything, and if I don't know, I'll ask you to teach me.</p>
                    <p><strong>Try asking:</strong></p>
                    <ul class="suggestion-list">
                        <li>"What time is it?"</li>
                        <li>"Calculate 15 + 27"</li>
                        <li>"What can you do?"</li>
                        <li>Anything you want me to learn!</li>
                    </ul>
                </div>
                <div class="message-time">${currentTime}</div>
            </div>
        `;
        
        this.chatMessages.appendChild(welcomeDiv);
    }
    
    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    updateTime() {
        if (this.currentTime) {
            const now = new Date();
            this.currentTime.textContent = now.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aiApp = new AIWebInterface();
});