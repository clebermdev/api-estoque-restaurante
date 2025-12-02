// src/modelos/ReceitaModelo.js

const db = require('../configuracao/bancoDados');

/**
 * @description Modelo que gerencia a lógica de Receitas e a transação de estoque.
 */
const ReceitaModelo = {
    
    // CRIAR uma nova receita e seus ingredientes de uma vez
    async criarComIngredientes(receitaData, ingredientes) {
        // Usamos uma transação para garantir que TUDO seja criado ou NADA seja criado.
        return db.transaction(async (trx) => {
            // 1. Inserir a receita principal
            const [receita_id] = await trx('receitas').insert(receitaData);

            // 2. Preparar os ingredientes para inserção na tabela pivot
            const ingredientesParaInserir = ingredientes.map(ing => ({
                receita_id: receita_id,
                item_id: ing.item_id, 
                quantidade_necessaria: ing.quantidade_necessaria
            }));

            // 3. Inserir todos os ingredientes
            if (ingredientesParaInserir.length > 0) {
                await trx('receita_ingredientes').insert(ingredientesParaInserir);
            }

            return { id: receita_id, ...receitaData, ingredientes };
        });
    },

    // NOVO: Busca uma única receita e seus ingredientes
    async buscarDetalhes(id) {
        // 1. Busca a receita principal
        const receita = await db('receitas').where({ id }).first();
        if (!receita) return null;

        // 2. Busca todos os ingredientes associados, juntando com a tabela 'itens' para pegar o nome
        const ingredientes = await db('receita_ingredientes')
            .join('itens', 'receita_ingredientes.item_id', '=', 'itens.id')
            .where('receita_ingredientes.receita_id', id)
            .select(
                'itens.nome as nome_item',
                'itens.unidade',
                'receita_ingredientes.quantidade_necessaria',
                'receita_ingredientes.item_id'
            );

        receita.ingredientes = ingredientes;
        return receita;
    },

    // NOVO: Busca todas as receitas, mas de forma simplificada
    async buscarTodas() {
        // Para a listagem inicial, buscamos apenas os dados da tabela 'receitas'
        return db('receitas').select('*');
    },

    // Lógica Central: VENDER e ATUALIZAR ESTOQUE (Transação)
    async venderReceita(receita_id) {
        // Transação é CRUCIAL
        return db.transaction(async (trx) => {
            
            // 1. Buscar os ingredientes necessários (sem JOIN, apenas IDs)
            const ingredientes = await trx('receita_ingredientes')
                .where({ receita_id })
                .select('item_id', 'quantidade_necessaria');

            if (ingredientes.length === 0) {
                throw new Error('Receita não possui ingredientes cadastrados ou ID incorreto.');
            }

            // 2. Verificar a disponibilidade de estoque
            for (const ing of ingredientes) {
                const itemEstoque = await trx('itens')
                    .where('id', ing.item_id)
                    .select('quantidade', 'nome')
                    .first();

                if (!itemEstoque || itemEstoque.quantidade === null) {
                    throw new Error(`Item de estoque (ID: ${ing.item_id}) não encontrado.`);
                }
                
                // Checagem se há estoque suficiente
                if (parseFloat(itemEstoque.quantidade) < parseFloat(ing.quantidade_necessaria)) {
                    throw new Error(`Estoque insuficiente de ${itemEstoque.nome}. Necessário: ${ing.quantidade_necessaria}, Disponível: ${itemEstoque.quantidade}`);
                }
            }

            // 3. Se TUDO estiver disponível, proceder com o desconto
            for (const ing of ingredientes) {
                await trx('itens')
                    .where('id', ing.item_id)
                    // Usamos .decrement para subtrair a quantidade
                    .decrement('quantidade', ing.quantidade_necessaria); 
            }

            return { message: 'Venda registrada com sucesso e estoque atualizado.' };
        });
    },
    
    // ... (Outras funções de atualização/remoção podem ser adicionadas)
};

module.exports = ReceitaModelo;