-- ----------------------------------------------------
-- Tabela 1: ITENS (Estoque de Ingredientes Brutos)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS `itens` (
    -- ID: Chave primária, única e auto-incrementada
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    
    -- NOME: Campo de texto, não pode ser nulo e deve ser ÚNICO (proteção contra duplicatas)
    `nome` VARCHAR(255) NOT NULL UNIQUE,
    
    -- QUANTIDADE: Número inteiro (ou decimal, se preferir mais precisão)
    `quantidade` DECIMAL(10, 3) NOT NULL, -- Alterado para DECIMAL(10,3) para precisão de estoque (ex: 0.5 kg)
    
    `unidade` VARCHAR(50),
    
    -- Timestamps: Registra quando foi criado e a última atualização
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- ----------------------------------------------------
-- Tabela 2: RECEITAS (Pratos Acabados Vendidos)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS `receitas` (
    -- ID: Chave primária
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    
    -- NOME: Nome do prato, deve ser único
    `nome` VARCHAR(255) NOT NULL UNIQUE,
    
    -- PREÇO: Usando DECIMAL para valores monetários
    `preco_venda` DECIMAL(8, 2) NOT NULL,
    
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- ----------------------------------------------------
-- Tabela 3: RECEITA_INGREDIENTES (Relação N:M - Lista de Materiais)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS `receita_ingredientes` (
    -- ID: Chave primária desta tabela de ligação
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    
    -- CHAVE ESTRANGEIRA para a tabela RECEITAS
    `receita_id` INT UNSIGNED NOT NULL,
    
    -- CHAVE ESTRANGEIRA para a tabela ITENS (Estoque)
    `item_id` INT UNSIGNED NOT NULL,
    
    -- Quantidade: Pode ser decimal para ingredientes fracionados
    `quantidade_necessaria` DECIMAL(10, 3) NOT NULL,
    
    -- Garante que um item não pode ser listado duas vezes na mesma receita
    UNIQUE KEY `receita_item_unique` (`receita_id`, `item_id`),

    -- Ligação com RECEITAS: Se a receita for deletada, a lista de ingredientes também é (ON DELETE CASCADE)
    CONSTRAINT `fk_receita_ingredientes_receitas`
        FOREIGN KEY (`receita_id`) REFERENCES `receitas` (`id`)
        ON DELETE CASCADE,

    -- Ligação com ITENS: Se um item do estoque for deletado, a lista de ingredientes é removida
    CONSTRAINT `fk_receita_ingredientes_itens`
        FOREIGN KEY (`item_id`) REFERENCES `itens` (`id`)
        ON DELETE CASCADE
);