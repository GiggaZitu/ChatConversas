const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configuração do multer
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB para uploads
});

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

let messages = []; // Histórico de mensagens

io.on('connection', (socket) => {
  console.log('A user connected');

  // Enviar histórico de mensagens para o novo cliente
  socket.emit('loadMessages', messages);

  // Receber nova mensagem
  socket.on('message', (data) => {
    const { name, text, image, file, replyingTo } = data;
    const message = { id: Date.now(), name, text, image, file, replyingTo };
    messages.push(message);
    io.emit('message', message); // Envia para todos os usuários
  });

  // Receber pedido de apagar mensagem
  socket.on('deleteMessage', (id) => {
    messages = messages.filter(msg => msg.id !== parseInt(id, 10)); // Certifique-se de que o id é um número
    io.emit('deleteMessage', id); // Envia para todos os usuários
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

app.post('/upload', upload.single('file'), (req, res) => {
  if (req.file) {
    const filePath = req.file.path;
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl, fileName: req.file.originalname });
  } else {
    res.status(400).json({ error: 'No file uploaded' });
  }
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
