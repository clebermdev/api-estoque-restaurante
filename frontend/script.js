// frontend/script.js

// URLs Base da API
const API_BASE_ITENS = 'http://127.0.0.1:8001/api/v1/itens';
const API_BASE_RECEITAS = 'http://127.0.0.1:8001/api/v1/receitas';

// -----------------------------------------------------
// FUNÇÃO 1: CARREGAR/LISTAR TODOS OS ITENS (Estoque)
// -----------------------------------------------------
async function carregarEstoque() {
    const tbody = document.querySelector('#tabela-estoque tbody');
    const statusMsg = document.getElementById('mensagem-status');
    tbody.innerHTML = '';
    statusMsg.textContent = 'Buscando itens...';
    
    try {
        const resposta = await fetch(API_BASE_ITENS);
        if (!resposta.ok) {
            throw new Error('Falha ao buscar estoque. Status: ' + resposta.status);
        }
        
        const itens = await resposta.json();

        itens.forEach(item => {
            const linha = tbody.insertRow();
            linha.insertCell().textContent = item.id;
            linha.insertCell().textContent = item.nome;
            // Usamos toFixed(3) para exibir 3 casas decimais (para precisão do estoque)
            linha.insertCell().textContent = parseFloat(item.quantidade).toFixed(3); 
            linha.insertCell().textContent = item.unidade || 'N/A';
            
            const celulaAcoes = linha.insertCell();
            celulaAcoes.innerHTML = 
                `<button data-id="${item.id}" onclick="alert('Funcionalidade PUT (Editar) será implementada logo!')">Editar</button>` +
                `<button data-id="${item.id}" onclick="deletarItem(this.dataset.id)">Excluir</button>`;
        });
        statusMsg.textContent = `Estoque carregado com sucesso. Total de ${itens.length} itens.`;

    } catch (erro) {
        statusMsg.textContent = 'Erro ao carregar estoque: Verifique se a API está rodando.';
        console.error('Erro de API:', erro);
    }
}

// -----------------------------------------------------
// FUNÇÃO 2: ADICIONAR NOVO ITEM (POST)
// -----------------------------------------------------
document.getElementById('form-adicionar-item').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusMsg = document.getElementById('mensagem-status');
    statusMsg.textContent = 'Adicionando...';

    const nome = document.getElementById('nome').value;
    // Garante que o input de quantidade seja lido como float
    const quantidade = parseFloat(document.getElementById('quantidade').value); 
    const unidade = document.getElementById('unidade').value;

    const novoItem = { nome, quantidade, unidade };

    try {
        const resposta = await fetch(API_BASE_ITENS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoItem)
        });

        const dadosResposta = await resposta.json();

        if (resposta.ok && resposta.status === 201) {
            statusMsg.textContent = `Item ${dadosResposta.nome} adicionado com sucesso! (ID: ${dadosResposta.id})`;
            document.getElementById('form-adicionar-item').reset();
            carregarEstoque(); 
        } else if (resposta.status === 409) {
            // Tratamento do erro de UNICIDADE (Duplicata)
             statusMsg.textContent = dadosResposta.erro;
        } else {
            statusMsg.textContent = 'Erro ao adicionar item: ' + (dadosResposta.erro || resposta.statusText);
        }

    } catch (erro) {
        statusMsg.textContent = 'Erro de conexão com a API.';
        console.error('Erro de API:', erro);
    }
});


// -----------------------------------------------------
// FUNÇÃO 3: DELETAR ITEM (DELETE)
// -----------------------------------------------------
async function deletarItem(itemId) {
    const confirma = confirm(`Tem certeza que deseja excluir o Item ID ${itemId}?`);
    if (!confirma) return;

    try {
        const resposta = await fetch(`${API_BASE_ITENS}/${itemId}`, {
            method: 'DELETE'
        });

        if (resposta.status === 204) {
            document.getElementById('mensagem-status').textContent = `Item ID ${itemId} excluído com sucesso.`;
            carregarEstoque(); 
        } else if (resposta.status === 404) {
            document.getElementById('mensagem-status').textContent = `Erro: Item ID ${itemId} não encontrado.`;
        } else {
            document.getElementById('mensagem-status').textContent = `Erro ao excluir. Status: ${resposta.status}`;
        }
    } catch (erro) {
        document.getElementById('mensagem-status').textContent = 'Erro de conexão ao tentar excluir.';
        console.error('Erro de API:', erro);
    }
}


