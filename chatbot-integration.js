// chatbot-integration.js
function loadChatbot() {
    // Create chatbot container
    const chatbotContainer = document.createElement('div');
    chatbotContainer.className = 'chatbot-container';
    chatbotContainer.innerHTML = `
        <button class="chatbot-button" id="chatbot-toggle">
            <i class="fas fa-robot"></i>
        </button>
        
        <div class="chatbot-window" id="chatbot-window">
            <div class="chatbot-header">
                <div class="chatbot-title">
                    <div class="chatbot-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <h3>KhetSathi Assistant</h3>
                </div>
                <button class="chatbot-close" id="chatbot-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="chatbot-messages" id="chatbot-messages">
                <div class="message bot">
                    Hello! I'm your KhetSathi assistant. How can I help you with sustainable farming today?
                </div>
            </div>
            
            <div class="quick-questions" id="quick-questions">
                <button class="quick-question" data-question="What is KhetSathi?">What is KhetSathi?</button>
                <button class="quick-question" data-question="How do I rent equipment?">How do I rent equipment?</button>
                <button class="quick-question" data-question="How to sell byproducts?">How to sell byproducts?</button>
                <button class="quick-question" data-question="What are GreenPoints?">What are GreenPoints?</button>
            </div>
            
            <div class="chatbot-input">
                <input type="text" id="chatbot-input" placeholder="Type your message...">
                <button class="chatbot-send" id="chatbot-send">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;

    // Add styles
    const styles = `
        .chatbot-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .chatbot-button {
            width: 60px;
            height: 60px;
            background: #2e7d32;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            border: none;
            color: white;
        }

        .chatbot-button:hover {
            transform: scale(1.1);
            background: #1b5e20;
        }

        .chatbot-button i {
            font-size: 24px;
        }

        .chatbot-window {
            position: absolute;
            bottom: 70px;
            right: 0;
            width: 350px;
            height: 500px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 5px 25px rgba(0, 0, 0, 0.15);
            display: none;
            flex-direction: column;
            overflow: hidden;
        }

        .chatbot-window.active {
            display: flex;
        }

        .chatbot-header {
            background: #2e7d32;
            color: white;
            padding: 15px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .chatbot-title {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .chatbot-title h3 {
            margin: 0;
            font-size: 16px;
        }

        .chatbot-avatar {
            width: 30px;
            height: 30px;
            background: #4caf50;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .chatbot-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 18px;
        }

        .chatbot-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .message {
            max-width: 80%;
            padding: 12px 15px;
            border-radius: 18px;
            font-size: 14px;
            line-height: 1.4;
        }

        .message.bot {
            background: #f1f1f1;
            align-self: flex-start;
            border-bottom-left-radius: 5px;
        }

        .message.user {
            background: #2e7d32;
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 5px;
        }

        .quick-questions {
            padding: 15px 20px;
            border-top: 1px solid #eee;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-height: 150px;
            overflow-y: auto;
        }

        .quick-question {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 20px;
            padding: 8px 15px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.3s;
            text-align: left;
        }

        .quick-question:hover {
            background: #e9ecef;
        }

        .chatbot-input {
            padding: 15px 20px;
            border-top: 1px solid #eee;
            display: flex;
            gap: 10px;
        }

        .chatbot-input input {
            flex: 1;
            padding: 10px 15px;
            border: 1px solid #ddd;
            border-radius: 20px;
            font-size: 14px;
            outline: none;
        }

        .chatbot-input input:focus {
            border-color: #2e7d32;
        }

        .chatbot-send {
            background: #2e7d32;
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.3s;
        }

        .chatbot-send:hover {
            background: #1b5e20;
        }

        .typing-indicator {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 12px 15px;
            background: #f1f1f1;
            border-radius: 18px;
            align-self: flex-start;
            border-bottom-left-radius: 5px;
        }

        .typing-dot {
            width: 8px;
            height: 8px;
            background: #999;
            border-radius: 50%;
            animation: typing 1.4s infinite;
        }

        .typing-dot:nth-child(2) {
            animation-delay: 0.2s;
        }

        .typing-dot:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes typing {
            0%, 60%, 100% {
                transform: translateY(0);
                opacity: 0.4;
            }
            30% {
                transform: translateY(-10px);
                opacity: 1;
            }
        }

        @media (max-width: 768px) {
            .chatbot-window {
                width: 300px;
                height: 450px;
            }
            
            .chatbot-container {
                bottom: 10px;
                right: 10px;
            }
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Add to body
    document.body.appendChild(chatbotContainer);

    // Initialize chatbot functionality
    initializeChatbot();
}

function initializeChatbot() {
    // Chatbot knowledge base
    const knowledgeBase = {
        "what is khetsathi": "KhetSathi is a sustainable farming platform that helps farmers turn farm waste and idle equipment into wealth. We provide equipment sharing, byproducts marketplace, educational quizzes, and GreenPoints rewards to promote eco-friendly farming practices.",
        
        "how do i rent equipment": "To rent equipment:\n1. Go to the Equipment page\n2. Browse available equipment from other farmers\n3. Click 'Rent Now' on the equipment you need\n4. Contact the owner to arrange pickup/delivery\n5. Enjoy using shared equipment and saving money!",
        
        "how to sell byproducts": "To sell byproducts:\n1. Visit the ByProducts page\n2. Click 'Sell ByProduct' button\n3. Fill in details (name, description, price, quantity)\n4. Upload photos if available\n5. List your byproduct for other farmers to purchase",
        
        "what are greenpoints": "GreenPoints are reward points you earn for sustainable actions:\n• Listing equipment: 10 points\n• Selling byproducts: 15 points\n• Completing quizzes: 5 points per 10% score\n• Renting equipment: 5 points\nPoints can be redeemed for discounts and premium features!",
        
        "how to earn more greenpoints": "Earn GreenPoints by:\n• Sharing equipment with other farmers\n• Selling agricultural byproducts\n• Completing educational quizzes\n• Renting instead of buying equipment\n• Participating in community activities",
        
        "what equipment can i share": "You can share various agricultural equipment:\n• Tractors and trailers\n• Rotavators and tillers\n• Harvesting equipment\n• Irrigation systems\n• Sprayers and dusters\n• Any farm tool that others might need",
        
        "what byproducts can i sell": "Common byproducts to sell:\n• Rice husk and straw\n• Sugarcane bagasse\n• Coconut shells and husks\n• Banana stems and leaves\n• Crop residues\n• Animal manure for composting",
        
        "how does equipment sharing work": "Equipment sharing works through our platform:\n1. List your idle equipment for rent\n2. Other farmers browse and rent it\n3. You earn money from rentals\n4. Renters save money vs buying\n5. Everyone contributes to reducing waste",
        
        "is there any fee": "KhetSathi is free for basic use! We only charge a small service fee (5%) on successful equipment rentals and byproduct sales to maintain the platform. There are no subscription fees.",
        
        "how to contact support": "You can contact our support team:\n• Email: support@khetsathi.com\n• Phone: +1 (555) 123-4567\n• Community Chat: Visit the Community page\n• Help Center: Available in your profile",
        
        "what is sustainable farming": "Sustainable farming involves practices that:\n• Protect environment and biodiversity\n• Conserve water and soil resources\n• Reduce chemical inputs\n• Promote crop rotation\n• Utilize renewable resources\n• Minimize waste through recycling",
        
        "how to get started": "Getting started is easy:\n1. Create your free account\n2. Complete your profile\n3. Browse equipment or byproducts\n4. List your own items if available\n5. Start earning and learning!",
        
        "default": "I'm not sure I understand. Could you please rephrase your question? You can ask me about:\n• Equipment sharing\n• Byproducts marketplace\n• GreenPoints rewards\n• Sustainable farming\n• Account help"
    };

    // DOM elements
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSend = document.getElementById('chatbot-send');
    const quickQuestions = document.getElementById('quick-questions');

    // Toggle chatbot window
    chatbotToggle.addEventListener('click', () => {
        chatbotWindow.classList.toggle('active');
    });

    chatbotClose.addEventListener('click', () => {
        chatbotWindow.classList.remove('active');
    });

    // Send message function
    function sendMessage() {
        const message = chatbotInput.value.trim();
        if (!message) return;

        // Add user message
        addMessage(message, 'user');
        chatbotInput.value = '';

        // Show typing indicator
        showTypingIndicator();

        // Simulate AI response delay
        setTimeout(() => {
            removeTypingIndicator();
            const response = getAIResponse(message);
            addMessage(response, 'bot');
        }, 1000 + Math.random() * 1000);
    }

    // Quick question handler
    quickQuestions.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-question')) {
            const question = e.target.getAttribute('data-question');
            addMessage(question, 'user');
            
            showTypingIndicator();
            setTimeout(() => {
                removeTypingIndicator();
                const response = getAIResponse(question);
                addMessage(response, 'bot');
            }, 1000);
        }
    });

    // Send button click
    chatbotSend.addEventListener('click', sendMessage);

    // Enter key press
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Add message to chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.textContent = text;
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        chatbotMessages.appendChild(typingDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    // Remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Get AI response
    function getAIResponse(question) {
        const lowerQuestion = question.toLowerCase().trim();
        
        // Exact match
        if (knowledgeBase[lowerQuestion]) {
            return knowledgeBase[lowerQuestion];
        }

        // Keyword matching
        const keywords = {
            'equipment': 'how do i rent equipment',
            'rent': 'how do i rent equipment',
            'share': 'how do i rent equipment',
            'byproduct': 'how to sell byproducts',
            'sell': 'how to sell byproducts',
            'market': 'how to sell byproducts',
            'greenpoint': 'what are greenpoints',
            'reward': 'what are greenpoints',
            'point': 'what are greenpoints',
            'sustainable': 'what is sustainable farming',
            'eco': 'what is sustainable farming',
            'environment': 'what is sustainable farming',
            'fee': 'is there any fee',
            'cost': 'is there any fee',
            'price': 'is there any fee',
            'support': 'how to contact support',
            'help': 'how to contact support',
            'contact': 'how to contact support',
            'start': 'how to get started',
            'begin': 'how to get started',
            'create': 'how to get started'
        };

        for (const [keyword, responseKey] of Object.entries(keywords)) {
            if (lowerQuestion.includes(keyword)) {
                return knowledgeBase[responseKey];
            }
        }

        // Default response
        return knowledgeBase.default;
    }
}

// Load chatbot when page loads
document.addEventListener('DOMContentLoaded', loadChatbot);