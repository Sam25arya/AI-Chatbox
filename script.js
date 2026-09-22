(function () {
  const log = document.getElementById('log');
  const form = document.getElementById('composer');
  const input = document.getElementById('input');
  const sendBtn = document.getElementById('sendBtn');
  const resetBtn = document.getElementById('resetBtn');

  // --- PASTE YOUR KEYS HERE ---
  const GEMINI_API_KEY = "Paste your Gemini API key";
  const GROQ_API_KEY   = "Paste your GROQ API key";   

  const GREETING = "Hiii! I'm Bloom 🌸 What's up?";
  const SYSTEM_INSTRUCTION = "You are Bloom, a warm, cheerful, and friendly AI assistant. Keep responses brief and friendly.";

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

  // --- PROVIDER 1: GEMINI ---
  async function callGemini() {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes("YOUR_")) {
      throw new Error("Gemini Key is missing in script.js");
    }

    const contents = chatHistory.map(item => ({
      role: item.role === 'user' ? 'user' : 'model',
      parts: [{ text: item.content }]
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: contents
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`Gemini Error (${res.status}): ${data.error?.message || res.statusText}`);
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  }

  // --- PROVIDER 2: GROQ ---
  async function callGroq() {
    if (!GROQ_API_KEY || GROQ_API_KEY.includes("YOUR_")) {
      throw new Error("Groq Key is missing in script.js");
    }

    const messages = [
      { role: "system", content: SYSTEM_INSTRUCTION },
      ...chatHistory.map(item => ({
        role: item.role === 'user' ? 'user' : 'assistant',
        content: item.content
      }))
    ];

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      messages: messages,
      max_tokens: 300
    })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`Groq Error (${res.status}): ${data.error?.message || res.statusText}`);
    }

    return data.choices?.[0]?.message?.content;
  }

  // --- PIPELINE WITH DETAILED ERROR DISPLAY ---
  async function generateResponse(userMessage) {
    chatHistory.push({ role: 'user', content: userMessage });

    if (chatHistory.length > 10) {
      chatHistory = chatHistory.slice(-10);
    }

    let geminiErr = "";
    let groqErr = "";

    // 1. Try Gemini
    try {
      const reply = await callGemini();
      if (reply) {
        chatHistory.push({ role: 'assistant', content: reply });
        return reply;
      }
    } catch (err) {
      geminiErr = err.message;
      console.warn("Gemini Failed:", err.message);
    }

    // 2. Try Groq
    try {
      const reply = await callGroq();
      if (reply) {
        chatHistory.push({ role: 'assistant', content: reply });
        return reply;
      }
    } catch (err) {
      groqErr = err.message;
      console.warn("Groq Failed:", err.message);
    }

    // If both fail, print exact causes
    chatHistory.pop();
    return `Error Log:\n1. ${geminiErr}\n2. ${groqErr}`;
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    addMessage('user', text);
    input.value = '';
    autoGrow();
    sendBtn.disabled = true;

    showTyping();

    const botReply = await generateResponse(text);

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
    chatHistory = [];
    addMessage('bot', GREETING);
  });

  addMessage('bot', GREETING);
  input.focus();
})();