// -----------------------------------------------------
// FUNÇÃO 4: CARREGAR/LISTAR RECEITAS (GET)
// -----------------------------------------------------
async function carregarReceitas() {
    const tbody = document.querySelector('#tabela-receitas tbody');
    const statusMsg = document.getElementById('mensagem-receita');
    tbody.innerHTML = '';
    statusMsg.textContent = 'Buscando receitas...';

    try {
        const resposta = await fetch(API_BASE_RECEITAS);
        if (!resposta.ok) {
            throw new Error('Falha ao buscar receitas. Status: ' + resposta.status);
        }

        const receitas = await resposta.json();
        
        // Se a resposta for a mensagem padrão (pois o backend não implementa o GET completo)
        if (Array.isArray(receitas)) {
             statusMsg.textContent = `Receitas carregadas com sucesso. Total de ${receitas.length} pratos.`;
             // Processa as receitas se for um Array
             receitas.forEach(receita => {
                const linha = tbody.insertRow();
                linha.insertCell().textContent = receita.id;
                linha.insertCell().textContent = receita.nome;
                linha.insertCell().textContent = `R$ ${parseFloat(receita.preco_venda || 0).toFixed(2)}`;
                // Este backend GET /receitas não retorna ingredientes, então mostramos um placeholder
                linha.insertCell().textContent = 'Detalhes na API...'; 
                
                // Botão Vender
                const celulaVenda = linha.insertCell();
                celulaVenda.innerHTML = 
                    `<button data-id="${receita.id}" data-nome="${receita.nome}" onclick="abrirModalVenda(this.dataset.id, this.dataset.nome)">Vender</button>`;

                // Botão Ações (Editar/Excluir)
                const celulaAcoes = linha.insertCell();
                celulaAcoes.innerHTML = 
                    `<button data-id="${receita.id}">Editar</button>` + 
                    `<button data-id="${receita.id}" onclick="alert('Funcionalidade de Excluir Receita não implementada na API.')">Excluir</button>`;
            });

        } else {
             // Caso o backend retorne apenas a mensagem de placeholder
             statusMsg.textContent = receitas.mensagem || 'Backend de Receitas não implementado para listagem completa.';
        }

    } catch (erro) {
        statusMsg.textContent = 'Erro ao carregar receitas: Verifique se a API está rodando.';
        console.error('Erro de API:', erro);
    }
}

// -----------------------------------------------------
// FUNÇÃO 5: VENDER RECEITA (POST /:id/vender)
// -----------------------------------------------------
async function venderReceita(receitaId) {
    const statusMsg = document.getElementById('mensagem-receita');
    statusMsg.textContent = `Processando venda da Receita ID ${receitaId}...`;
    
    // Fecha o modal
    document.getElementById('modal-venda').style.display = 'none';

    try {
        const resposta = await fetch(`${API_BASE_RECEITAS}/${receitaId}/vender`, {
            method: 'POST', 
        });

        const dadosResposta = await resposta.json();

        if (resposta.ok && resposta.status === 200) {
            statusMsg.textContent = `Venda Sucesso: ${dadosResposta.message}`;
            carregarEstoque(); // Atualiza o estoque para refletir o desconto
        } else if (resposta.status === 409) {
            // Tratamento do erro de ESTOQUE INSUFICIENTE
            statusMsg.textContent = `FALHA NA VENDA (Estoque Insuficiente): ${dadosResposta.detalhes}`;
        } else {
            statusMsg.textContent = `Erro na Venda: ${dadosResposta.erro || resposta.statusText}`;
        }

    } catch (erro) {
        statusMsg.textContent = 'Erro de conexão ao tentar vender.';
        console.error('Erro de API:', erro);
    }
}

// -----------------------------------------------------
// EVENTOS INICIAIS E AUXILIARES
// -----------------------------------------------------

// Abre o modal de confirmação de venda
function abrirModalVenda(receitaId, nomeReceita) {
    document.getElementById('nome-receita-venda').textContent = nomeReceita;
    document.getElementById('confirmar-venda').dataset.receitaId = receitaId;
    document.getElementById('modal-venda').style.display = 'block';
}

// Liga o botão de carregar estoque
document.getElementById('botao-carregar').addEventListener('click', carregarEstoque);

// Liga o botão de carregar receitas
document.getElementById('botao-carregar-receitas').addEventListener('click', carregarReceitas);

// Liga o botão de confirmação dentro do modal de venda
document.getElementById('confirmar-venda').addEventListener('click', () => {
    const receitaId = document.getElementById('confirmar-venda').dataset.receitaId;
    venderReceita(receitaId);
});

// Botão Cadastrar Nova Receita (placeholder)
document.getElementById('botao-nova-receita').addEventListener('click', () => {
    alert('A funcionalidade de cadastrar receitas via formulário será o próximo passo de desenvolvimento!');
});