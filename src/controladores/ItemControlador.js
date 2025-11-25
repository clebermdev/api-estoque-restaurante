// src/controladores/ItemControlador.js

const ItemModelo = require('../modelos/ItemModelo');

/**
 * @description Controlador responsável por receber as requisições (GET, POST, PUT, DELETE)
 * e interagir com o ItemModelo para gerenciar o estoque.
 */
const ItemControlador = {

    // [GET /itens] - Listar todos os itens (READ ALL)
    async index(req, res) {
        try {
            // Chama a função do Modelo para buscar todos os dados
            const itens = await ItemModelo.buscarTodos(); 
            
            // Retorna 200 OK com a lista de itens
            return res.status(200).json(itens); 
            
        } catch (erro) {
            console.error(erro);
            // Retorna 500 Internal Server Error em caso de falha no DB
            return res.status(500).json({ erro: 'Erro ao buscar itens no estoque.' });
        }
    },

    // [GET /itens/:id] - Listar um item específico (READ ONE)
    async show(req, res) {
        // Pega o ID dos parâmetros da URL
        const { id } = req.params; 
        
        try {
            const item = await ItemModelo.buscarPorId(id);
            
            if (!item) {
                // Retorna 404 Not Found se o item não existir
                return res.status(404).json({ erro: 'Item não encontrado.' });
            }
            
            // Retorna 200 OK com o item encontrado
            return res.status(200).json(item);
            
        } catch (erro) {
            console.error(erro);
            return res.status(500).json({ erro: 'Erro ao buscar item específico.' });
        }
    },

    // [POST /itens] - Adicionar um novo item (CREATE)
    async store(req, res) {
        // Recebe os dados do corpo da requisição (JSON)
        const { nome, quantidade, unidade } = req.body; 

        // Validação simples:
        if (!nome || !quantidade) {
            // Retorna 400 Bad Request se faltarem dados obrigatórios
            return res.status(400).json({ erro: 'Nome e quantidade são obrigatórios.' });
        }

        try {
            // Chama o Modelo para criar o item no DB
            const novoItem = await ItemModelo.criar({ nome, quantidade, unidade });
            
            // Retorna 201 Created (sucesso na criação)
            return res.status(201).json(novoItem);
            
        } catch (erro) {
            console.error(erro);
            
            // NOVA LÓGICA: Verifica se é um erro de duplicidade do MySQL (Código 1062)
            if (erro.errno === 1062) { 
                // Retorna 409 Conflict (Erro de lógica de negócio: recurso já existe)
                return res.status(409).json({ erro: `O item '${req.body.nome}' já está cadastrado no estoque.` });
            }
            
            // Retorna 500 para outros erros internos do servidor
            return res.status(500).json({ erro: 'Erro ao adicionar item.' });
        }
    },

    // [PUT /itens/:id] - Atualizar um item (UPDATE)
    async update(req, res) {
        const { id } = req.params; 
        const dadosAtualizados = req.body;
        
        // Validação para evitar atualização sem dados
        if (Object.keys(dadosAtualizados).length === 0) {
            return res.status(400).json({ erro: 'Nenhum dado fornecido para atualização.' });
        }

        try {
            // Chama a função do Modelo, que retorna o número de linhas afetadas
            const contagem = await ItemModelo.atualizar(id, dadosAtualizados);
            
            if (contagem === 0) {
                // Item não encontrado
                return res.status(404).json({ erro: 'Item não encontrado para atualização.' });
            }
            
            // Retorna 200 OK
            return res.status(200).json({ mensagem: 'Item atualizado com sucesso!' });

        } catch (erro) {
            console.error(erro);
            return res.status(500).json({ erro: 'Erro ao atualizar item.' });
        }
    },

    // [DELETE /itens/:id] - Remover um item (DELETE)
    async destroy(req, res) {
        const { id } = req.params; 

        try {
            // Chama a função do Modelo, que retorna o número de linhas deletadas
            const contagem = await ItemModelo.remover(id);

            if (contagem === 0) {
                // Item não encontrado
                return res.status(404).json({ erro: 'Item não encontrado para remoção.' });
            }

            // Retorna 204 No Content (Sucesso na remoção, sem corpo de resposta)
            return res.status(204).send();

        } catch (erro) {
            console.error(erro);
            return res.status(500).json({ erro: 'Erro ao remover item.' });
        }
    }
};

module.exports = ItemControlador;