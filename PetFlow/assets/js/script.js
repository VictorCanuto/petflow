console.log("🚀 PetFlow Script Carregado com Sucesso!");

document.addEventListener('DOMContentLoaded', function() {

    // =========================================================
    // 0. INICIALIZAR TOOLTIPS DO BOOTSTRAP (Usado na tela Pets)
    // =========================================================
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

    // =========================================================
    // 0.1 MOTOR DO MODAL UNIVERSAL (Alerta e Confirmação)
    // =========================================================
    const modalUniversalHTML = `
    <div class="modal fade" id="modalUniversal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content border-0 shadow-lg rounded-4">
                <div class="modal-body p-4 text-center">
                    <div id="modalUniversalIcone" class="mb-3"></div>
                    <h5 class="fw-bold text-dark mb-2" id="modalUniversalTitulo"></h5>
                    <p class="text-secondary mb-4 small" id="modalUniversalMensagem"></p>
                    <div class="d-flex gap-2 justify-content-center" id="modalUniversalBotoes">
                        </div>
                </div>
            </div>
        </div>
    </div>`;
    
    // Injeta o HTML "escondido" dentro da página atual
    document.body.insertAdjacentHTML('beforeend', modalUniversalHTML);
    const modalUnivElement = document.getElementById('modalUniversal');
    const modalUniversal = new bootstrap.Modal(modalUnivElement);

    // FUNÇÃO 1: ALERTA BONITO (Substitui o alert)
    window.mostrarAlerta = function(mensagem, titulo = 'Aviso', isErro = false) {
        document.getElementById('modalUniversalTitulo').innerText = titulo;
        document.getElementById('modalUniversalMensagem').innerText = mensagem;
        document.getElementById('modalUniversalIcone').innerHTML = isErro 
            ? '<i class="bi bi-x-circle-fill text-danger" style="font-size: 3rem;"></i>' 
            : '<i class="bi bi-check-circle-fill text-success" style="font-size: 3rem;"></i>';
        
        document.getElementById('modalUniversalBotoes').innerHTML = `
            <button type="button" class="btn btn-primary-custom px-4 rounded-pill fw-bold w-100" data-bs-dismiss="modal">OK</button>
        `;
        modalUniversal.show();
    };

    // FUNÇÃO 2: CONFIRMAÇÃO BONITA (Substitui o confirm)
    window.mostrarConfirmacao = function(mensagem, titulo = 'Atenção') {
        return new Promise((resolve) => {
            document.getElementById('modalUniversalTitulo').innerText = titulo;
            document.getElementById('modalUniversalMensagem').innerText = mensagem;
            document.getElementById('modalUniversalIcone').innerHTML = '<i class="bi bi-exclamation-triangle-fill text-warning" style="font-size: 3rem;"></i>';
            
            document.getElementById('modalUniversalBotoes').innerHTML = `
                <button type="button" class="btn btn-light border px-4 rounded-pill fw-bold text-secondary w-50" data-bs-dismiss="modal" id="btnUniversalCancelar">Cancelar</button>
                <button type="button" class="btn btn-danger px-4 rounded-pill fw-bold shadow-sm w-50" id="btnUniversalConfirmar">Excluir</button>
            `;
            
            modalUniversal.show();

            // Se clicar em Excluir
            document.getElementById('btnUniversalConfirmar').onclick = () => {
                modalUniversal.hide();
                resolve(true);
            };

            // Se clicar em Cancelar
            document.getElementById('btnUniversalCancelar').onclick = () => {
                resolve(false);
            };

            // Se fechar clicando fora da caixa ou no ESC
            modalUnivElement.addEventListener('hidden.bs.modal', function onHide() {
                resolve(false);
                modalUnivElement.removeEventListener('hidden.bs.modal', onHide);
            }, { once: true });
        });
    };

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
        const confirmou = await mostrarConfirmacao('Todos os pets e agendamentos deste cliente também serão apagados.', 'Excluir Cliente?');
        
        if (confirmou) {
            try {
                const resposta = await fetch(`http://localhost:3000/clientes/${id}`, { method: 'DELETE' });

                if (resposta.ok) {
                    mostrarAlerta('Cliente excluído com sucesso!', 'Tudo certo!');
                    carregarClientes();
                } else {
                    const resultado = await resposta.json();
                    mostrarAlerta(resultado.erro, 'Ops, ocorreu um erro', true);
                }
            } catch (erro) {
                mostrarAlerta('Erro ao se comunicar com o servidor.', 'Erro de Conexão', true);
            }
        }
    };

    // D. FUNÇÃO PARA PREENCHER O MODAL AO CLICAR EM "EDITAR PERFIL"
    window.abrirModalEdicaoPet = function(pet) {
        // Muda o título e guarda o ID invisível
        document.getElementById('tituloModalPet').innerText = 'Editar Perfil do Pet';
        document.getElementById('idPetId').value = pet.id_pet;
        
        // Preenche as caixas de texto com os dados do banco
        document.getElementById('clienteIdPet').value = pet.id_cliente;
        document.getElementById('nomePet').value = pet.nome;
        document.getElementById('especiePet').value = pet.especie;
        document.getElementById('racaPet').value = pet.raca || '';
        document.getElementById('idadePet').value = pet.idade || '';
        document.getElementById('obsPet').value = pet.observacoes_saude || '';
    };

    // E. FUNÇÃO PARA EXCLUIR O PET
    window.excluirPet = async function(id) {
        const confirmou = await mostrarConfirmacao('O histórico deste animal será perdido.', 'Excluir Pet?');
        
        if (confirmou) {
            try {
                const resposta = await fetch(`http://localhost:3000/pets/${id}`, { method: 'DELETE' });

                if (resposta.ok) {
                    mostrarAlerta('Pet removido da galeria.', 'Tudo certo!');
                    carregarPets(); 
                } else {
                    const resultado = await resposta.json();
                    mostrarAlerta(resultado.erro, 'Erro', true);
                }
            } catch (erro) {
                mostrarAlerta('Erro ao se comunicar com o servidor.', 'Erro', true);
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


    // =========================================================
    // MODULO PETS: 
    // =========================================================

    // A. FUNÇÃO PARA POPULAR O SELECT DE TUTORES (prepararNovoPet)
    window.prepararNovoPet = async function() {
        document.getElementById('tituloModalPet').innerText = 'Cadastrar Novo Pet';
        document.getElementById('formNovoPet').reset();
        document.getElementById('idPetId').value = '';

        const select = document.getElementById('clienteIdPet');
        select.innerHTML = '<option value="">Carregando tutores...</option>';

        try {
            const resposta = await fetch('http://localhost:3000/clientes');
            const clientes = await resposta.json();
            
            select.innerHTML = '<option value="">Selecione o Tutor...</option>';
            clientes.forEach(c => {
                select.innerHTML += `<option value="${c.id_cliente}">${c.nome_completo}</option>`;
            });
        } catch (e) {
            select.innerHTML = '<option value="">Erro ao carregar tutores</option>';
        }
    };

    // B. SALVAR UM NOVO PET NO BANCO
    const formPet = document.getElementById('formNovoPet');
    if (formPet) {
        formPet.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const btn = document.getElementById('btnSalvarPet');
            const textoOriginal = btn.innerText;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Salvando...';
            btn.disabled = true;

            const dadosPet = {
                id_cliente: document.getElementById('clienteIdPet').value,
                nome: document.getElementById('nomePet').value,
                especie: document.getElementById('especiePet').value,
                raca: document.getElementById('racaPet').value,
                idade: document.getElementById('idadePet').value,
                observacoes_saude: document.getElementById('obsPet').value
            };

            try {
                const idPetEdit = document.getElementById('idPetId').value;
                const metodo = idPetEdit ? 'PUT' : 'POST';
                const url = idPetEdit ? `http://localhost:3000/pets/${idPetEdit}` : 'http://localhost:3000/pets';

                const resposta = await fetch(url, {
                    method: metodo,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosPet)
                });

                if (resposta.ok) {
                    bootstrap.Modal.getInstance(document.getElementById('modalPet')).hide();
                    formPet.reset();
                    document.getElementById('idPetId').value = '';
                    carregarPets(); 
                } else {
                    const resultado = await resposta.json();
                    alert('❌ Erro: ' + resultado.erro);
                }
            } catch (erro) {
                alert('Erro ao comunicar com o servidor.');
            } finally {
                btn.innerHTML = textoOriginal;
                btn.disabled = false;
            }
        });
    }

    // C. BUSCAR OS PETS E DESENHAR OS CARDS
    const galeriaPets = document.getElementById('galeriaPets');

    async function carregarPets() {
        if (!galeriaPets) return;

        try {
            const resposta = await fetch('http://localhost:3000/pets');
            const pets = await resposta.json();

            galeriaPets.innerHTML = '';

            if (pets.length === 0) {
                galeriaPets.innerHTML = '<div class="col-12 text-center text-secondary py-5">Nenhum pet cadastrado ainda. Comece adicionando um!</div>';
                return;
            }

            pets.forEach(pet => {
                const classeAvatar = pet.especie === 'Gato' ? 'avatar-cat' : 'avatar-dog';
                
                let badgeHtml = '';
                if (pet.observacoes_saude && pet.observacoes_saude.trim() !== '') {
                    badgeHtml = `
                        <span class="position-absolute top-0 end-0 mt-3 me-3 badge rounded-pill"
                              style="background-color: #FEE2E2; color: #991B1B;" title="Observação de Saúde">
                            <i class="bi bi-exclamation-triangle me-1"></i> Atenção
                        </span>
                    `;
                }

                const divCard = document.createElement('div');
                divCard.className = 'col-md-6 col-lg-4 col-xl-3';
                divCard.innerHTML = `
                    <div class="card border-0 shadow-sm rounded-4 h-100 position-relative p-3 transition-hover">
                        ${badgeHtml}
                        <div class="d-flex flex-column align-items-center mt-3 mb-3">
                            <div class="avatar-box avatar-lg ${classeAvatar} mb-3"></div>
                            <h5 class="fw-bold text-dark mb-0">${pet.nome}</h5>
                            <small class="text-secondary">${pet.raca || 'Sem raça definida'}</small>
                        </div>
                        <hr class="text-secondary opacity-25">
                        <div class="px-2">
                            <p class="mb-1 small text-secondary"><strong>Tutor:</strong> ${pet.nome_tutor}</p>
                            <p class="mb-3 small text-secondary"><strong>Idade:</strong> ${pet.idade ? pet.idade + ' anos' : 'Não informada'}</p>
                        </div>
                        <div class="mt-auto d-flex gap-2">
                            <button onclick='abrirModalEdicaoPet(${JSON.stringify(pet).replace(/'/g, "&#39;")})' class="btn btn-light flex-grow-1 rounded-pill btn-sm fw-bold text-primary-custom border" data-bs-toggle="modal" data-bs-target="#modalPet">
                                Editar Perfil
                            </button>
                            <button onclick="excluirPet(${pet.id_pet})" class="btn btn-outline-danger rounded-pill btn-sm px-3 shadow-sm">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                galeriaPets.appendChild(divCard);
            });
        } catch (erro) {
            console.error('Erro ao carregar pets:', erro);
            galeriaPets.innerHTML = '<div class="col-12 text-center text-danger py-5">Erro ao tentar se comunicar com o banco de dados.</div>';
        }
    }

    carregarPets();