// frontend/script.js

// URLs Base da API
const API_BASE_ITENS = 'http://127.0.0.1:8001/api/v1/itens';
const API_BASE_RECEITAS = 'http://127.0.0.1:8001/api/v1/receitas';

let estoqueDisponivel = []; 

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
        estoqueDisponivel = itens; 
        
        itens.forEach(item => {
            const linha = tbody.insertRow();
            linha.insertCell().textContent = item.id;
            linha.insertCell().textContent = item.nome;
            linha.insertCell().textContent = parseFloat(item.quantidade).toFixed(3); 
            linha.insertCell().textContent = item.unidade || 'N/A';
            
            const celulaAcoes = linha.insertCell();
            celulaAcoes.innerHTML = 
                `<button data-id="${item.id}" data-nome="${item.nome}" data-qtd="${item.quantidade}" data-unidade="${item.unidade}" onclick="abrirModalEdicaoItem(this.dataset)">Editar</button>` +
                `<button data-id="${item.id}" onclick="deletarItem(this.dataset.id)">Excluir</button>`;
        });
        statusMsg.textContent = `Estoque carregado com sucesso. Total de ${itens.length} itens.`;

    } catch (erro) {
        statusMsg.textContent = 'Erro ao carregar estoque: Verifique se a API está rodando.';
        console.error('Erro de API:', erro);
    }
}

