// src/modelos/ItemModelo.js

const db = require('../configuracao/bancoDados'); 

/**
 * @description Módulo que encapsula toda a lógica de interação com a tabela 'itens' (Estoque).
 * Este é o Modelo (M) do padrão MVC.
 */
const ItemModelo = {
    // LER TUDO: Busca todos os itens
    async buscarTodos() {
        return db('itens').select('*');
    },

    // LER UM: Busca um item pelo ID
    async buscarPorId(id) {
        return db('itens').where({ id }).first();
    },

    // CRIAR: Adiciona um novo item (Função que o Controlador estava procurando)
    async criar(item) {
        // Insere o item e retorna o ID gerado.
        const [id] = await db('itens').insert(item); 
        return { id, ...item }; // Retorna o novo item completo, incluindo o ID
    },

    // ATUALIZAR: Atualiza um item existente
    async atualizar(id, item) {
        // Usa o Knex para atualizar o registro
        return db('itens').where({ id }).update(item); 
    },

    // DELETAR: Remove um item
    async remover(id) {
        // Usa o Knex para remover o registro
        return db('itens').where({ id }).del();
    }
};

module.exports = ItemModelo;