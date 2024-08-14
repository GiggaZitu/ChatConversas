const socket = io();

const nameInput = document.getElementById('nameInput');
const messageInput = document.getElementById('messageInput');
const fileInput = document.getElementById('fileInput');
const sendButton = document.getElementById('sendButton');
const messages = document.getElementById('messages');
const replyingTo = document.getElementById('replyingTo');

let replyingToMessage = null; // Guarda a mensagem que está sendo respondida

// Função para adicionar uma mensagem ao chat
function addMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');

  // Adiciona a mensagem que está sendo respondida, se existir
  if (message.replyingTo) {
    const replyElement = document.createElement('div');
    replyElement.classList.add('replying-to-message');
    replyElement.innerHTML = `<blockquote>
      <p><strong>${message.replyingTo.name}:</strong> ${message.replyingTo.text}</p>
    </blockquote>`;
    messageElement.appendChild(replyElement);
  }

  // Adiciona o texto da mensagem com suporte a quebras de linha
  messageElement.innerHTML += `<strong>${message.name}:</strong> <pre>${message.text}</pre>`;

  // Adiciona imagem, se existir
  if (message.image) {
    const img = document.createElement('img');
    img.src = message.image;
    img.alt = 'Imagem';
    img.classList.add('message-image');
    messageElement.appendChild(img);
  }

  // Adiciona link para o arquivo, se existir
  if (message.file) {
    const fileContainer = document.createElement('div');
    fileContainer.classList.add('file-container');

    const fileLink = document.createElement('a');
    fileLink.href = message.file.url;
    fileLink.download = message.file.name;
    fileLink.textContent = `⇣ ${message.file.name}`;

    const fileIcon = document.createElement('div');
    fileIcon.classList.add('file-icon');
    fileIcon.textContent = '📁'; // Ícone genérico para arquivos

    fileContainer.appendChild(fileIcon);
    fileContainer.appendChild(fileLink);
    messageElement.appendChild(fileContainer);
  }

  // Adiciona botões de responder e deletar
  messageElement.innerHTML += `
    <button class="reply-button" data-id="${message.id}" data-name="${message.name}" data-text="${message.text}"> ↵ </button>
    <button class="delete-button" data-id="${message.id}"> ⌫ </button>
  `;

  messages.appendChild(messageElement);
  messages.scrollTop = messages.scrollHeight; // Scroll to the bottom
}

// Receber histórico de mensagens do servidor
socket.on('loadMessages', (messages) => {
  messages.forEach(message => addMessage(message));
});

// Receber novas mensagens do servidor
socket.on('message', (message) => {
  addMessage(message);
});

// Receber pedido de apagar mensagem
socket.on('deleteMessage', (id) => {
  const messageElement = document.querySelector(`.delete-button[data-id='${id}']`).parentElement;
  if (messageElement) {
    messageElement.remove();
  }
});

// Enviar mensagem
sendButton.addEventListener('click', async () => {
  const name = nameInput.value.trim();
  const text = messageInput.value.trim();
  const file = fileInput.files[0];

  let fileData = null;

  if (name && (text || file)) {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      fileData = { url: result.fileUrl, name: result.fileName };
    }

    const message = { name, text, file: fileData };

    if (replyingToMessage) {
      message.replyingTo = replyingToMessage;
    }

    socket.emit('message', message);
    messageInput.value = '';
    fileInput.value = ''; // Clear file input
    replyingTo.innerHTML = ''; // Clear the replying section
    replyingToMessage = null; // Reset replying message
  }
});

// Apagar mensagem
messages.addEventListener('click', (event) => {
  if (event.target.classList.contains('delete-button')) {
    const id = event.target.getAttribute('data-id');
    socket.emit('deleteMessage', id);
  } else if (event.target.classList.contains('reply-button')) {
    const id = event.target.getAttribute('data-id');
    const name = event.target.getAttribute('data-name');
    const text = event.target.getAttribute('data-text');
    replyingToMessage = { id, name, text };

    replyingTo.innerHTML = `Respondendo a: <strong>${name}</strong> - ${text}`;
  }
});
