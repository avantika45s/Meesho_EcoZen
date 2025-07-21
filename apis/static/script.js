document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const modal = document.getElementById('expenseForm');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.querySelector('.cancel');
    const form = document.getElementById('expenseFormContent');
    const tableBody = document.getElementById('expenseTableBody');

    // Dark Mode toggle functionality
    darkModeToggle.addEventListener('change', function() {
        document.body.classList.toggle('dark-mode');
        // Optionally, you can save the user's preference for dark mode in localStorage or a cookie
        // and apply it when the page is loaded next time.
    });

    // Show modal
    addExpenseBtn.addEventListener('click', function() {
        modal.style.display = 'block';
    });

    // Close modal
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Close modal on Cancel
    cancelBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Dynamically add rows to the table
    function addRow(item, amount, category, date) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item}</td>
            <td>${amount}</td>
            <td>${category}</td>
            <td>${date}</td>
            <td><button class="edit">Edit</button> <button class="delete">Delete</button></td>
        `;
        tableBody.appendChild(row);
    }

    // Dummy data
    const expenses = [
        { item: 'Groceries', amount: '$50', category: 'Food', date: '2024-03-12' },
        { item: 'Gas', amount: '$30', category: 'Transportation', date: '2024-03-11' }
    ];

    // Populate table with dummy data
    expenses.forEach(expense => {
        addRow(expense.item, expense.amount, expense.category, expense.date);
    });

    // Submit form
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const amount = document.getElementById('amount').value;
        const item = document.getElementById('item').value;
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;
        addRow(item, amount, category, date);
        modal.style.display = 'none';
        form.reset();
    });

    // Event delegation for delete button
    tableBody.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete')) {
            e.target.parentElement.parentElement.remove();
        }
    });

});

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
            if (!conversation) {
                console.error('Conversation element not found!');
                return null;
            }
            
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

        // Main initialization
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM loaded, setting up chatbot...');
            
            // Initialize chatbot
            initializeChatbot();
            
            // Set up chat form handling
            const chatForm = document.getElementById('chat-form');
            const userInput = document.getElementById('userInput');
            const conversation = document.getElementById('conversation');

            console.log('Chat form found:', !!chatForm);
            console.log('User input found:', !!userInput);
            console.log('Conversation found:', !!conversation);

            if (chatForm && userInput) {
                console.log('Setting up chat form event listener');
                
                chatForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    console.log('Chat form submitted');
                    
                    const userMessage = userInput.value.trim();
                    console.log('User message:', userMessage);
                    
                    if (!userMessage) {
                        console.log('No message to send - input is empty');
                        alert('Please enter a message before sending.');
                        return;
                    }

                    console.log('Processing message:', userMessage);

                    // Add user message to conversation immediately
                    addMessageToConversation('user', userMessage);
                    
                    // Clear input
                    userInput.value = '';
                    
                    // Show loading message
                    const loadingId = addMessageToConversation('assistant', 'Thinking...');
                    
                    // Get CSRF token
                    let csrfToken = '';
                    const csrfElement = document.querySelector('[name=csrfmiddlewaretoken]');
                    if (csrfElement) {
                        csrfToken = csrfElement.value;
                        console.log('CSRF token found');
                    } else {
                        console.log('CSRF token not found');
                    }
                    
                    // Submit form data
                    const formData = new FormData();
                    formData.append('user_input', userMessage);
                    if (csrfToken) {
                        formData.append('csrfmiddlewaretoken', csrfToken);
                    }
                    
                    console.log('Sending request to chatbot...');
                    
                    fetch('http://127.0.0.1:8000/chatbot', {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
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
                        
                        addMessageToConversation('assistant', 'Sorry, I encountered a network error. Please try again.');
                    });
                });

                // Allow Enter to submit (with Shift+Enter for new line)
                userInput.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        console.log('Enter key pressed, submitting form');
                        chatForm.dispatchEvent(new Event('submit'));
                    }
                });
            } else {
                console.error('Chat form or input not found!');
                console.error('Available elements:', {
                    'chat-form': document.getElementById('chat-form'),
                    'userInput': document.getElementById('userInput'),
                    'conversation': document.getElementById('conversation'),
                    'myForm': document.getElementById('myForm')
                });
            }

            // Auto-scroll to bottom when new messages are added
            if (conversation) {
                const observer = new MutationObserver(function() {
                    conversation.scrollTop = conversation.scrollHeight;
                });
                observer.observe(conversation, { childList: true });
            }
        });
