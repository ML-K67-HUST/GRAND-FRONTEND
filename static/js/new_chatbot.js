/* -------------------------------- Timenest Chatbot JS --------------------------------
   v4 – 2025‑04‑18
   ◇ When the user presses Send (or Enter) with pasted/attached images, those image previews now appear inside the user bubble.
   ◇ Each bubble can contain text, one or more images, or both.
*/

const chatbot  = document.getElementById('chatbot');
const openBtn  = document.getElementById('openChatBtn');   
const closeBtn = document.getElementById('closeChatBtn');
const dragBar  = document.getElementById('dragHandle');
const voiceBtn = document.getElementById('voiceBtn');
const footer   = document.querySelector('.chatbot-footer');
const bodyPane = document.querySelector('.chatbot-body, .chat-window');

/* ---------- runtime CSS ---------- */
(function(){
  const css=`.attach-strip{display:flex;gap:6px;padding:6px 10px;border-top:1px solid #dcdfe6;background:#fafbfd}.attach-chip{position:relative;width:48px;height:48px;border:1px solid #c6c9d1;border-radius:6px;overflow:hidden;flex:none}.attach-chip img{width:100%;height:100%;object-fit:cover}.attach-chip button{position:absolute;top:-6px;right:-6px;width:18px;height:18px;border:none;background:#fff;border-radius:50%;box-shadow:0 0 2px rgba(0,0,0,.3);font-size:12px;cursor:pointer;line-height:16px;padding:0}.attach-chip button:hover{background:#fee}.@keyframes pulseR{0%{transform:scale(1)}50%{transform:scale(1.25)}100%{transform:scale(1)}}.icon-btn.recording{animation:pulseR 1s infinite;background:#ffebee;color:#d50000!important}.chatbot-footer textarea{flex:1;padding:.55rem .75rem;font-size:.95rem;border:1px solid #c6c9d1;border-radius:9px;outline:none;resize:none;overflow:hidden}.chat-img{display:block;max-width:200px;border-radius:8px;margin-top:4px}`;
  const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
})();

/* ---------- position persistence, show/hide, drag ... (unchanged) ---------- */
(() => {
  const pos = JSON.parse(localStorage.getItem('chatbotPos')||'null');
  if(pos) Object.assign(chatbot.style,{left:pos.x+'px',top:pos.y+'px',right:'auto',bottom:'auto'});
})();
const saveCurrentPos=()=>{const {left,top}=chatbot.getBoundingClientRect();localStorage.setItem('chatbotPos',JSON.stringify({x:left,y:top}));};
const showChat=()=>{
  chatbot.style.display='flex';
  requestAnimationFrame(()=>{
    chatbot.classList.add('visible');
    // Focus the input field when the chat becomes visible
    setTimeout(() => {
      if (inputField) inputField.focus();
    }, 200);
  });
};
const hideChat=()=>{
  saveCurrentPos();
  chatbot.classList.remove('visible');
  chatbot.addEventListener('transitionend',function onEnd(e){
    if(e.propertyName==='opacity'){
      chatbot.style.display='none';
      chatbot.removeEventListener('transitionend',onEnd);
    }
  });
};
openBtn?.addEventListener('click',showChat);
closeBtn?.addEventListener('click',hideChat);
let offsetX=0,offsetY=0,dragging=false;
const startDrag=(x,y)=>{dragging=true;const r=chatbot.getBoundingClientRect();offsetX=x-r.left;offsetY=y-r.top;document.body.style.userSelect='none';};
const doDrag=(x,y)=>{if(!dragging)return;Object.assign(chatbot.style,{left:`${x-offsetX}px`,top:`${y-offsetY}px`,right:'auto',bottom:'auto'});} ;
const endDrag=()=>{if(dragging)saveCurrentPos();dragging=false;document.body.style.userSelect='';};

dragBar.addEventListener('mousedown',e=>startDrag(e.clientX,e.clientY));
document.addEventListener('mousemove',e=>doDrag(e.clientX,e.clientY));
document.addEventListener('mouseup',endDrag);
dragBar.addEventListener('touchstart',e=>{const t=e.touches[0];startDrag(t.clientX,t.clientY)});
document.addEventListener('touchmove',e=>{const t=e.touches[0];doDrag(t.clientX,t.clientY)});
document.addEventListener('touchend',endDrag);
window.addEventListener('keydown',e=>{const c=e.ctrlKey||e.metaKey;if(c&&(e.key==='b'||e.code==='KeyB')){e.preventDefault();chatbot.classList.contains('visible')?hideChat():showChat();}});