// -----------------------------------------------------
// FUNÇÃO 2: ADICIONAR NOVO ITEM (POST /itens)
// -----------------------------------------------------
async function adicionarNovoItem(e) { 
    e.preventDefault();
    const statusMsg = document.getElementById('mensagem-status');
    statusMsg.textContent = 'Adicionando...';

    const nome = document.getElementById('nome').value.trim(); 
    const quantidadeValor = document.getElementById('quantidade').value;
    const unidade = document.getElementById('unidade').value.trim();

    if (!nome || !quantidadeValor || !unidade) {
        statusMsg.textContent = 'Erro: Por favor, preencha todos os campos.';
        return;
    }

    const quantidade = parseFloat(quantidadeValor);
    
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
            carregarEstoque(); 
        } else if (resposta.status === 409) {
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
// FUNÇÃO 3: DELETAR ITEM (DELETE /itens/:id)
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
// FUNÇÃO 4: EDIÇÃO DE ITEM (PUT /itens/:id)
// -----------------------------------------------------
document.getElementById('form-editar-item').addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemId = document.getElementById('edit-item-id').value;
    const statusMsg = document.getElementById('mensagem-edicao-status');
    statusMsg.textContent = 'Salvando alterações...';

    const dadosAtualizados = {
        nome: document.getElementById('edit-nome').value.trim(),
        quantidade: parseFloat(document.getElementById('edit-quantidade').value),
        unidade: document.getElementById('edit-unidade').value.trim()
    };

    try {
        const resposta = await fetch(`${API_BASE_ITENS}/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAtualizados)
        });

        const dadosResposta = await resposta.json();

        if (resposta.ok && resposta.status === 200) {
            statusMsg.textContent = 'Item atualizado com sucesso!';
            document.getElementById('modal-edicao-item').style.display = 'none';
            carregarEstoque(); 
        } else if (resposta.status === 409) {
             statusMsg.textContent = dadosResposta.erro;
        } else {
            statusMsg.textContent = 'Erro ao salvar: ' + (dadosResposta.erro || resposta.statusText);
        }
    } catch (erro) {
        statusMsg.textContent = 'Erro de conexão ao tentar editar.';
        console.error('Erro de API:', erro);
    }
});


// -----------------------------------------------------
// FUNÇÃO 5: CRIA CAMPO DE INGREDIENTE DINÂMICO
// -----------------------------------------------------
function criarCampoIngrediente() {
    const container = document.getElementById('ingredientes-container');
    const grupo = document.createElement('div');
    grupo.className = 'ingrediente-grupo';
    grupo.style.marginBottom = '15px';

    const select = document.createElement('select');
    select.required = true;
    const optDefault = document.createElement('option');
    optDefault.textContent = 'Selecione o Ingrediente (ID)';
    optDefault.value = '';
    select.appendChild(optDefault);

    estoqueDisponivel.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id; 
        option.textContent = `${item.nome} (${item.unidade})`;
        select.appendChild(option);
    });

    const inputQtd = document.createElement('input');
    inputQtd.type = 'number';
    inputQtd.step = '0.001';
    inputQtd.placeholder = 'Qtd. Necessária';
    inputQtd.required = true;
    
    const btnRemover = document.createElement('button');
    btnRemover.type = 'button';
    btnRemover.textContent = 'Remover';
    btnRemover.onclick = () => container.removeChild(grupo);

    grupo.appendChild(select);
    grupo.appendChild(inputQtd);
    grupo.appendChild(btnRemover);
    
    container.appendChild(grupo);
}


// -----------------------------------------------------
// FUNÇÃO 6: CADASTRAR NOVA RECEITA (POST /receitas)
// -----------------------------------------------------
document.getElementById('form-cadastrar-receita').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusMsg = document.getElementById('mensagem-cadastro-receita');
    statusMsg.textContent = 'Cadastrando receita...';

    const nome = document.getElementById('receita-nome').value;
    const preco_venda = parseFloat(document.getElementById('receita-preco').value);
    
    const ingredientes = [];
    let validacao = true;

    document.querySelectorAll('.ingrediente-grupo').forEach(grupo => {
        const itemId = grupo.querySelector('select').value;
        const qtd = parseFloat(grupo.querySelector('input').value);
        
        if (!itemId || isNaN(qtd) || qtd <= 0) {
            validacao = false;
        }
        
        if (validacao) {
             ingredientes.push({
                item_id: parseInt(itemId),
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
            document.getElementById('ingredientes-container').innerHTML = '';
            carregarReceitas(); 
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
// FUNÇÃO 7: CARREGAR/LISTAR RECEITAS (GET /receitas)
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
                linha.insertCell().textContent = 'Detalhes na API...'; 
                
                const celulaVenda = linha.insertCell();
                celulaVenda.innerHTML = 
                    `<button data-id="${receita.id}" data-nome="${receita.nome}" onclick="abrirModalVenda(this.dataset.id, this.dataset.nome)">Vender</button>`;

                const celulaAcoes = linha.insertCell();
                // Botão EDITAR Receita - CHAMA A NOVA FUNÇÃO DE EDIÇÃO DE RECEITA
                celulaAcoes.innerHTML = 
                    `<button data-id="${receita.id}" data-nome="${receita.nome}" data-preco="${receita.preco_venda}" onclick="abrirModalEdicaoReceita(this.dataset)">Editar</button>` + 
                    `<button data-id="${receita.id}" onclick="deletarReceita(this.dataset.id)">Excluir</button>`;
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
// FUNÇÃO 8: DELETAR RECEITA (DELETE /receitas/:id)
// -----------------------------------------------------
async function deletarReceita(receitaId) {
    const confirma = confirm(`Tem certeza que deseja EXCLUIR a Receita ID ${receitaId}? Esta ação também apagará os ingredientes associados.`);
    if (!confirma) return;

    try {
        const resposta = await fetch(`${API_BASE_RECEITAS}/${receitaId}`, {
            method: 'DELETE'
        });

        if (resposta.status === 204) {
            document.getElementById('mensagem-receita').textContent = `Receita ID ${receitaId} excluída com sucesso.`;
            carregarReceitas(); 
        } else if (resposta.status === 404) {
            document.getElementById('mensagem-receita').textContent = `Erro: Receita ID ${receitaId} não encontrada.`;
        } else {
            document.getElementById('mensagem-receita').textContent = `Erro ao excluir. Status: ${resposta.status}`;
        }
    } catch (erro) {
        document.getElementById('mensagem-receita').textContent = 'Erro de conexão ao tentar excluir receita.';
        console.error('Erro de API:', erro);
    }
}


// -----------------------------------------------------
// FUNÇÃO 9: VENDER RECEITA (POST /:id/vender)
// -----------------------------------------------------
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
            carregarEstoque(); 
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
// FUNÇÃO 10: EDIÇÃO DE RECEITA (PUT /receitas/:id) - NOVO
// -----------------------------------------------------
document.getElementById('form-editar-receita').addEventListener('submit', async (e) => {
    e.preventDefault();
    const receitaId = document.getElementById('edit-receita-id').value;
    const statusMsg = document.getElementById('mensagem-edicao-receita-status');
    statusMsg.textContent = 'Salvando alterações...';

    const dadosAtualizados = {
        nome: document.getElementById('edit-receita-nome').value.trim(),
        preco_venda: parseFloat(document.getElementById('edit-receita-preco').value)
    };

    try {
        const resposta = await fetch(`${API_BASE_RECEITAS}/${receitaId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAtualizados)
        });

        const dadosResposta = await resposta.json();

        if (resposta.ok && resposta.status === 200) {
            statusMsg.textContent = 'Receita atualizada com sucesso!';
            document.getElementById('modal-edicao-receita').style.display = 'none';
            carregarReceitas(); // Atualiza a lista principal
        } else if (resposta.status === 409) {
             statusMsg.textContent = dadosResposta.erro;
        } else {
            statusMsg.textContent = 'Erro ao salvar: ' + (dadosResposta.erro || resposta.statusText);
        }
    } catch (erro) {
        statusMsg.textContent = 'Erro de conexão ao tentar editar.';
        console.error('Erro de API:', erro);
    }
});


