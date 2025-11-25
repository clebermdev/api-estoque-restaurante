// src/principal.js

const express = require('express');
const bodyParser = require('body-parser');
const http = require('http'); 
const rotas = require('./rotas/rotas'); 
// O módulo de bancoDados é carregado aqui apenas para garantir que as tabelas sejam checadas/criadas.
const db = require('./configuracao/bancoDados'); 

const app = express();
const PORTA = 8001;

// --- Configuração da Aplicação ---

// Middleware para ler JSON: Essencial para POST e PUT
app.use(bodyParser.json()); 

// Usar as Rotas da API com um prefixo de versão
app.use('/api/v1', rotas);


// --- Inicialização do Servidor ---

http.createServer(app).listen(PORTA, () => {
    console.log(`\nServidor iniciado em http://127.0.0.1:${PORTA}`);
    console.log('API pronta para receber requisições.');
    console.log('Verifique se o seu servidor MySQL está ativo!');
});