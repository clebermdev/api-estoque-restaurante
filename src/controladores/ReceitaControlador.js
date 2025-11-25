// src/controladores/ReceitaControlador.js

const ReceitaModelo = require('../modelos/ReceitaModelo');

/**
 * @description Controlador responsável por gerenciar as operações REST para Receitas 
 * e a lógica de Venda/Desconto de Estoque.
 */
const ReceitaControlador = {

    // [GET /receitas] - Listar todas as receitas
    async index(req, res) {
        try {
            // Em uma API completa, esta função buscaria todas as receitas com seus ingredientes.
            // Por enquanto, retorna uma mensagem indicando a próxima implementação.
            // Implementação futura: const receitas = await ReceitaModelo.buscarTodas();
            return res.status(200).json({ mensagem: 'Endpoint de Listar Todas Receitas (GET) OK. Lógica de busca completa a ser detalhada no Modelo.' });
        } catch (erro) {
            console.error(erro);
            return res.status(500).json({ erro: 'Erro ao buscar receitas.' });
        }
    },
    
    // [POST /receitas] - Adicionar uma nova receita (CREATE)
    async store(req, res) {
        // Esperamos receber: nome, preco_venda, e uma lista de ingredientes
        const { nome, preco_venda, ingredientes } = req.body;

        if (!nome || !preco_venda || !ingredientes || ingredientes.length === 0) {
            return res.status(400).json({ erro: 'Nome, preço e lista de ingredientes são obrigatórios.' });
        }
        
        const receitaData = { nome, preco_venda };

        try {
            // Chama o Modelo para criar a receita e seus ingredientes em uma TRANSAÇÃO
            const novaReceita = await ReceitaModelo.criarComIngredientes(receitaData, ingredientes);
            
            // Retorna 201 Created (Criado)
            return res.status(201).json({ 
                mensagem: 'Receita e ingredientes cadastrados com sucesso!', 
                receita: novaReceita 
            });

        } catch (erro) {
            console.error(erro);
            // Erro 500 para falha de DB ou falha na transação de criação
            return res.status(500).json({ erro: 'Erro ao cadastrar a receita: ' + erro.message });
        }
    },

    // [POST /receitas/:id/vender] - Registrar Venda e Descontar Estoque
    async vender(req, res) {
        const { id } = req.params; // ID da receita vendida

        try {
            // A lógica de checagem e desconto de estoque é encapsulada no Modelo
            const resultado = await ReceitaModelo.venderReceita(id);
            
            // 200 OK para sucesso na operação
            return res.status(200).json(resultado);

        } catch (erro) {
            console.error(erro.message);
            
            // 1. Tratamento para erro de "Estoque Insuficiente" (Erro de Negócio/Lógica)
            if (erro.message.includes('Estoque insuficiente')) {
                 return res.status(409).json({ // 409 Conflict: Indica que o estado do recurso (estoque) impede a ação.
                    erro: 'Falha na Venda: Estoque insuficiente.',
                    detalhes: erro.message 
                 });
            }
            
            // 2. Tratamento para receita não encontrada
            if (erro.message.includes('não encontrado')) {
                 return res.status(404).json({ 
                    erro: 'Falha na Venda: Receita ou item de estoque não encontrado.',
                    detalhes: erro.message 
                 });
            }
            
            // 3. Erro genérico
            return res.status(500).json({ erro: 'Erro interno ao processar a venda.' });
        }
    }
};

module.exports = ReceitaControlador;