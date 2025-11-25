const knex = require('knex');

// ----------------------------------------------------
// 1. CONFIGURAÇÃO DE CONEXÃO COM O MYSQL
// ----------------------------------------------------
const configuracao = {
    client: 'mysql2', // Usando o driver MySQL2
    connection: {
        host: '127.0.0.1', 
        user: 'root',      
        password: '', // <<< ATUALIZAR SUA SENHA AQUI
        database: 'estoque_restaurante' 
    },
    // Pool de conexões para melhor performance
    pool: {
        min: 2,
        max: 10
    }
};

const db = knex(configuracao);

// ----------------------------------------------------
// 2. LÓGICA DE CRIAÇÃO DO ESQUEMA (TABELAS)
// ----------------------------------------------------

// Tabela 1: ITENS (O estoque de ingredientes brutos)
db.schema.hasTable('itens').then((existe) => {
    if (!existe) {
        return db.schema.createTable('itens', (tabela) => {
            tabela.increments('id').primary();
            tabela.string('nome', 255).notNullable();
            tabela.integer('quantidade').notNullable();
            tabela.string('unidade', 50);
            tabela.timestamps(true, true);
        })
        .then(() => {
            console.log('Tabela "itens" criada com sucesso no MySQL!');
        })
        .catch((erro) => {
            console.error('Erro ao criar tabela itens:', erro);
        });
    }
});


// Tabela 2: RECEITAS (Os pratos finais vendidos)
db.schema.hasTable('receitas').then((existe) => {
    if (!existe) {
        return db.schema.createTable('receitas', (tabela) => {
            tabela.increments('id').primary();
            tabela.string('nome', 255).notNullable().unique();
            tabela.decimal('preco_venda', 8, 2).notNullable();
            tabela.timestamps(true, true);
        })
        .then(() => console.log('Tabela "receitas" criada com sucesso no MySQL!'))
        .catch((erro) => console.error('Erro ao criar tabela receitas:', erro));
    }
});


// Tabela 3: RECEITA_INGREDIENTES (Tabela de ligação N:M)
db.schema.hasTable('receita_ingredientes').then((existe) => {
    if (!existe) {
        return db.schema.createTable('receita_ingredientes', (tabela) => {
            tabela.increments('id').primary();
            
            // Chave Estrangeira 1: Liga à Receita
            tabela.integer('receita_id')
                 .unsigned()
                 .references('id')
                 .inTable('receitas')
                 .onDelete('CASCADE')
                 .notNullable();
                 
            // Chave Estrangeira 2: Liga ao Item do Estoque
            tabela.integer('item_id')
                 .unsigned()
                 .references('id')
                 .inTable('itens')
                 .onDelete('CASCADE')
                 .notNullable();
                 
            tabela.integer('quantidade_necessaria').notNullable(); // Quantidade deste item para a receita
            tabela.unique(['receita_id', 'item_id']); // Garante que a combinação seja única
        })
        .then(() => console.log('Tabela "receita_ingredientes" criada com sucesso no MySQL!'))
        .catch((erro) => console.error('Erro ao criar tabela receita_ingredientes:', erro));
    }
});


// ----------------------------------------------------
// 3. EXPORTAÇÃO DA INSTÂNCIA
// ----------------------------------------------------
module.exports = db;