// src/modelos/ReceitaModelo.js

const db = require('../configuracao/bancoDados');

/**
 * @description Modelo que gerencia a lógica de Receitas e a transação de estoque.
 */
const ReceitaModelo = {
    // ----------------------------------------------------------
    // Funções Básicas (Buscar, Criar Receita e Ingredientes)
    // ----------------------------------------------------------
    
    // CRIAR uma nova receita e seus ingredientes de uma vez
    async criarComIngredientes(receitaData, ingredientes) {
        // Usamos uma transação para garantir que TUDO seja criado ou NADA seja criado.
        return db.transaction(async (trx) => {
            // 1. Inserir a receita principal
            const [receita_id] = await trx('receitas').insert(receitaData);

            // 2. Preparar os ingredientes para inserção na tabela pivot
            const ingredientesParaInserir = ingredientes.map(ing => ({
                receita_id: receita_id,
                item_id: ing.item_id, // ID do item do estoque
                quantidade_necessaria: ing.quantidade_necessaria
            }));

            // 3. Inserir todos os ingredientes
            if (ingredientesParaInserir.length > 0) {
                await trx('receita_ingredientes').insert(ingredientesParaInserir);
            }

            return { id: receita_id, ...receitaData, ingredientes };
        });
    },

    // ----------------------------------------------------------
    // Lógica Central: VENDER e ATUALIZAR ESTOQUE (Transação)
    // ----------------------------------------------------------
    
    async venderReceita(receita_id) {
        // Transação é CRUCIAL para garantir que a venda e o desconto sejam ATÔMICOS.
        // Se a venda falhar ou o desconto falhar, toda a operação é revertida.
        return db.transaction(async (trx) => {
            
            // 1. Buscar todos os ingredientes necessários para esta receita
            const ingredientes = await trx('receita_ingredientes')
                .where({ receita_id })
                .select('item_id', 'quantidade_necessaria');

            if (ingredientes.length === 0) {
                throw new Error('Receita não possui ingredientes cadastrados.');
            }

            // 2. Verificar a disponibilidade de estoque
            for (const ing of ingredientes) {
                const itemEstoque = await trx('itens')
                    .where('id', ing.item_id)
                    .select('quantidade', 'nome')
                    .first();

                if (!itemEstoque) {
                    throw new Error(`Item de estoque (ID: ${ing.item_id}) não encontrado.`);
                }
                
                // Checagem se há estoque suficiente
                if (itemEstoque.quantidade < ing.quantidade_necessaria) {
                    throw new Error(`Estoque insuficiente de ${itemEstoque.nome}. Necessário: ${ing.quantidade_necessaria}, Disponível: ${itemEstoque.quantidade}`);
                }
            }

            // 3. Se TUDO estiver disponível, proceder com o desconto
            for (const ing of ingredientes) {
                await trx('itens')
                    .where('id', ing.item_id)
                    // Diminui a quantidade atual pelo que é necessário para a receita
                    .decrement('quantidade', ing.quantidade_necessaria); 
            }

            // A transação será commitada automaticamente se todas as etapas passarem.
            // Aqui, você pode adicionar a lógica de registro de venda, se necessário.
            return { message: 'Venda registrada com sucesso e estoque atualizado.' };
        });
    },
    
    // ... (Outras funções, como buscarPorId, buscarIngredientes, etc.)
};

module.exports = ReceitaModelo;