// -----------------------------------------------------
// EVENTOS INICIAIS E AUXILIARES (CONSOLIDAÇÃO)
// -----------------------------------------------------

// Botão Adicionar Item
document.getElementById('form-adicionar-item').addEventListener('submit', adicionarNovoItem); 

// Botão Adicionar Ingrediente (Dinâmico)
document.getElementById('adicionar-ingrediente').addEventListener('click', criarCampoIngrediente);

// Botão Carregar Estoque
document.getElementById('botao-carregar').addEventListener('click', carregarEstoque);

// Botão Carregar Receitas
document.getElementById('botao-carregar-receitas').addEventListener('click', carregarReceitas);

// Botão Mostrar Formulário de Cadastro de Receita
document.getElementById('botao-nova-receita').addEventListener('click', () => {
    document.getElementById('cadastro-receita-section').style.display = 'block';
    document.getElementById('separador-receitas').style.display = 'block';
    if (estoqueDisponivel.length === 0) {
        carregarEstoque();
    }
});

// Botão de Confirmação de Venda
document.getElementById('confirmar-venda').addEventListener('click', () => {
    const receitaId = document.getElementById('confirmar-venda').dataset.receitaId;
    venderReceita(receitaId);
});

// Função Auxiliar: Abre Modal Venda
function abrirModalVenda(receitaId, nomeReceita) {
    document.getElementById('nome-receita-venda').textContent = nomeReceita;
    document.getElementById('confirmar-venda').dataset.receitaId = receitaId;
    document.getElementById('modal-venda').style.display = 'block';
}

// Função Auxiliar: Abre Modal Edição Item (Estoque)
function abrirModalEdicaoItem(dadosItem) {
    document.getElementById('item-id-edicao').textContent = dadosItem.id;
    document.getElementById('item-nome-edicao').textContent = dadosItem.nome;
    document.getElementById('edit-item-id').value = dadosItem.id;
    document.getElementById('edit-nome').value = dadosItem.nome;
    document.getElementById('edit-quantidade').value = parseFloat(dadosItem.qtd).toFixed(3);
    document.getElementById('edit-unidade').value = dadosItem.unidade;

    document.getElementById('modal-edicao-item').style.display = 'block';
    document.getElementById('mensagem-edicao-status').textContent = '';
}

// [NOVO] Função Auxiliar: Abre Modal Edição Receita
function abrirModalEdicaoReceita(dadosReceita) {
    document.getElementById('receita-id-edicao').textContent = dadosReceita.id;
    document.getElementById('receita-nome-edicao').textContent = dadosReceita.nome;
    document.getElementById('edit-receita-id').value = dadosReceita.id;
    document.getElementById('edit-receita-nome').value = dadosReceita.nome;
    document.getElementById('edit-receita-preco').value = parseFloat(dadosReceita.preco).toFixed(2);

    document.getElementById('modal-edicao-receita').style.display = 'block';
    document.getElementById('mensagem-edicao-receita-status').textContent = '';
}


// Carrega estoque e receitas ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    carregarEstoque();
    carregarReceitas();
});