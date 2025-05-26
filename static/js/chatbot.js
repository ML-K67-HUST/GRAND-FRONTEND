function initializeChat() {
  const chatWindow = document.querySelector('.chat-window');
  const inputField = document.querySelector('.input-area input');
  const sendButton = document.querySelector('.input-area button');

  sendButton.addEventListener('click', handleUserInput);

  inputField.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      handleUserInput();
    }
  });

  loadConversation(window.userID);
  addDateTimeIndicator();
}
function streamBotMessage(message) {
  const chatWindow = document.querySelector('.chat-window');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'bot-message';

  // Gắn trước thẻ <p> rỗng
  const p = document.createElement('p');
  p.textContent = '';
  messageDiv.appendChild(p);
  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  let i = 0;
  let currentText = '';

  const interval = setInterval(() => {
    currentText += message[i];
    p.textContent = currentText; // dùng textContent để tránh Markdown auto-parse
    i++;
    chatWindow.scrollTop = chatWindow.scrollHeight;

    if (i >= message.length) {
      clearInterval(interval);

      // ✅ Sau khi gõ xong thì render Markdown đẹp
      const rendered = marked.parse(currentText);
      p.innerHTML = rendered;
    }
  }, 5); // tốc độ stream
}

async function handleUserInput() {
  const inputField = document.querySelector('.input-area input');
  const userMessage = inputField.value.trim();
  if (userMessage) {
    addMessage(userMessage, true);
    inputField.value = '';

    addTypingIndicator();

    try {
      const response = await fetch(window.AGENT_URL +'/chat/chat_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userid: USERID || 7,
          message: userMessage,
          token: 'string',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      removeTypingIndicator();
      streamBotMessage(data.message); // 👈 dùng fake streaming ở đây
    } catch (error) {
      console.error('Error:', error);
      removeTypingIndicator();
      addMessage('Sorry, there was an error processing your message.');
    }
  }
}


function addMessage(message, isUser = false, shouldSave = true) {
  const chatWindow = document.querySelector('.chat-window');
  const messageDiv = document.createElement('div');
  messageDiv.className = isUser ? 'user-message' : 'bot-message';

  // Sử dụng marked để render markdown nếu là bot
  if (isUser) {
    messageDiv.innerHTML = `<p>${message}</p>`;
  } else {
    const renderedMarkdown = marked.parse(message);
    messageDiv.innerHTML = renderedMarkdown;
  }

  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  if (shouldSave && typeof window.userID !== 'undefined') {
    saveConversation(window.userID);
  }
}


function addTypingIndicator() {
  const chatWindow = document.querySelector('.chat-window');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'bot-message typing-indicator';
  typingDiv.innerHTML =
    '<div class="typing-bubble"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
  chatWindow.appendChild(typingDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTypingIndicator() {
  const typingIndicator = document.querySelector('.typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

function saveConversation(user_id) {
  const chatWindow = document.querySelector('.chat-window');
  const messages = Array.from(chatWindow.children).map((child) => {
    if (child.classList.contains('timestamp')) {
      return { type: 'timestamp', text: child.textContent };
    } else {
      return {
        type: 'message',
        text: child.querySelector('p').textContent,
        isUser: child.classList.contains('user-message'),
      };
    }
  });
  const conversationData = {
    user_id: user_id,
    messages: messages,
  };
  localStorage.setItem(
    `chatConversation_${user_id}`,
    JSON.stringify(conversationData)
  );
}

function loadConversation(user_id) {
  const chatWindow = document.querySelector('.chat-window');
  chatWindow.innerHTML = ''; // Clear existing messages

  fetch(window.BACKEND_URL +'/conversation/query', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userid: USERID })
  })
  .then(response => response.json())
  .then(data => {
    const historyArray = data.history?.[0]?.history || [];

    historyArray.forEach(item => {
      const timestamp = new Date(item.created_at * 1000).toLocaleString();
      
      // timestamp (optional: nếu bạn muốn hiển thị theo từng cặp)
      const dateTimeDiv = document.createElement('div');
      dateTimeDiv.className = 'timestamp';
      dateTimeDiv.textContent = timestamp;
      chatWindow.appendChild(dateTimeDiv);

      // user message
      addMessage(item.user, true, false);
      // assistant response
      addMessage(item.assistant, false, false);
    });
  })
  .catch(error => {
    console.error('Failed to load conversation:', error);
  });
}


function addDateTimeIndicator() {
  const chatWindow = document.querySelector('.chat-window');
  const dateTimeDiv = document.createElement('div');
  dateTimeDiv.className = 'timestamp';
  const now = new Date();
  const options = {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  };
  dateTimeDiv.textContent = now.toLocaleString('en-US', options);

  const firstMessage = chatWindow.querySelector('.bot-message, .user-message');
  if (firstMessage) {
    firstMessage.insertAdjacentElement('afterend', dateTimeDiv);
  } else {
    chatWindow.appendChild(dateTimeDiv);
  }
}