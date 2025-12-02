// src/modelos/ReceitaModelo.js

const db = require('../configuracao/bancoDados');

/**
 * @description Modelo que gerencia a lógica de Receitas e a transação de estoque.
 */
const ReceitaModelo = {
    
    // CRIAR uma nova receita e seus ingredientes de uma vez
    async criarComIngredientes(receitaData, ingredientes) {
        return db.transaction(async (trx) => {
            const [receita_id] = await trx('receitas').insert(receitaData);

            const ingredientesParaInserir = ingredientes.map(ing => ({
                receita_id: receita_id,
                item_id: ing.item_id, 
                quantidade_necessaria: parseFloat(ing.quantidade_necessaria) 
            }));

            if (ingredientesParaInserir.length > 0) {
                await trx('receita_ingredientes').insert(ingredientesParaInserir);
            }

            return { id: receita_id, ...receitaData, ingredientes };
        });
    },

    // Busca uma única receita e seus ingredientes
    async buscarDetalhes(id) {
        const receita = await db('receitas').where({ id }).first();
        if (!receita) return null;

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

    // Busca todas as receitas, mas de forma simplificada
    async buscarTodas() {
        return db('receitas').select('*');
    },

    // [NOVO] UPDATE: Atualiza os dados principais de uma receita
    async atualizar(id, dadosReceita) {
        // Atualiza apenas os campos da tabela principal 'receitas'
        return db('receitas').where({ id }).update(dadosReceita);
    },

    // [NOVO] DELETE: Remove uma receita
    async remover(id) {
        // O MySQL remove automaticamente os ingredientes pela regra ON DELETE CASCADE
        return db('receitas').where({ id }).del();
    },

    // Lógica Central: VENDER e ATUALIZAR ESTOQUE (Transação)
    async venderReceita(receita_id) {
        return db.transaction(async (trx) => {
            
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
                
                // Conversão explícita para float na checagem
                const estoqueAtual = parseFloat(itemEstoque.quantidade);
                const quantidadeNecessaria = parseFloat(ing.quantidade_necessaria); 

                if (estoqueAtual < quantidadeNecessaria) {
                    throw new Error(`Estoque insuficiente de ${itemEstoque.nome}. Necessário: ${ing.quantidade_necessaria}, Disponível: ${itemEstoque.quantidade}`);
                }
            }

            // 3. Proceder com o desconto (Agora com precisão decimal garantida)
            for (const ing of ingredientes) {
                const valorDesconto = parseFloat(ing.quantidade_necessaria); 
                
                await trx('itens')
                    .where('id', ing.item_id)
                    .update('quantidade', db.raw('quantidade - ?', [valorDesconto])); 
            }

            return { message: 'Venda registrada com sucesso e estoque atualizado.' };
        });
    },
};

module.exports = ReceitaModelo;