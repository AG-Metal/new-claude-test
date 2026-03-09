/* ═══════════════════════════════════════════════════════════════════════════
   CONFIG — edit these before deploying
   ═══════════════════════════════════════════════════════════════════════════ */
const CONFIG = {
  WEBHOOK_URL: '/api/chat',
  SESSION_ID:  'session_' + Math.random().toString(36).slice(2, 11),
  TYPEWRITER_SPEED_MS: 18,   // ms per character for bot responses
  BOOT_LINE_DELAY_MS:  420,  // ms between boot sequence lines
};

/* ═══════════════════════════════════════════════════════════════════════════
   BOOT SEQUENCE LINES
   ═══════════════════════════════════════════════════════════════════════════ */
const BOOT_LINES = [
  'BIOS v2.31 ... OK',
  'INITIALIZING MEMORY BANKS ...',
  'LOADING KERNEL MODULES ... DONE',
  'ESTABLISHING SECURE LINK ...',
  'ENCRYPTION LAYER ACTIVE',
  'NEURAL INTERFACE READY',
  '─────────────────────────────',
  'SYSTEM BOOT COMPLETE',
  'SESSION ID: ' + CONFIG.SESSION_ID,
  '─────────────────────────────',
  'TYPE YOUR MESSAGE TO BEGIN.',
];

/* ═══════════════════════════════════════════════════════════════════════════
   DOM REFERENCES
   ═══════════════════════════════════════════════════════════════════════════ */
const canvas      = document.getElementById('matrix-rain');
const ctx         = canvas.getContext('2d');
const messageArea = document.getElementById('message-area');
const userInput   = document.getElementById('user-input');
const sendBtn     = document.getElementById('send-btn');

/* ═══════════════════════════════════════════════════════════════════════════
   DIGITAL RAIN CANVAS
   ═══════════════════════════════════════════════════════════════════════════ */
const RAIN_CHARS =
  'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプ' +
  'エェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';

const FONT_SIZE = 14;
let columns, drops;

function initRain() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  columns = Math.floor(canvas.width / FONT_SIZE);
  drops   = Array.from({ length: columns }, () => Math.random() * -50);
}

function drawRain() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = FONT_SIZE + 'px monospace';

  for (let i = 0; i < drops.length; i++) {
    const char = RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)];
    const x    = i * FONT_SIZE;
    const y    = drops[i] * FONT_SIZE;

    // Leading character is bright white-green
    ctx.fillStyle = drops[i] > 0 && Math.random() > 0.95 ? '#ffffff' : '#00ff41';
    ctx.fillText(char, x, y);

    // Reset drop after it passes the bottom (with randomness)
    if (y > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i] += 0.5;
  }
}

// Rain is started by initTerminal() — not here

/* ═══════════════════════════════════════════════════════════════════════════
   MESSAGE RENDERING HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

function appendSystemLine(text) {
  const line = document.createElement('div');
  line.className = 'msg-line msg-system';
  line.textContent = text;
  messageArea.appendChild(line);
  scrollBottom();
  return line;
}

function appendUserMessage(text) {
  const line   = document.createElement('div');
  line.className = 'msg-line msg-user';
  const bubble = document.createElement('span');
  bubble.className = 'bubble';
  bubble.textContent = text;
  line.appendChild(bubble);
  messageArea.appendChild(line);
  scrollBottom();
}

function appendErrorLine(text) {
  const line = document.createElement('div');
  line.className = 'msg-line msg-error';
  line.textContent = text;
  messageArea.appendChild(line);
  scrollBottom();
}

/**
 * Appends a bot message bubble and types out `text` character by character.
 * Returns a Promise that resolves when typing is complete.
 */
function appendBotMessage(text) {
  const line   = document.createElement('div');
  line.className = 'msg-line msg-bot';
  const bubble = document.createElement('span');
  bubble.className = 'bubble typing-cursor';
  line.appendChild(bubble);
  messageArea.appendChild(line);
  scrollBottom();

  return new Promise(resolve => {
    let i = 0;
    const interval = setInterval(() => {
      bubble.textContent += text[i];
      i++;
      scrollBottom();
      if (i >= text.length) {
        clearInterval(interval);
        bubble.classList.remove('typing-cursor');
        resolve();
      }
    }, CONFIG.TYPEWRITER_SPEED_MS);
  });
}

function scrollBottom() {
  messageArea.scrollTop = messageArea.scrollHeight;
}

/* ═══════════════════════════════════════════════════════════════════════════
   BOOT SEQUENCE
   ═══════════════════════════════════════════════════════════════════════════ */

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runBootSequence() {
  for (const line of BOOT_LINES) {
    appendSystemLine('> ' + line);
    await sleep(CONFIG.BOOT_LINE_DELAY_MS);
  }
  // Enable input after boot
  userInput.disabled = false;
  sendBtn.disabled   = false;
  userInput.focus();
}

/* ═══════════════════════════════════════════════════════════════════════════
   CHAT LOGIC
   ═══════════════════════════════════════════════════════════════════════════ */

let isBusy = false; // prevent concurrent sends

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || isBusy) return;

  isBusy = true;
  userInput.disabled = true;
  sendBtn.disabled   = true;
  userInput.value    = '';

  appendUserMessage(text);

  try {
    const response = await fetch(CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatInput: text,
        sessionId: CONFIG.SESSION_ID,
      }),
    });

    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ' ' + response.statusText);
    }

    const data = await response.json();

    // Support both { output: "..." } and { message: "..." } shapes
    const reply =
      data.output   ||
      data.message  ||
      data.text     ||
      data.response ||
      JSON.stringify(data);

    await appendBotMessage(reply);

  } catch (err) {
    appendErrorLine(err.message || 'Request failed.');
  } finally {
    isBusy = false;
    userInput.disabled = false;
    sendBtn.disabled   = false;
    userInput.focus();
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   EVENT LISTENERS
   ═══════════════════════════════════════════════════════════════════════════ */

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════════════════ */

let _chatInitialized = false;

window.initTerminal = function () {
  if (_chatInitialized) return;
  _chatInitialized = true;
  initRain();
  window.addEventListener('resize', initRain);
  setInterval(drawRain, 33); // ~30fps
  runBootSequence();
};

// Auto-start when used as a standalone page (index.html).
// On the landing page the overlay JS calls initTerminal() on first open.
if (!document.getElementById('demo-overlay')) {
  window.initTerminal();
}
