// src/rotas/rotas.js

const express = require('express');
const roteador = express.Router();
const ItemControlador = require('../controladores/ItemControlador');
const ReceitaControlador = require('../controladores/ReceitaControlador');

// --- Rotas da API REST de Estoque (Itens Brutos) ---

// GET /api/v1/itens - Listar todos
roteador.get('/itens', ItemControlador.index);
// GET /api/v1/itens/:id - Listar um específico
roteador.get('/itens/:id', ItemControlador.show);
// POST /api/v1/itens - Adicionar novo item
roteador.post('/itens', ItemControlador.store);
// PUT /api/v1/itens/:id - Atualizar item
roteador.put('/itens/:id', ItemControlador.update);
// DELETE /api/v1/itens/:id - Remover item
roteador.delete('/itens/:id', ItemControlador.destroy);


// --- Rotas da API REST de Receitas e Vendas ---

// POST /api/v1/receitas - Adicionar uma nova receita (com ingredientes)
roteador.post('/receitas', ReceitaControlador.store);
// POST /api/v1/receitas/:id/vender - Vender uma receita e descontar estoque
roteador.post('/receitas/:id/vender', ReceitaControlador.vender);
// GET /api/v1/receitas - Listar todas as receitas
roteador.get('/receitas', ReceitaControlador.index);


// Rota base
roteador.get('/', (req, res) => {
    res.status(200).json({ mensagem: "Bem-vindo ao API REST de Gerenciamento de Estoque e Vendas (v1)" });
});

module.exports = roteador;