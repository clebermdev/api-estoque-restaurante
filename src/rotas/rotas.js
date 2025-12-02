// src/rotas/rotas.js

const express = require('express');
const roteador = express.Router(); 
const ItemControlador = require('../controladores/ItemControlador');
const ReceitaControlador = require('../controladores/ReceitaControlador');

// --- Rotas da API REST de Estoque (Itens Brutos) ---

roteador.get('/itens', ItemControlador.index);
roteador.get('/itens/:id', ItemControlador.show);
roteador.post('/itens', ItemControlador.store);
roteador.put('/itens/:id', ItemControlador.update);
roteador.delete('/itens/:id', ItemControlador.destroy);


// --- Rotas da API REST de Receitas e Vendas ---

roteador.post('/receitas', ReceitaControlador.store);
roteador.get('/receitas', ReceitaControlador.index);
roteador.get('/receitas/:id', ReceitaControlador.show); // Rota para buscar detalhes

// [NOVO] Rotas de Edição e Exclusão
roteador.put('/receitas/:id', ReceitaControlador.update);
roteador.delete('/receitas/:id', ReceitaControlador.destroy);

// Rota de Venda (Lógica de Negócio)
roteador.post('/receitas/:id/vender', ReceitaControlador.vender);


// Rota base
roteador.get('/', (req, res) => {
    res.status(200).json({ mensagem: "Bem-vindo ao API REST de Gerenciamento de Estoque e Vendas (v1)" });
});

module.exports = roteador;