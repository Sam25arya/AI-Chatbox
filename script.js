(function () {
  const log = document.getElementById('log');
  const form = document.getElementById('composer');
  const input = document.getElementById('input');
  const sendBtn = document.getElementById('sendBtn');
  const resetBtn = document.getElementById('resetBtn');

  // 1. Paste your Google AI Studio key here:
  const API_KEY = "AQ.Ab8RN6Lo4xljrFv3qhtYtAmYJtMHe2PD_WS1ss_XI5rTE9Ty2Q";

  const GREETING = "Hiii! I'm Bloom 🌸 What's up?";
  
  // Store full message history so Bloom remembers what you talked about
  let chatHistory = [];

  function addMessage(role, text) {
    const row = document.createElement('div');
    row.className = 'row ' + (role === 'user' ? 'user' : 'bot');
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    row.appendChild(bubble);
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
    return row;
  }

  function showTyping() {
    const row = document.createElement('div');
    row.className = 'row bot';
    row.id = 'typingRow';
    const typing = document.createElement('div');
    typing.className = 'typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    row.appendChild(typing);
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  function hideTyping() {
    const row = document.getElementById('typingRow');
    if (row) row.remove();
  }

  async function generateResponse(userMessage) {
    // Append user input into history format required by Gemini
    chatHistory.push({
      role: "user",
      parts: [{ text: userMessage }]
    });

    // Change this line in your script.js:
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`;
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: "You are Bloom, a warm, cheerful, and friendly AI assistant. Keep responses brief and friendly." }]
        },
        contents: chatHistory
      })
    };

    try {
      const response = await fetch(API_URL, requestOptions);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}`);
      }

      const botReply = data.candidates[0].content.parts[0].text;

      // Save bot response back into history
      chatHistory.push({
        role: "model",
        parts: [{ text: botReply }]
      });

      return botReply;

    } catch (error) {
      console.error("Gemini Error:", error);
      // Remove failed message from history array so user can retry cleanly
      chatHistory.pop();
      return `Error: ${error.message || "Failed to generate response."}`;
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    // Display user bubble
    addMessage('user', text);
    input.value = '';
    autoGrow();
    sendBtn.disabled = true;

    // Display typing dots
    showTyping();

    // Fetch response from Gemini
    const botReply = await generateResponse(text);

    // Hide dots and show reply
    hideTyping();
    addMessage('bot', botReply);
    sendBtn.disabled = false;
    input.focus();
  }

  function autoGrow() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 110) + 'px';
  }

  input.addEventListener('input', autoGrow);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener('submit', handleSend);

  resetBtn.addEventListener('click', function () {
    log.innerHTML = '';
    chatHistory = []; // Reset memory
    addMessage('bot', GREETING);
  });

  // Load Initial Bot Greeting
  addMessage('bot', GREETING);
  input.focus();
})();