/* ---------- textarea upgrade ---------- */
function upgradeInput(){const inp=footer.querySelector('input[type="text"]');if(!inp)return null;const ta=document.createElement('textarea');ta.placeholder=inp.placeholder;ta.rows=1;ta.style.resize='none';ta.style.overflow='hidden';ta.className=inp.className;inp.replaceWith(ta);
  const grow=()=>{ta.style.height='auto';ta.style.height=Math.max(ta.scrollHeight,38)+'px';};ta.addEventListener('input',grow);grow();return ta;}

/* ---------- mic (speech‑to‑text) ---------- */
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let recording = false;
if (SpeechRec) {
  recognition = new SpeechRec();
  recognition.continuous = false;
  recognition.interimResults = true;
  // set desired language here (e.g. 'vi-VN' for Vietnamese)
  recognition.lang = localStorage.getItem('chatbotSpeechLang') || 'vi-VN';

  recognition.addEventListener('result', e => {
    let interim = '', final = '';
    for (const res of e.results) {
      if (res.isFinal) final += res[0].transcript;
      else interim += res[0].transcript;
    }
    inputField.value = (final || interim).trim();
    inputField.dispatchEvent(new Event('input')); // auto‑grow
  });

  recognition.addEventListener('end', () => {
    if (recording) toggleRecording(); // auto stop animation if user stops speaking
  });
} else {
  console.warn('SpeechRecognition not supported in this browser');
}

function toggleRecording() {
  if (!recognition) return alert('Speech recognition not supported in this browser');
  recording = !recording;
  if (recording) {
    recognition.start();
    voiceBtn.classList.add('recording');
  } else {
    recognition.stop();
    voiceBtn.classList.remove('recording');
  }
}

voiceBtn?.addEventListener('click', toggleRecording);

/* ---------- attachment strip (above footer) ---------- */ 
const attachStrip=document.createElement('div');attachStrip.className='attach-strip';chatbot.insertBefore(attachStrip,footer);
function addAttachment(file){const url=URL.createObjectURL(file);const chip=document.createElement('div');chip.className='attach-chip';chip.innerHTML=`<img src="${url}"><button>&times;</button>`;chip.querySelector('button').onclick=()=>chip.remove();chip.dataset.blob=url;attachStrip.appendChild(chip);} 
function collectAttachments(){return [...attachStrip.querySelectorAll('.attach-chip')].map(ch=>({url:ch.dataset.blob,name:'pasted'}));}

/* ================= chat logic ================= */
window.userID=window.userID||'demo-user';
let inputField;

document.addEventListener('DOMContentLoaded',()=>{
  inputField=upgradeInput();
  const sendBtn=document.createElement('button');sendBtn.style.display='none';footer.appendChild(sendBtn);
  sendBtn.addEventListener('click',handleUserInput);
  
  // Handle Enter key and focus management
  inputField.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey){
      e.preventDefault();
      handleUserInput();
    }
  });
  
  // Focus input when clicking anywhere in the chat except on specific elements
  chatbot.addEventListener('click', (e) => {
    // Don't focus if clicking on buttons, links, file inputs, or if text is selected
    const isClickable = e.target.closest('button, a, input[type="file"], .attach-chip');
    const hasSelection = window.getSelection().toString().length > 0;
    
    if (!isClickable && !hasSelection && chatbot.classList.contains('visible')) {
      inputField.focus();
    }
  });
  
  // Auto-focus the input when chat is visible
  const keepInputFocused = () => {
    if (chatbot.classList.contains('visible')) {
      inputField.focus();
    }
  };
  
  // Focus input when chat becomes visible
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class' && 
          chatbot.classList.contains('visible')) {
        setTimeout(() => inputField.focus(), 100);
      }
    });
  });
  observer.observe(chatbot, { attributes: true });
  
  // Re-focus after sending a message
  inputField.addEventListener('blur', () => {
    if (chatbot.classList.contains('visible')) {
      // Small delay to prevent focus issue with other interactions
      setTimeout(() => inputField.focus(), 100);
    }
  });
  
  // Focus when chat is opened
  openBtn?.addEventListener('click', () => {
    setTimeout(() => inputField.focus(), 200);
  });
  
  // Initial focus if chat is visible
  if (chatbot.classList.contains('visible')) {
    inputField.focus();
  }
  
  inputField.addEventListener('paste',handlePasteImage);

  /* ---- file‑upload (PNG/JPG only) ---- */
  const fileInput = footer.querySelector('input[type="file"]');
  if (fileInput) {
    fileInput.accept = 'image/png,image/jpeg'; // restrict chooser
    fileInput.addEventListener('change', e => {
      [...e.target.files].forEach(f => {
        if (['image/png','image/jpeg'].includes(f.type)) {
          addAttachment(f);
          // Focus text input after adding attachment
          setTimeout(() => inputField.focus(), 100);
        } else {
          alert('Chỉ cho phép tệp PNG hoặc JPG.');
        }
      });
      e.target.value = ''; // reset so selecting same file twice still fires
    });
  }
  loadConversation(window.userID);addTimestamp();
});

