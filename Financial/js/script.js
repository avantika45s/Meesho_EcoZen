const expensebtn= document.getElementById('submitExpense');
if (expensebtn) {
    expensebtn.addEventListener('click', function() {
        // Collect form data
        const formData = new FormData(document.getElementById('addExpenseForm'));

        // Make a POST request using Fetch API
        fetch('http://127.0.0.1:8000/add', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                // Clear form fields
                document.getElementById('item').value = '';
                document.getElementById('amount').value = '';
                document.getElementById('category').selectedIndex = 0;
                document.getElementById('date').value = '';

                // Display success message
                document.getElementById('message').innerHTML = '<div class="alert alert-success" role="alert">Expense added successfully!</div>';
            } else {
                // Display error message
                document.getElementById('message').innerHTML = '<div class="alert alert-danger" role="alert">Failed to add expense. Please try again.</div>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });
}

const yesButton = document.getElementById("yesButton");
if (yesButton) {
    yesButton.addEventListener("click", function() {
        window.open("http://127.0.0.1:8000/comparepredict", "_blank");
        hideConfirmation();
    });
}

const noButton = document.getElementById("noButton");
if (noButton) {
    noButton.addEventListener("click", function() {
        hideConfirmation();
    });
}

function hideConfirmation() {
    const confirmationMessage = document.getElementById("confirmationMessage");
    const yesButton = document.getElementById("yesButton");
    const noButton = document.getElementById("noButton");
    
    if (confirmationMessage) confirmationMessage.style.display = "none";
    if (yesButton) yesButton.style.display = "none";
    if (noButton) noButton.style.display = "none";
}

// Chatbot functionality
let chatFormVisible = false;

function openForm() {
    const chatForm = document.getElementById('myForm');
    const userInput = document.getElementById('userInput');
    
    if (chatForm) {
        chatFormVisible = !chatFormVisible;
        chatForm.style.display = chatFormVisible ? 'block' : 'none';
        
        if (chatFormVisible && userInput) {
            setTimeout(() => userInput.focus(), 100);
        }
    }
}

function closeForm() {
    const chatForm = document.getElementById('myForm');
    if (chatForm) {
        chatForm.style.display = 'none';
        chatFormVisible = false;
    }
}

function addMessageToConversation(role, message) {
    const conversation = document.getElementById('conversation');
    if (!conversation) return null;
    
    const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    
    if (role === 'user') {
        messageDiv.className = 'user-messages';
        messageDiv.style.cssText = 'background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%); color: white; padding: 12px 16px; margin: 8px 0; border-radius: 12px 12px 4px 12px; font-weight: 500;';
        messageDiv.innerHTML = '<strong>You:</strong> ' + escapeHtml(message);
    } else {
        messageDiv.className = 'chatbot-messages';
        messageDiv.style.cssText = 'background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.9); padding: 12px 16px; margin: 8px 0; border-radius: 12px 12px 12px 4px; border: 1px solid rgba(255, 255, 255, 0.2);';
        messageDiv.innerHTML = '<strong>EcoZen AI:</strong> ' + escapeHtml(message);
    }
    
    conversation.appendChild(messageDiv);
    conversation.scrollTop = conversation.scrollHeight;
    
    return messageId;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function initializeChatbot() {
    console.log('Initializing chatbot...');
    
    // Initialize conversation if it doesn't exist
    fetch('http://127.0.0.1:8000/chatbot', {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        }
    })
    .then(response => {
        if (response.ok) {
            console.log('Chatbot initialized successfully');
        }
    })
    .catch(error => {
        console.log('Chatbot initialization error:', error);
    });
}

// Call initialization when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up chatbot...');
    
    // Initialize chatbot
    initializeChatbot();
    
    // Set up chat form handling
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('userInput');
    const conversation = document.getElementById('conversation');

    if (chatForm) {
        console.log('Chat form found, setting up event listener');
        
        chatForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Chat form submitted');
            
            const userMessage = userInput.value.trim();
            if (!userMessage) {
                console.log('No message to send');
                return;
            }

            console.log('Sending message:', userMessage);

            // Add user message to conversation immediately
            addMessageToConversation('user', userMessage);
            
            // Clear input
            userInput.value = '';
            
            // Show loading message
            const loadingId = addMessageToConversation('assistant', 'Thinking...');
            
            // Get CSRF token with fallback
            let csrfToken = '';
            const csrfElement = document.querySelector('[name=csrfmiddlewaretoken]');
            if (csrfElement) {
                csrfToken = csrfElement.value;
            } else {
                // Try to get from cookie as fallback
                const cookieValue = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('csrftoken='))
                    ?.split('=')[1];
                csrfToken = cookieValue || '';
            }
            
            // Submit form data
            const formData = new FormData();
            formData.append('user_input', userMessage);
            if (csrfToken) {
                formData.append('csrfmiddlewaretoken', csrfToken);
            }
            
            fetch('http://127.0.0.1:8000/chatbot', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken && { 'X-CSRFToken': csrfToken })
                }
            })
            .then(response => {
                console.log('Response status:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Response data:', data);
                
                // Remove loading message
                const loadingMsg = document.getElementById(loadingId);
                if (loadingMsg) loadingMsg.remove();
                
                if (data.success) {
                    addMessageToConversation('assistant', data.response);
                } else {
                    addMessageToConversation('assistant', 'Sorry, I encountered an error: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
                
                // Remove loading message
                const loadingMsg = document.getElementById(loadingId);
                if (loadingMsg) loadingMsg.remove();
                
                addMessageToConversation('assistant', 'Sorry, I encountered a network error. Please check your connection and try again.');
            });
        });

        // Allow Enter to submit (with Shift+Enter for new line)
        if (userInput) {
            userInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    chatForm.dispatchEvent(new Event('submit'));
                }
            });
        }
    } else {
        console.error('Chat form not found! Make sure the HTML template includes the chat form.');
        // Try to find it again after a short delay
        setTimeout(() => {
            const delayedChatForm = document.getElementById('chat-form');
            if (delayedChatForm) {
                console.log('Found chat form on retry, setting up...');
                // Re-run the setup
                window.location.reload();
            }
        }, 1000);
    }

    // Auto-scroll to bottom when new messages are added
    if (conversation) {
        const observer = new MutationObserver(function() {
            conversation.scrollTop = conversation.scrollHeight;
        });
        observer.observe(conversation, { childList: true });
    }
});