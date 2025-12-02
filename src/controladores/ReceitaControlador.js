// src/controladores/ReceitaControlador.js

const ReceitaModelo = require('../modelos/ReceitaModelo');

/**
 * @description Objeto que gerencia as operações REST para Receitas e a lógica de Venda/Estoque.
 */
const ReceitaControlador = {

    // [GET /receitas] - Listar todas as receitas
    async index(req, res) {
        try {
            const receitas = await ReceitaModelo.buscarTodas(); 
            return res.status(200).json(receitas);
        } catch (erro) {
            console.error(erro);
            return res.status(500).json({ erro: 'Erro ao buscar receitas.' });
        }
    },
    
    // [GET /receitas/:id] - Buscar detalhes de uma receita
    async show(req, res) {
        const { id } = req.params;
        try {
            const detalhes = await ReceitaModelo.buscarDetalhes(id);
            if (!detalhes) {
                return res.status(404).json({ erro: 'Receita não encontrada.' });
            }
            return res.status(200).json(detalhes);
        } catch (erro) {
            console.error(erro);
            return res.status(500).json({ erro: 'Erro ao buscar detalhes da receita.' });
        }
    },

    // [POST /receitas] - Adicionar uma nova receita (CREATE)
    async store(req, res) {
        const { nome, preco_venda, ingredientes } = req.body;

        if (!nome || !preco_venda || !ingredientes || ingredientes.length === 0) {
            return res.status(400).json({ erro: 'Nome, preço e lista de ingredientes são obrigatórios.' });
        }
        
        const receitaData = { nome, preco_venda };

        try {
            const novaReceita = await ReceitaModelo.criarComIngredientes(receitaData, ingredientes);
            
            return res.status(201).json({ 
                mensagem: 'Receita e ingredientes cadastrados com sucesso!', 
                receita: novaReceita 
            });

        } catch (erro) {
            console.error(erro);
            if (erro.errno === 1062) { 
                 return res.status(409).json({ erro: `A receita '${nome}' já existe.` });
            }
            return res.status(500).json({ erro: 'Erro ao cadastrar a receita: ' + erro.message });
        }
    },
    
    // [NOVO] [PUT /receitas/:id] - Atualizar uma receita
    async update(req, res) {
        const { id } = req.params;
        const dadosAtualizados = req.body;

        if (Object.keys(dadosAtualizados).length === 0) {
            return res.status(400).json({ erro: 'Nenhum dado fornecido para atualização.' });
        }

        try {
            const count = await ReceitaModelo.atualizar(id, dadosAtualizados);

            if (count === 0) {
                return res.status(404).json({ erro: 'Receita não encontrada para atualização.' });
            }

            return res.status(200).json({ mensagem: 'Receita atualizada com sucesso!' });

        } catch (erro) {
            console.error(erro);
            if (erro.errno === 1062) {
                 return res.status(409).json({ erro: `O nome da receita já existe.` });
            }
            return res.status(500).json({ erro: 'Erro ao atualizar receita.' });
        }
    },

    // [NOVO] [DELETE /receitas/:id] - Remover uma receita
    async destroy(req, res) {
        const { id } = req.params;

        try {
            const count = await ReceitaModelo.remover(id);

            if (count === 0) {
                return res.status(404).json({ erro: 'Receita não encontrada para remoção.' });
            }

            return res.status(204).send();

        } catch (erro) {
            console.error(erro);
            return res.status(500).json({ erro: 'Erro ao remover receita.' });
        }
    },

    // [POST /receitas/:id/vender] - Registrar Venda e Descontar Estoque
    async vender(req, res) {
        const { id } = req.params; 

        try {
            const resultado = await ReceitaModelo.venderReceita(id);
            
            return res.status(200).json(resultado);

        } catch (erro) {
            console.error(erro.message);
            
            if (erro.message.includes('Estoque insuficiente')) {
                 return res.status(409).json({ 
                    erro: 'Falha na Venda: Estoque insuficiente.',
                    detalhes: erro.message 
                 });
            }
            
            if (erro.message.includes('não encontrado')) {
                 return res.status(404).json({ 
                    erro: 'Falha na Venda: Receita ou item de estoque não encontrado.',
                    detalhes: erro.message 
                 });
            }
            
            return res.status(500).json({ erro: 'Erro interno ao processar a venda.' });
        }
    }
};

module.exports = ReceitaControlador;