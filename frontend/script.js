// frontend/script.js

// URLs Base da API
const API_BASE_ITENS = 'http://127.0.0.1:8001/api/v1/itens';
const API_BASE_RECEITAS = 'http://127.0.0.1:8001/api/v1/receitas';

let estoqueDisponivel = []; // Variável global para armazenar itens do estoque para o dropdown

// -----------------------------------------------------
// FUNÇÃO 1: CARREGAR ESTOQUE (Itens e Dropdown)
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
        estoqueDisponivel = itens; // Armazena globalmente
        
        // Renderiza a tabela de estoque
        itens.forEach(item => {
            const linha = tbody.insertRow();
            linha.insertCell().textContent = item.id;
            linha.insertCell().textContent = item.nome;
            linha.insertCell().textContent = parseFloat(item.quantidade).toFixed(3); 
            linha.insertCell().textContent = item.unidade || 'N/A';
            
            const celulaAcoes = linha.insertCell();
            celulaAcoes.innerHTML = 
                `<button data-id="${item.id}" onclick="alert('Editar não implementado.')">Editar</button>` +
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
async function adicionarNovoItem(e) {
    e.preventDefault();
    const statusMsg = document.getElementById('mensagem-status');
    statusMsg.textContent = 'Adicionando...';

    // Aplica .trim() para limpar espaços em branco no início/fim
    const nome = document.getElementById('nome').value.trim(); 
    const quantidadeValor = document.getElementById('quantidade').value;
    const unidade = document.getElementById('unidade').value.trim();

    // 1. Validação de campos vazios
    if (!nome || !quantidadeValor || !unidade) {
        statusMsg.textContent = 'Erro: Por favor, preencha todos os campos.';
        return;
    }

    const quantidade = parseFloat(quantidadeValor);
    
    // 2. Validação se a quantidade é um número válido e positivo
    if (isNaN(quantidade) || quantidade <= 0) {
        statusMsg.textContent = 'Erro: A quantidade deve ser um número válido maior que zero.';
        return;
    }

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
            carregarEstoque(); // Atualiza a lista
        } else if (resposta.status === 409) {
             // Tratamento de unicidade
             statusMsg.textContent = dadosResposta.erro;
        } else {
            statusMsg.textContent = 'Erro ao adicionar item: ' + (dadosResposta.erro || resposta.statusText);
        }

    } catch (erro) {
        statusMsg.textContent = 'Erro de conexão com a API.';
        console.error('Erro de API:', erro);
    }
}

// -----------------------------------------------------
// FUNÇÃO 3: LIGAR O EVENTO (HOOK)
// -----------------------------------------------------
document.getElementById('form-adicionar-item').addEventListener('submit', adicionarNovoItem);

// -----------------------------------------------------
// FUNÇÃO AUXILIAR: CRIA O CAMPO DE INGREDIENTE DINÂMICO
// -----------------------------------------------------
function criarCampoIngrediente() {
    const container = document.getElementById('ingredientes-container');
    
    // Cria um grupo div para o ingrediente
    const grupo = document.createElement('div');
    grupo.className = 'ingrediente-grupo';
    grupo.style.marginBottom = '15px';

    // 1. Dropdown (Select) para escolher o item do estoque (ID)
    const select = document.createElement('select');
    select.required = true;

    // Opção default
    const optDefault = document.createElement('option');
    optDefault.textContent = 'Selecione o Ingrediente (ID)';
    optDefault.value = '';
    select.appendChild(optDefault);

    // Popula as opções com base no estoqueDisponivel
    estoqueDisponivel.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id; // O valor é o item_id
        option.textContent = `${item.nome} (${item.unidade})`;
        select.appendChild(option);
    });

    // 2. Input para a Quantidade Necessária
    const inputQtd = document.createElement('input');
    inputQtd.type = 'number';
    inputQtd.step = '0.001';
    inputQtd.placeholder = 'Qtd. Necessária';
    inputQtd.required = true;
    
    // 3. Botão Remover
    const btnRemover = document.createElement('button');
    btnRemover.type = 'button';
    btnRemover.textContent = 'Remover';
    btnRemover.onclick = () => container.removeChild(grupo);

    // Adiciona os elementos ao grupo
    grupo.appendChild(select);
    grupo.appendChild(inputQtd);
    grupo.appendChild(btnRemover);
    
    container.appendChild(grupo);
}


