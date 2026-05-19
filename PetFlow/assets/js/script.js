console.log("🚀 PetFlow Script Carregado com Sucesso!");

document.addEventListener('DOMContentLoaded', function() {

    // =========================================================
    // 0. INICIALIZAR TOOLTIPS DO BOOTSTRAP (Usado na tela Pets)
    // =========================================================
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

    // =========================================================
    // 1. C (CREATE) - SALVAR NOVO CLIENTE DE VERDADE
    // =========================================================
    const formCliente = document.getElementById('formNovoCliente');
    
    if (formCliente) {
        formCliente.addEventListener('submit', async function(e) {
            e.preventDefault(); // Impede a tela de recarregar
            
            const btn = document.getElementById('btnSalvarCliente');
            const textoOriginal = btn.innerText;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Salvando...';
            btn.disabled = true;

            // Pega os valores que o usuário digitou
            const dadosCliente = {
                nome_completo: document.getElementById('nomeCliente').value,
                cpf: document.getElementById('cpfCliente').value,
                telefone: document.getElementById('telefoneCliente').value,
                email: document.getElementById('emailCliente').value
            };

            try {
                // Descobre se é para Criar ou Atualizar olhando para o campo invisível
                const idClienteEdit = document.getElementById('idClienteId').value;
                const metodo = idClienteEdit ? 'PUT' : 'POST';
                const url = idClienteEdit ? `http://localhost:3000/clientes/${idClienteEdit}` : 'http://localhost:3000/clientes';

                const resposta = await fetch(url, {
                    method: metodo,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosCliente)
                });

                const resultado = await resposta.json();

                if (resposta.ok) {
                    // Limpa o modal, esconde ele e recarrega a tabela automaticamente!
                    bootstrap.Modal.getInstance(document.getElementById('modalCliente')).hide();
                    formCliente.reset();
                    document.getElementById('idClienteId').value = '';
                    carregarClientes(); 
                } else {
                    alert('❌ Erro: ' + resultado.erro);
                }
            } catch (erro) {
                alert('Erro ao conectar com o servidor. O servidor está ligado?');
            } finally {
                btn.innerHTML = textoOriginal;
                btn.disabled = false;
            }
        });
    }

    // =========================================================
    // 2. R (READ) - CARREGAR CLIENTES NA TABELA
    // =========================================================
    const tabelaClientes = document.getElementById('tabelaClientes');

    async function carregarClientes() {
        // Se a tabela não existir nesta página, não faz nada
        if (!tabelaClientes) return; 

        try {
            // Busca os dados do back-end
            const resposta = await fetch('http://localhost:3000/clientes');
            const clientes = await resposta.json();

            // Limpa o "carregando"
            tabelaClientes.innerHTML = '';

            // Se o banco estiver vazio
            if (clientes.length === 0) {
                tabelaClientes.innerHTML = '<tr><td colspan="4" class="text-center text-secondary py-4">Nenhum cliente cadastrado ainda.</td></tr>';
                return;
            }

            // Para cada cliente no banco, desenha uma linha (<tr>)
            clientes.forEach(cliente => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="ps-4 fw-bold text-dark">${cliente.nome_completo}</td>
                    <td>
                        <div class="d-flex flex-column">
                            <span>${cliente.telefone}</span>
                            <small class="text-secondary">${cliente.email || 'Sem e-mail'}</small>
                        </div>
                    </td>
                    <td>
                        <span class="badge bg-light text-secondary border rounded-pill px-3 py-2">
                            CPF: ${cliente.cpf}
                        </span>
                    </td>
                    <td class="text-end pe-4">
                        <button onclick='abrirModalEdicao(${JSON.stringify(cliente)})' class="btn btn-sm btn-light text-secondary rounded-pill border px-3 fw-semibold" data-bs-toggle="modal" data-bs-target="#modalCliente">Editar</button>
                        <button onclick="excluirCliente(${cliente.id_cliente})" class="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold ms-2">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                tabelaClientes.appendChild(tr);
            });
        } catch (erro) {
            console.error('Erro ao carregar clientes:', erro);
            tabelaClientes.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-4">Erro ao tentar se comunicar com o banco de dados.</td></tr>';
        }
    }

    // Chama a função toda vez que o script rodar
    carregarClientes();

    // Função para limpar o modal quando clicar em "+ Novo Cliente"
    window.prepararNovoCliente = function() {
        document.getElementById('tituloModalCliente').innerText = 'Cadastrar Novo Cliente';
        document.getElementById('formNovoCliente').reset();
        document.getElementById('idClienteId').value = ''; // Limpa o ID invisível
    };

    // Função para preencher o modal quando clicar em "Editar"
    window.abrirModalEdicao = function(cliente) {
        document.getElementById('tituloModalCliente').innerText = 'Editar Cliente';
        document.getElementById('idClienteId').value = cliente.id_cliente; // Guarda o ID invisível
        document.getElementById('nomeCliente').value = cliente.nome_completo;
        document.getElementById('cpfCliente').value = cliente.cpf;
        document.getElementById('telefoneCliente').value = cliente.telefone;
        document.getElementById('emailCliente').value = cliente.email || '';
    };

    // Função global para excluir cliente
    window.excluirCliente = async function(id) {
        // Confirmação de segurança antes de apagar
        if (confirm('Tem certeza que deseja excluir este cliente? Todos os pets e agendamentos dele também serão apagados.')) {
            try {
                const resposta = await fetch(`http://localhost:3000/clientes/${id}`, {
                    method: 'DELETE'
                });

                if (resposta.ok) {
                    // Recarrega a tabela para o cliente sumir instantaneamente da tela
                    carregarClientes();
                } else {
                    const resultado = await resposta.json();
                    alert('Erro: ' + resultado.erro);
                }
            } catch (erro) {
                alert('Erro ao se comunicar com o servidor.');
            }
        }
    };

    // =========================================================
    // 3. TROCA DE STATUS DA TABELA E DO MODAL
    // =========================================================
    const botoesMudarStatus = document.querySelectorAll('.btn-status-opcao');

    botoesMudarStatus.forEach(btn => {
        btn.addEventListener('click', function() {
            const novoStatusTextoOriginal = this.innerText.replace(' (Atual)', '').trim();
            const modalPaiId = this.closest('.modal').id;
            
            // --- A. ATUALIZAR A TABELA ---
            let badgeAlvo;
            if (modalPaiId === 'modalStatusRex') {
                badgeAlvo = document.querySelectorAll('table tbody tr')[0].querySelector('.badge');
            } else if (modalPaiId === 'modalStatusMia') {
                badgeAlvo = document.querySelectorAll('table tbody tr')[1].querySelector('.badge');
            }

            if (badgeAlvo) {
                // Limpa as classes antigas do badge
                badgeAlvo.className = 'badge rounded-pill px-3 py-2 shadow-sm';

                // Aplica a nova classe e texto dependendo do status
                if (novoStatusTextoOriginal.includes('Finalizar')) {
                    badgeAlvo.classList.add('badge-success-custom');
                    badgeAlvo.innerHTML = '<i class="bi bi-check-circle me-1"></i> Finalizado';
                } 
                else if (novoStatusTextoOriginal.includes('Iniciar') || novoStatusTextoOriginal.includes('Banho')) {
                    badgeAlvo.classList.add('badge-warning-custom');
                    badgeAlvo.innerHTML = '<i class="bi bi-arrow-repeat me-1"></i> Em atendimento';
                } 
                else if (novoStatusTextoOriginal.includes('Chegou')) {
                    badgeAlvo.className = 'badge rounded-pill px-3 py-2 bg-light text-secondary border';
                    badgeAlvo.innerHTML = '<i class="bi bi-house me-1"></i> Aguardando';
                }
            }

            // --- B. ATUALIZAR O VISUAL DO PRÓPRIO MODAL ---
            const modalBody = this.closest('.modal-body');
            const todosBotoes = modalBody.querySelectorAll('.btn-status-opcao');

            todosBotoes.forEach(b => {
                b.className = 'btn btn-light text-start border rounded-3 fw-semibold text-secondary btn-status-opcao';
                b.innerHTML = b.innerHTML.replace(' (Atual)', '').trim();

                if (b.innerText.includes('Finalizar')) {
                    b.classList.remove('btn-light', 'text-secondary');
                    b.classList.add('badge-success-custom');
                }
            });

            // Pinta o botão que foi clicado
            this.className = 'btn text-start border rounded-3 fw-bold shadow-sm btn-status-opcao badge-warning-custom border-warning';
            this.innerHTML = novoStatusTextoOriginal + ' <small class="text-muted fw-normal">(Atual)</small>';
        });
    });

    // =========================================================
    // 4. BUSCA INTELIGENTE (GOOGLE-LIKE) IGNORANDO ACENTOS
    // =========================================================
    const removerAcentos = (texto) => {
        return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const dropdownsCustomizados = document.querySelectorAll('.custom-dropdown');

    dropdownsCustomizados.forEach(dropdown => {
        const inputBusca = dropdown.querySelector('.input-busca');
        const listaOpcoes = dropdown.querySelector('.lista-opcoes');
        const itens = listaOpcoes.querySelectorAll('li:not(.sem-resultado)');
        const msgSemResultado = listaOpcoes.querySelector('.sem-resultado');

        if(inputBusca) {
            inputBusca.addEventListener('focus', () => {
                listaOpcoes.classList.remove('d-none');
            });

            inputBusca.addEventListener('input', (e) => {
                const termoDigitado = removerAcentos(e.target.value);
                let encontrouAlgo = false;

                itens.forEach(item => {
                    const textoItem = removerAcentos(item.innerText);
                    if (textoItem.includes(termoDigitado)) {
                        item.classList.remove('d-none');
                        encontrouAlgo = true;
                    } else {
                        item.classList.add('d-none');
                    }
                });

                if (!encontrouAlgo) {
                    msgSemResultado.classList.remove('d-none');
                } else {
                    msgSemResultado.classList.add('d-none');
                }
            });

            itens.forEach(item => {
                item.addEventListener('click', () => {
                    inputBusca.value = item.innerText;
                    listaOpcoes.classList.add('d-none');
                });
            });

            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) {
                    listaOpcoes.classList.add('d-none');
                }
            });
        }
    });

});