async function handleUserInput(){
  const txt=inputField.value.trim();
  const imgs=collectAttachments();
  if(!txt&&imgs.length===0)return;
  
  addMessage({text:txt,images:imgs},true);
  inputField.value='';
  inputField.style.height='38px';
  attachStrip.innerHTML='';
  
  // Keep focus on input after sending
  setTimeout(() => inputField.focus(), 50);
  
  addTyping();
  try{
    const r=await fetch('/infer',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({input:txt,ID:window.userID})
    });
    if(!r.ok)throw new Error(r.statusText);
    const data=await r.json();
    removeTyping();
    addMessage({text:data.response});
    // Re-focus input after receiving bot message
    setTimeout(() => inputField.focus(), 50);
  }catch(err){
    console.error(err);
    removeTyping();
    addMessage({text:'Sorry, there was an error processing your message.'});
    // Re-focus input after error
    setTimeout(() => inputField.focus(), 50);
  }
}

function handlePasteImage(e){const items=e.clipboardData?.items;if(!items)return;for(const it of items){if(it.type.startsWith('image/')){const file=it.getAsFile();if(file)addAttachment(file);e.preventDefault();break;}}}

/* ---------- utilities ---------- */
function addMessage({text='',images=[]},isUser=false,save=true){
  const d=document.createElement('div');
  d.className=isUser?'user-message':'bot-message';
  
  if(text) {
    const p = document.createElement('p');
    p.textContent = text;
    d.appendChild(p);
  }
  
  images.forEach(img=>{
    const tag=document.createElement('img');
    tag.src=img.url;
    tag.className='chat-img';
    d.appendChild(tag);
  });
  
  bodyPane.appendChild(d);
  bodyPane.scrollTop=bodyPane.scrollHeight;
  if(save)saveConversation(window.userID);
}  
function addTyping(){const d=document.createElement('div');d.className='bot-message typing-indicator';d.innerHTML='<div class="typing-bubble"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';bodyPane.appendChild(d);bodyPane.scrollTop=bodyPane.scrollHeight;}
const removeTyping=()=>document.querySelector('.typing-indicator')?.remove();

function saveConversation(uid){
  const msgs=[...bodyPane.children].map(c=>{
    if(c.classList.contains('timestamp')){
      return {type:'timestamp',text:c.textContent};
    } else {
      return {
        type:'message',
        isUser:c.classList.contains('user-message'),
        content: Array.from(c.childNodes).map(node => {
          if(node.nodeName === 'P') {
            return {type: 'text', text: node.textContent};
          } else if(node.nodeName === 'IMG') {
            return {type: 'image', src: node.src};
          }
          return null;
        }).filter(item => item !== null)
      };
    }
  });
  localStorage.setItem(`chatConversation_${uid}`,JSON.stringify({user_id:uid,messages:msgs}));
}

function loadConversation(uid){
  const saved=localStorage.getItem(`chatConversation_${uid}`);
  if(!saved)return;
  
  const {messages}=JSON.parse(saved);
  bodyPane.innerHTML='';
  
  messages.forEach(m=>{
    if(m.type==='timestamp'){
      const t=document.createElement('div');
      t.className='timestamp';
      t.textContent=m.text;
      bodyPane.appendChild(t);
    } else {
      const d=document.createElement('div');
      d.className=m.isUser?'user-message':'bot-message';
      
      if(m.content) {
        m.content.forEach(item => {
          if(item.type === 'text') {
            const p = document.createElement('p');
            p.textContent = item.text;
            d.appendChild(p);
          } else if(item.type === 'image') {
            const img = document.createElement('img');
            img.src = item.src;
            img.className = 'chat-img';
            d.appendChild(img);
          }
        });
      } else if(m.html) {
        // Legacy support for old format
        d.innerHTML = m.html;
      }
      
      bodyPane.appendChild(d);
    }
  });
}

function addTimestamp(){const t=document.createElement('div');t.className='timestamp';t.textContent=new Date().toLocaleString('en-US',{weekday:'short',hour:'2-digit',minute:'2-digit'});bodyPane.appendChild(t);}