// -----------------------------------------------------
// FUNÇÃO 5: CADASTRAR NOVA RECEITA (POST /receitas)
// -----------------------------------------------------
document.getElementById('form-cadastrar-receita').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusMsg = document.getElementById('mensagem-cadastro-receita');
    statusMsg.textContent = 'Cadastrando receita...';

    const nome = document.getElementById('receita-nome').value;
    const preco_venda = parseFloat(document.getElementById('receita-preco').value);
    
    const ingredientes = [];
    let validacao = true;

    // Coleta os dados dos ingredientes dinâmicos
    document.querySelectorAll('.ingrediente-grupo').forEach(grupo => {
        const itemId = grupo.querySelector('select').value;
        const qtd = parseFloat(grupo.querySelector('input').value);
        
        if (!itemId || isNaN(qtd) || qtd <= 0) {
            validacao = false;
        }
        
        if (validacao) {
             ingredientes.push({
                item_id: parseInt(itemId), // Garante que o ID seja inteiro
                quantidade_necessaria: qtd
            });
        }
    });

    if (!validacao) {
        statusMsg.textContent = 'Erro: Preencha todos os campos de ingrediente corretamente (ID e Qtd > 0).';
        return;
    }
    
    const novaReceita = { nome, preco_venda, ingredientes };

    try {
        const resposta = await fetch(API_BASE_RECEITAS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaReceita)
        });

        const dadosResposta = await resposta.json();

        if (resposta.ok && resposta.status === 201) {
            statusMsg.textContent = `Receita "${dadosResposta.receita.nome}" cadastrada com sucesso! (ID: ${dadosResposta.receita.id})`;
            document.getElementById('form-cadastrar-receita').reset();
            document.getElementById('ingredientes-container').innerHTML = ''; // Limpa ingredientes
            carregarReceitas(); // Atualiza a lista de receitas
        } else if (resposta.status === 409) {
             statusMsg.textContent = dadosResposta.erro;
        } else {
            statusMsg.textContent = 'Erro ao cadastrar: ' + (dadosResposta.erro || resposta.statusText);
        }

    } catch (erro) {
        statusMsg.textContent = 'Erro de conexão com a API ao cadastrar receita.';
        console.error('Erro de API:', erro);
    }
});


// -----------------------------------------------------
// FUNÇÃO 6: CARREGAR/LISTAR RECEITAS (GET)
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
        
        if (Array.isArray(receitas)) {
             statusMsg.textContent = `Receitas carregadas com sucesso. Total de ${receitas.length} pratos.`;
             
             receitas.forEach(receita => {
                const linha = tbody.insertRow();
                linha.insertCell().textContent = receita.id;
                linha.insertCell().textContent = receita.nome;
                linha.insertCell().textContent = `R$ ${parseFloat(receita.preco_venda || 0).toFixed(2)}`;
                linha.insertCell().textContent = 'Ver Detalhes...'; 
                
                const celulaVenda = linha.insertCell();
                celulaVenda.innerHTML = 
                    `<button data-id="${receita.id}" data-nome="${receita.nome}" onclick="abrirModalVenda(this.dataset.id, this.dataset.nome)">Vender</button>`;

                const celulaAcoes = linha.insertCell();
                celulaAcoes.innerHTML = 
                    `<button data-id="${receita.id}">Editar</button>` + 
                    `<button data-id="${receita.id}" onclick="alert('Excluir Receita não implementado na API.')">Excluir</button>`;
            });

        } else {
             statusMsg.textContent = receitas.mensagem || 'Erro desconhecido ao carregar receitas.';
        }

    } catch (erro) {
        statusMsg.textContent = 'Erro ao carregar receitas: Verifique se a API está rodando.';
        console.error('Erro de API:', erro);
    }
}

// -----------------------------------------------------
// FUNÇÃO 7: VENDER RECEITA (POST /:id/vender)
// -----------------------------------------------------
// ... (mantenha a função venderReceita inalterada)

async function venderReceita(receitaId) {
    const statusMsg = document.getElementById('mensagem-receita');
    statusMsg.textContent = `Processando venda da Receita ID ${receitaId}...`;
    
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

// Evento que aciona a função de adicionar campo de ingrediente
document.getElementById('adicionar-ingrediente').addEventListener('click', criarCampoIngrediente);

// Evento que mostra o formulário de cadastro de receita
document.getElementById('botao-nova-receita').addEventListener('click', () => {
    // Esconde a lista de receitas, mostra o formulário
    document.getElementById('cadastro-receita-section').style.display = 'block';
    document.getElementById('separador-receitas').style.display = 'block';
    
    // Garante que o estoque esteja carregado antes de mostrar o formulário
    if (estoqueDisponivel.length === 0) {
        carregarEstoque();
    }
    // Liga o formulário de adição de item à nova função
document.getElementById('form-adicionar-item').addEventListener('submit', adicionarNovoItem);
});



// Inicializa os eventos auxiliares (modal e botões)
document.getElementById('botao-carregar').addEventListener('click', carregarEstoque);
document.getElementById('botao-carregar-receitas').addEventListener('click', carregarReceitas);

document.getElementById('confirmar-venda').addEventListener('click', () => {
    const receitaId = document.getElementById('confirmar-venda').dataset.receitaId;
    venderReceita(receitaId);
});

function abrirModalVenda(receitaId, nomeReceita) {
    document.getElementById('nome-receita-venda').textContent = nomeReceita;
    document.getElementById('confirmar-venda').dataset.receitaId = receitaId;
    document.getElementById('modal-venda').style.display = 'block';
}

// Carrega o estoque e as receitas ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    carregarEstoque();
    carregarReceitas();
});