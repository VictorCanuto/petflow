console.log("🚀 PetFlow Script Carregado com Sucesso!");

document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

    // Mostrar aviso se aberto via arquivo local
    if (window.location.protocol === 'file:') {
        const banner = document.createElement('div');
        banner.className = 'alert alert-danger text-center m-0 rounded-0 border-0 border-bottom border-danger-subtle';
        banner.style.cssText = 'position: sticky; top: 0; z-index: 1060; font-size: 0.9rem;';
        
        const isLandingPage = window.location.pathname.toLowerCase().endsWith('index.html') || window.location.pathname.endsWith('/') || !window.location.pathname.toLowerCase().includes('.html');
        const targetUrl = isLandingPage ? 'http://localhost:3000/' : 'http://localhost:3000/login.html';
        
        banner.innerHTML = `<strong>⚠️ Modo de Arquivo Local Detectado:</strong> Para que o banco de dados e o login funcionem corretamente, acesse o sistema através de <a href="${targetUrl}" class="alert-link text-decoration-underline">${targetUrl}</a>`;
        document.body.prepend(banner);
    }

    // Limpar token ao clicar em "Sair do Sistema"
    document.querySelectorAll('a').forEach(botao => {
        if (botao.textContent.trim().toLowerCase() === 'sair do sistema') {
            botao.addEventListener('click', function() {
                localStorage.removeItem('petflow_token');
            });
        }
    });

    // =========================================================
    // 0.0 WRAPPER PARA FETCH COM AUTENTICAÇÃO
    // =========================================================
    window.fetchComAutenticacao = async function(url, options = {}) {
        const token = localStorage.getItem('petflow_token');
        if (!options.headers) {
            options.headers = {};
        }
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        try {
            const resposta = await fetch(url, options);
            if (resposta.status === 401) {
                localStorage.removeItem('petflow_token');
                window.location.href = '../login.html';
                return new Response(JSON.stringify({ erro: 'Não autorizado' }), { status: 401 });
            }
            return resposta;
        } catch (erro) {
            console.error('Erro de rede na requisição:', erro);
            throw erro;
        }
    };

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
                const url = idClienteEdit ? `${API_BASE}/clientes/${idClienteEdit}` : `${API_BASE}/clientes`;

                const resposta = await fetchComAutenticacao(url, {
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
                    mostrarAlerta(resultado.erro || 'Erro ao salvar cliente.', 'Erro', true);
                }
            } catch (erro) {
                mostrarAlerta('Erro ao conectar com o servidor. O servidor está ligado?', 'Erro', true);
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
            const resposta = await fetchComAutenticacao(`${API_BASE}/clientes`);
            if (!resposta.ok) {
                if (resposta.status === 401) return; // Redirecionamento já em andamento
                const errData = await resposta.json();
                throw new Error(errData.erro || 'Erro desconhecido');
            }
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
                const resposta = await fetchComAutenticacao(`${API_BASE}/clientes/${id}`, { method: 'DELETE' });

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

    // Função auxiliar para popular o select de tutores no modal do pet
    window.carregarSeletorTutores = async function(idSelecionado = '') {
        const select = document.getElementById('clienteIdPet');
        if (!select) return;
        
        select.innerHTML = '<option value="">Carregando tutores...</option>';
        try {
            const resposta = await fetchComAutenticacao(`${API_BASE}/clientes`);
            const clientes = await resposta.json();
            
            select.innerHTML = '<option value="">Selecione o Tutor...</option>';
            clientes.forEach(c => {
                const selected = c.id_cliente == idSelecionado ? 'selected' : '';
                select.innerHTML += `<option value="${c.id_cliente}" ${selected}>${c.nome_completo}</option>`;
            });
        } catch (e) {
            select.innerHTML = '<option value="">Erro ao carregar tutores</option>';
        }
    };

    // D. FUNÇÃO PARA PREENCHER O MODAL AO CLICAR EM "EDITAR PERFIL"
    window.abrirModalEdicaoPet = async function(pet) {
        // Muda o título e guarda o ID invisível
        document.getElementById('tituloModalPet').innerText = 'Editar Perfil do Pet';
        document.getElementById('idPetId').value = pet.id_pet;
        
        // Carrega o seletor de tutores com o tutor do pet pré-selecionado
        await carregarSeletorTutores(pet.id_cliente);
        
        // Preenche as caixas de texto com os dados do banco
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
                const resposta = await fetchComAutenticacao(`${API_BASE}/pets/${id}`, { method: 'DELETE' });

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
    // 3. TROCA DE STATUS (Antiga removida - migrada para Agendamentos dinâmico)
    // =========================================================

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
        if (!listaOpcoes) return; // Evita erros se o dropdown customizado não tiver a lista no DOM
        
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

                if (msgSemResultado) {
                    if (!encontrouAlgo) {
                        msgSemResultado.classList.remove('d-none');
                    } else {
                        msgSemResultado.classList.add('d-none');
                    }
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


    // =========================================================
    // MODULO PETS: 
    // =========================================================

    // A. FUNÇÃO PARA POPULAR O SELECT DE TUTORES (prepararNovoPet)
    window.prepararNovoPet = async function() {
        document.getElementById('tituloModalPet').innerText = 'Cadastrar Novo Pet';
        document.getElementById('formNovoPet').reset();
        document.getElementById('idPetId').value = '';

        await carregarSeletorTutores();
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
                const url = idPetEdit ? `${API_BASE}/pets/${idPetEdit}` : `${API_BASE}/pets`;

                const resposta = await fetchComAutenticacao(url, {
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
                    mostrarAlerta(resultado.erro || 'Erro ao salvar pet.', 'Erro', true);
                }
            } catch (erro) {
                mostrarAlerta('Erro ao comunicar com o servidor.', 'Erro', true);
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
            const resposta = await fetchComAutenticacao(`${API_BASE}/pets`);
            if (!resposta.ok) {
                if (resposta.status === 401) return; // Redirecionamento já em andamento
                const errData = await resposta.json();
                throw new Error(errData.erro || 'Erro desconhecido');
            }
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
                    const obsEscaped = pet.observacoes_saude.replace(/'/g, "\\'").replace(/"/g, "&quot;");
                    const nomeEscaped = pet.nome.replace(/'/g, "\\'").replace(/"/g, "&quot;");
                    badgeHtml = `
                        <span class="position-absolute top-0 end-0 mt-3 me-3 badge rounded-pill"
                              style="background-color: #FEE2E2; color: #991B1B; cursor: pointer;" 
                              title="Clique para ver observações de saúde"
                              onclick="mostrarAlerta('${obsEscaped}', 'Atenção: Saúde de ${nomeEscaped}', true)">
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

    // =========================================================
    // MODULO AGENDAMENTOS:
    // =========================================================
    const tabelaAgendamentos = document.getElementById('tabelaAgendamentos');
    const dataFiltroAgenda = document.getElementById('dataFiltroAgenda');
    const btnFiltroHoje = document.getElementById('btnFiltroHoje');

    // Inicialização da Data
    if (dataFiltroAgenda) {
        const hoje = new Date();
        const yyyy = hoje.getFullYear();
        const mm = String(hoje.getMonth() + 1).padStart(2, '0');
        const dd = String(hoje.getDate()).padStart(2, '0');
        dataFiltroAgenda.value = `${yyyy}-${mm}-${dd}`;

        dataFiltroAgenda.addEventListener('change', () => {
            carregarAgendamentos(dataFiltroAgenda.value);
        });
    }

    if (btnFiltroHoje && dataFiltroAgenda) {
        btnFiltroHoje.addEventListener('click', () => {
            const hoje = new Date();
            const yyyy = hoje.getFullYear();
            const mm = String(hoje.getMonth() + 1).padStart(2, '0');
            const dd = String(hoje.getDate()).padStart(2, '0');
            dataFiltroAgenda.value = `${yyyy}-${mm}-${dd}`;
            carregarAgendamentos(dataFiltroAgenda.value);
        });
    }

    async function carregarAgendamentos(data) {
        if (!tabelaAgendamentos) return;
        
        try {
            const resposta = await fetchComAutenticacao(`${API_BASE}/agendamentos?data=${data}`);
            if (!resposta.ok) {
                if (resposta.status === 401) return;
                const errData = await resposta.json();
                throw new Error(errData.erro || 'Erro desconhecido');
            }
            const agendamentos = await resposta.json();

            tabelaAgendamentos.innerHTML = '';

            if (agendamentos.length === 0) {
                tabelaAgendamentos.innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-4">Nenhum agendamento para esta data.</td></tr>';
                return;
            }

            agendamentos.forEach(a => {
                const tr = document.createElement('tr');
                const classeAvatar = a.especie_pet === 'Gato' ? 'avatar-cat' : 'avatar-dog';
                
                let badgeClass = 'bg-light text-secondary border';
                let badgeIcon = 'bi-clock';
                if (a.status_atual === 'Em atendimento') {
                    badgeClass = '';
                    tr.style.backgroundColor = '#FFFBEB'; // Destaque para atendimento atual
                }
                
                let badgeStyle = '';
                if (a.status_atual === 'Em atendimento') {
                    badgeStyle = 'background-color: #FEF3C7; color: #D97706;';
                    badgeIcon = 'bi-arrow-repeat';
                } else if (a.status_atual === 'Finalizado') {
                    badgeClass = 'bg-success-subtle text-success border border-success-subtle';
                    badgeIcon = 'bi-check-circle';
                }

                tr.innerHTML = `
                    <td class="ps-4 fw-bold text-dark fs-5">${a.horario}</td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <div class="avatar-box avatar-sm ${classeAvatar}"></div>
                            <span class="fw-bold text-dark">${a.nome_pet}</span>
                        </div>
                    </td>
                    <td class="text-secondary">${a.nome_tutor}</td>
                    <td class="text-secondary fw-semibold">${a.tipo_servico}</td>
                    <td>
                        <span class="badge rounded-pill px-3 py-2 ${badgeClass}" style="${badgeStyle}">
                            <i class="bi ${badgeIcon} me-1"></i> ${a.status_atual}
                        </span>
                    </td>
                    <td class="text-end pe-4">
                        <button onclick='abrirModalStatusAgendamento(${JSON.stringify(a).replace(/'/g, "&#39;")})' class="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold">
                            Atualizar Status
                        </button>
                    </td>
                `;
                tabelaAgendamentos.appendChild(tr);
            });
        } catch (erro) {
            console.error('Erro ao carregar agendamentos:', erro);
            tabelaAgendamentos.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">Erro ao tentar se comunicar com o banco de dados.</td></tr>';
        }
    }

    if (tabelaAgendamentos && dataFiltroAgenda) {
        carregarAgendamentos(dataFiltroAgenda.value);
    }

    // --- BUSCA DINÂMICA NO NOVO AGENDAMENTO ---
    const tutorInput = document.getElementById('novoAgendamentoTutorInput');
    const tutorLista = document.getElementById('novoAgendamentoTutorLista');
    const idClienteInput = document.getElementById('novoAgendamentoIdCliente');
    
    const petInput = document.getElementById('novoAgendamentoPetInput');
    const petLista = document.getElementById('novoAgendamentoPetLista');
    const idPetInput = document.getElementById('novoAgendamentoIdPet');

    let todosClientes = [];
    let todosPets = [];

    if (tutorInput) {
        tutorInput.addEventListener('focus', async () => {
            try {
                const resposta = await fetchComAutenticacao(`${API_BASE}/clientes`);
                todosClientes = await resposta.json();
                renderizarOpcoesTutor(todosClientes);
                tutorLista.classList.remove('d-none');
            } catch (e) {
                console.error(e);
            }
        });

        tutorInput.addEventListener('input', (e) => {
            const termo = removerAcentos(e.target.value);
            const filtrados = todosClientes.filter(c => removerAcentos(c.nome_completo).includes(termo));
            renderizarOpcoesTutor(filtrados);
        });
    }

    function renderizarOpcoesTutor(lista) {
        tutorLista.innerHTML = '';
        if (lista.length === 0) {
            tutorLista.innerHTML = '<li class="list-group-item text-muted text-center">Nenhum cliente encontrado</li>';
            return;
        }
        lista.forEach(c => {
            const li = document.createElement('li');
            li.className = 'list-group-item list-group-item-action';
            li.style.cursor = 'pointer';
            li.innerText = `${c.nome_completo} (CPF: ${c.cpf})`;
            li.addEventListener('click', () => {
                tutorInput.value = c.nome_completo;
                idClienteInput.value = c.id_cliente;
                tutorLista.classList.add('d-none');
                
                // Habilita e carrega pets desse tutor
                petInput.disabled = false;
                petInput.value = '';
                petInput.placeholder = 'Digite para buscar pet...';
                idPetInput.value = '';
                carregarPetsDoTutor(c.id_cliente);
            });
            tutorLista.appendChild(li);
        });
    }

    async function carregarPetsDoTutor(idCliente) {
        try {
            const resposta = await fetchComAutenticacao(`${API_BASE}/pets`);
            const pets = await resposta.json();
            // Filtra apenas os pets do cliente selecionado
            todosPets = pets.filter(p => p.id_cliente == idCliente);
            renderizarOpcoesPet(todosPets);
        } catch (e) {
            console.error(e);
        }
    }

    if (petInput) {
        petInput.addEventListener('focus', () => {
            petLista.classList.remove('d-none');
        });

        petInput.addEventListener('input', (e) => {
            const termo = removerAcentos(e.target.value);
            const filtrados = todosPets.filter(p => removerAcentos(p.nome).includes(termo));
            renderizarOpcoesPet(filtrados);
        });
    }

    function renderizarOpcoesPet(lista) {
        petLista.innerHTML = '';
        if (lista.length === 0) {
            petLista.innerHTML = '<li class="list-group-item text-muted text-center">Nenhum pet encontrado</li>';
            return;
        }
        lista.forEach(p => {
            const li = document.createElement('li');
            li.className = 'list-group-item list-group-item-action';
            li.style.cursor = 'pointer';
            li.innerText = `${p.nome} (${p.especie} - ${p.raca || 'S/R'})`;
            li.addEventListener('click', () => {
                petInput.value = p.nome;
                idPetInput.value = p.id_pet;
                petLista.classList.add('d-none');
            });
            petLista.appendChild(li);
        });
    }

    // Fechar dropdowns customizados ao clicar fora
    document.addEventListener('click', (e) => {
        if (tutorInput && tutorLista && !tutorInput.contains(e.target) && !tutorLista.contains(e.target)) {
            tutorLista.classList.add('d-none');
        }
        if (petInput && petLista && !petInput.contains(e.target) && !petLista.contains(e.target)) {
            petLista.classList.add('d-none');
        }
    });

    // Limpar modal de agendamento ao abrir
    const btnNovoAgendamento = document.querySelector('[data-bs-target="#modalNovoAgendamento"]');
    if (btnNovoAgendamento) {
        btnNovoAgendamento.addEventListener('click', () => {
            const form = document.getElementById('formNovoAgendamento');
            if (form) {
                form.reset();
                idClienteInput.value = '';
                idPetInput.value = '';
                if (petInput) {
                    petInput.disabled = true;
                    petInput.placeholder = 'Selecione um tutor primeiro...';
                }
            }
        });
    }

    // Enviar formulário de novo agendamento
    const formNovoAgendamento = document.getElementById('formNovoAgendamento');
    if (formNovoAgendamento) {
        formNovoAgendamento.addEventListener('submit', async (e) => {
            e.preventDefault();

            const idPet = idPetInput.value;
            const idCliente = idClienteInput.value;
            const dataVal = document.getElementById('novoAgendamentoData').value;
            const horarioVal = document.getElementById('novoAgendamentoHorario').value;
            const servicoVal = document.getElementById('novoAgendamentoServico').value;

            if (!idPet || !idCliente) {
                mostrarAlerta('Por favor, selecione um tutor e um pet sugeridos na lista.', 'Atenção', true);
                return;
            }

            const btn = document.getElementById('btnConfirmarAgendamento');
            const originalText = btn.innerText;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Salvando...';
            btn.disabled = true;

            try {
                const resposta = await fetchComAutenticacao(`${API_BASE}/agendamentos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_pet: idPet,
                        data_agendamento: dataVal,
                        horario: horarioVal,
                        tipo_servico: servicoVal
                    })
                });

                if (resposta.ok) {
                    bootstrap.Modal.getInstance(document.getElementById('modalNovoAgendamento')).hide();
                    formNovoAgendamento.reset();
                    idClienteInput.value = '';
                    idPetInput.value = '';
                    petInput.disabled = true;
                    petInput.placeholder = 'Selecione um tutor primeiro...';
                    
                    // Recarregar a agenda para a data inserida
                    dataFiltroAgenda.value = dataVal;
                    carregarAgendamentos(dataVal);
                    
                    mostrarAlerta('Agendamento cadastrado com sucesso!', 'Tudo certo!');
                } else {
                    const errData = await resposta.json();
                    mostrarAlerta(errData.erro || 'Erro ao salvar agendamento.', 'Erro', true);
                }
            } catch (err) {
                console.error(err);
                mostrarAlerta('Erro de rede ao cadastrar agendamento.', 'Erro', true);
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // Abrir modal de status do agendamento
    window.abrirModalStatusAgendamento = async function(agendamento) {
        document.getElementById('tituloModalStatus').innerText = `Status de ${agendamento.nome_pet}`;
        document.getElementById('statusAgendamentoId').value = agendamento.id_agendamento;

        const notaInput = document.getElementById('statusNotaFuncionario');
        if (notaInput) {
            notaInput.value = '';
        }

        const containerBotoes = document.getElementById('statusBotoesContainer');
        if (containerBotoes) {
            containerBotoes.innerHTML = `<div class="text-center py-2"><span class="spinner-border spinner-border-sm text-secondary"></span> Carregando etapas...</div>`;
        }

        const modalElement = document.getElementById('modalStatusAgendamento');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();

        // Buscar última etapa registrada na jornada
        let ultimaEtapa = 'Chegou no Petshop';
        try {
            const resposta = await fetch(`${API_BASE}/jornada/${agendamento.id_agendamento}`);
            if (resposta.ok) {
                const data = await resposta.json();
                const historico = data.historico || [];
                if (historico.length > 0) {
                    ultimaEtapa = historico[historico.length - 1].etapa_jornada;
                }
            }
        } catch (e) {
            console.error('Erro ao obter última etapa da jornada:', e);
        }

        if (containerBotoes) {
            const isApenasBanho = !(agendamento.tipo_servico || '').toLowerCase().includes('tosa');
            let botoesHTML = '';

            // 1. Chegou no Petshop (Aguardando)
            if (ultimaEtapa === 'Chegou no Petshop') {
                botoesHTML += `
                    <button class="btn text-start border rounded-3 fw-bold shadow-sm btn-status-opcao" style="background-color: #F3F4F6; color: #374151;" data-status="Aguardando" data-etapa="Chegou no Petshop">
                        🏠 Chegou no Petshop <small class="text-muted fw-normal">(Atual)</small>
                    </button>
                `;
            } else {
                botoesHTML += `
                    <button class="btn btn-light text-start border rounded-3 fw-semibold text-secondary btn-status-opcao" data-status="Aguardando" data-etapa="Chegou no Petshop">
                        🏠 Chegou no Petshop
                    </button>
                `;
            }

            // 2. Iniciar Banho (Em atendimento)
            if (ultimaEtapa === 'Banho Iniciado') {
                botoesHTML += `
                    <button class="btn text-start border rounded-3 fw-bold shadow-sm btn-status-opcao" style="color: #D97706; background-color: #FEF3C7; border-color: #FCD34D !important;" data-status="Em atendimento" data-etapa="Banho Iniciado">
                        🚿 Iniciar Banho <small class="text-muted fw-normal">(Atual)</small>
                    </button>
                `;
            } else {
                botoesHTML += `
                    <button class="btn btn-light text-start border rounded-3 fw-semibold text-secondary btn-status-opcao" data-status="Em atendimento" data-etapa="Banho Iniciado">
                        🚿 Iniciar Banho
                    </button>
                `;
            }

            // 3. Iniciar Secagem ou Tosa (Em atendimento)
            if (isApenasBanho) {
                if (ultimaEtapa === 'Secagem Iniciada') {
                    botoesHTML += `
                        <button class="btn text-start border rounded-3 fw-bold shadow-sm btn-status-opcao" style="color: #D97706; background-color: #FEF3C7; border-color: #FCD34D !important;" data-status="Em atendimento" data-etapa="Secagem Iniciada">
                            🌬️ Iniciar Secagem <small class="text-muted fw-normal">(Atual)</small>
                        </button>
                    `;
                } else {
                    botoesHTML += `
                        <button class="btn btn-light text-start border rounded-3 fw-semibold text-secondary btn-status-opcao" data-status="Em atendimento" data-etapa="Secagem Iniciada">
                            🌬️ Iniciar Secagem
                        </button>
                    `;
                }
            } else {
                if (ultimaEtapa === 'Tosa Iniciada') {
                    botoesHTML += `
                        <button class="btn text-start border rounded-3 fw-bold shadow-sm btn-status-opcao" style="color: #D97706; background-color: #FEF3C7; border-color: #FCD34D !important;" data-status="Em atendimento" data-etapa="Tosa Iniciada">
                            ✂️ Iniciar Tosa <small class="text-muted fw-normal">(Atual)</small>
                        </button>
                    `;
                } else {
                    botoesHTML += `
                        <button class="btn btn-light text-start border rounded-3 fw-semibold text-secondary btn-status-opcao" data-status="Em atendimento" data-etapa="Tosa Iniciada">
                            ✂️ Iniciar Tosa
                        </button>
                    `;
                }
            }

            botoesHTML += `<hr class="my-2">`;

            // 4. Finalizar Serviço (Finalizado)
            if (ultimaEtapa === 'Pronto para buscar!') {
                botoesHTML += `
                    <button class="btn text-start border rounded-3 fw-bold btn-status-opcao btn-finalizar-opcao" style="background-color: #DCFCE7; color: #166534; border-color: #A7F3D0 !important;" data-status="Finalizado" data-etapa="Pronto para buscar!">
                        ✅ Finalizar Serviço <small class="text-green-800 fw-normal">(Atual)</small>
                    </button>
                `;
            } else {
                botoesHTML += `
                    <button class="btn text-start border rounded-3 fw-bold btn-status-opcao btn-finalizar-opcao" style="background-color: #DCFCE7; color: #166534;" data-status="Finalizado" data-etapa="Pronto para buscar!">
                        ✅ Finalizar Serviço
                    </button>
                `;
            }

            containerBotoes.innerHTML = botoesHTML;
        }
    };

    // Configurar cliques nos botões de status via event delegation
    const containerBotoes = document.getElementById('statusBotoesContainer');
    if (containerBotoes) {
        containerBotoes.addEventListener('click', async function(e) {
            const btn = e.target.closest('.btn-status-opcao');
            if (!btn) return;

            const idAgendamento = document.getElementById('statusAgendamentoId').value;
            const novoStatus = btn.getAttribute('data-status');
            const novaEtapa = btn.getAttribute('data-etapa');
            const notaInput = document.getElementById('statusNotaFuncionario');
            const notaVal = notaInput ? notaInput.value.trim() : '';

            try {
                const resposta = await fetchComAutenticacao(`${API_BASE}/agendamentos/${idAgendamento}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status_atual: novoStatus, etapa_jornada: novaEtapa, nota_funcionario: notaVal })
                });

                if (resposta.ok) {
                    bootstrap.Modal.getInstance(document.getElementById('modalStatusAgendamento')).hide();
                    carregarAgendamentos(dataFiltroAgenda.value);
                } else {
                    const errData = await resposta.json();
                    mostrarAlerta(errData.erro || 'Erro ao atualizar status.', 'Erro', true);
                }
            } catch (err) {
                console.error(err);
                mostrarAlerta('Erro de rede ao atualizar status.', 'Erro', true);
            }
        });
    }

    // Configurar clique no botão de Excluir Agendamento no modal
    const btnExcluirAgendamento = document.querySelector('#modalStatusAgendamento .btn-excluir-agendamento-modal');
    if (btnExcluirAgendamento) {
        btnExcluirAgendamento.addEventListener('click', async () => {
            const idAgendamento = document.getElementById('statusAgendamentoId').value;
            
            // Fechar modal de status primeiro
            bootstrap.Modal.getInstance(document.getElementById('modalStatusAgendamento')).hide();

            const confirmou = await mostrarConfirmacao('Deseja realmente remover este agendamento? Esta ação não pode ser desfeita.', 'Excluir Agendamento?');
            if (confirmou) {
                try {
                    const resposta = await fetchComAutenticacao(`${API_BASE}/agendamentos/${idAgendamento}`, {
                        method: 'DELETE'
                    });

                    if (resposta.ok) {
                        mostrarAlerta('Agendamento removido com sucesso!', 'Tudo certo!');
                        carregarAgendamentos(dataFiltroAgenda.value);
                    } else {
                        const errData = await resposta.json();
                        mostrarAlerta(errData.erro || 'Erro ao excluir agendamento.', 'Erro', true);
                    }
                } catch (err) {
                    console.error(err);
                    mostrarAlerta('Erro de rede ao excluir agendamento.', 'Erro', true);
                }
            }
        });
    }

    // =========================================================
    // MODULO DASHBOARD:
    // =========================================================
    const tabelaAcontecendoAgora = document.getElementById('tabelaAcontecendoAgora');
    if (tabelaAcontecendoAgora) {
        inicializarDashboard();
    }

    async function inicializarDashboard() {
        const hoje = new Date();
        const yyyy = hoje.getFullYear();
        const mm = String(hoje.getMonth() + 1).padStart(2, '0');
        const dd = String(hoje.getDate()).padStart(2, '0');
        const dataHoje = `${yyyy}-${mm}-${dd}`;

        // 1. Formatar data do cabeçalho por extenso
        const dataAtualBadge = document.getElementById('dataAtualBadge');
        if (dataAtualBadge) {
            const opcoes = { day: 'numeric', month: 'long', year: 'numeric' };
            const dataFormatada = hoje.toLocaleDateString('pt-BR', opcoes);
            dataAtualBadge.innerHTML = `<i class="bi bi-calendar3 me-2 text-primary-custom"></i> ${dataFormatada}`;
        }

        // 2. Carregar Métricas dos Cards
        try {
            const resMetricas = await fetchComAutenticacao(`${API_BASE}/dashboard/metricas?data=${dataHoje}`);
            if (resMetricas.ok) {
                const metricas = await resMetricas.json();
                
                const cardTotal = document.getElementById('cardTotalAgendados');
                const cardEmAtendimento = document.getElementById('cardEmAtendimento');
                const cardAguardando = document.getElementById('cardAguardando');

                if (cardTotal) cardTotal.innerText = String(metricas.totalAgendados).padStart(2, '0');
                if (cardEmAtendimento) cardEmAtendimento.innerText = String(metricas.emAtendimento).padStart(2, '0');
                if (cardAguardando) cardAguardando.innerText = String(metricas.aguardando).padStart(2, '0');
            } else {
                console.error('Erro ao buscar métricas do dashboard');
            }
        } catch (e) {
            console.error('Erro de rede ao buscar métricas:', e);
        }

        // 3. Carregar Lista "Acontecendo Agora" (Aguardando ou Em Atendimento)
        try {
            const resAgendamentos = await fetchComAutenticacao(`${API_BASE}/agendamentos?data=${dataHoje}`);
            if (resAgendamentos.ok) {
                const agendamentos = await resAgendamentos.json();
                
                // Filtrar apenas 'Aguardando' ou 'Em atendimento'
                const ativos = agendamentos.filter(a => a.status_atual === 'Aguardando' || a.status_atual === 'Em atendimento');
                
                tabelaAcontecendoAgora.innerHTML = '';
                
                if (ativos.length === 0) {
                    tabelaAcontecendoAgora.innerHTML = `
                        <tr>
                            <td colspan="6" class="text-center text-secondary py-4">
                                Nenhum pet em atendimento ou aguardando no momento.
                            </td>
                        </tr>`;
                    return;
                }

                ativos.forEach(a => {
                    const tr = document.createElement('tr');
                    const classeAvatar = a.especie_pet === 'Gato' ? 'avatar-cat' : 'avatar-dog';
                    
                    let badgeClass = 'bg-light text-secondary border';
                    let badgeStyle = '';
                    let badgeIcon = 'bi-house';
                    
                    if (a.status_atual === 'Em atendimento') {
                        badgeClass = '';
                        badgeStyle = 'background-color: #FEF3C7; color: #D97706;';
                        badgeIcon = 'bi-arrow-repeat';
                    }

                    tr.innerHTML = `
                        <td class="ps-4 fw-bold text-dark">${a.horario}</td>
                        <td>
                            <div class="d-flex align-items-center gap-2">
                                <div class="avatar-box avatar-lg ${classeAvatar} mb-0" style="width: 40px; height: 40px; min-width: 40px;"></div>
                                <div>
                                    <div class="fw-bold text-dark">${a.nome_pet}</div>
                                    <div class="small text-secondary">${a.raca_pet || 'Sem raça'}</div>
                                </div>
                            </div>
                        </td>
                        <td class="text-secondary">${a.nome_tutor}</td>
                        <td class="text-secondary fw-semibold">${a.tipo_servico}</td>
                        <td>
                            <span class="badge rounded-pill px-3 py-2 shadow-sm ${badgeClass}" style="${badgeStyle}">
                                <i class="bi ${badgeIcon} me-1"></i> ${a.status_atual}
                            </span>
                        </td>
                        <td class="text-end pe-4">
                            <a href="jornada.html?agendamento=${a.id_agendamento}" class="btn btn-light btn-sm rounded-pill px-3 fw-bold text-primary-custom border shadow-sm" target="_blank">
                                <i class="bi bi-phone"></i> Ver Visão do Cliente
                            </a>
                        </td>
                    `;
                    tabelaAcontecendoAgora.appendChild(tr);
                });
            } else {
                tabelaAcontecendoAgora.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-danger py-4">
                            Erro ao carregar atendimentos ativos.
                        </td>
                    </tr>`;
            }
        } catch (e) {
            console.error('Erro de rede ao buscar agendamentos:', e);
            tabelaAcontecendoAgora.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger py-4">
                        Erro ao conectar ao servidor.
                    </td>
                </tr>`;
        }
    }

    // --- BUSCA INSTANTÂNEA DE CLIENTES ---
    const inputBuscaClientes = document.getElementById('inputBuscaClientes');
    if (inputBuscaClientes) {
        inputBuscaClientes.addEventListener('input', (e) => {
            const termo = removerAcentos(e.target.value);
            const linhas = document.querySelectorAll('#tabelaClientes tr');
            linhas.forEach(linha => {
                if (linha.cells.length < 4 || linha.querySelector('td[colspan]')) return;
                
                const nome = removerAcentos(linha.cells[0].textContent);
                const contato = removerAcentos(linha.cells[1].textContent);
                const cpf = removerAcentos(linha.cells[2].textContent);
                
                if (nome.includes(termo) || contato.includes(termo) || cpf.includes(termo)) {
                    linha.classList.remove('d-none');
                } else {
                    linha.classList.add('d-none');
                }
            });
        });
    }

    // --- BUSCA INSTANTÂNEA DE PETS ---
    const inputBuscaPets = document.getElementById('inputBuscaPets');
    if (inputBuscaPets) {
        inputBuscaPets.addEventListener('input', (e) => {
            const termo = removerAcentos(e.target.value);
            const cards = document.querySelectorAll('#galeriaPets .col-md-6');
            cards.forEach(card => {
                const nome = removerAcentos(card.querySelector('h5').textContent);
                const raca = removerAcentos(card.querySelector('small').textContent);
                const infoText = removerAcentos(card.querySelector('.px-2').textContent);
                
                if (nome.includes(termo) || raca.includes(termo) || infoText.includes(termo)) {
                    card.classList.remove('d-none');
                } else {
                    card.classList.add('d-none');
                }
            });
        });
    }

    // --- BUSCA INSTANTÂNEA DE AGENDAMENTOS ---
    const inputBuscaAgendamentos = document.getElementById('inputBuscaAgendamentos');
    if (inputBuscaAgendamentos) {
        inputBuscaAgendamentos.addEventListener('input', (e) => {
            const termo = removerAcentos(e.target.value);
            const linhas = document.querySelectorAll('#tabelaAgendamentos tr');
            linhas.forEach(linha => {
                if (linha.cells.length < 6 || linha.querySelector('td[colspan]')) return;
                
                const pet = removerAcentos(linha.cells[1].textContent);
                const tutor = removerAcentos(linha.cells[2].textContent);
                const servico = removerAcentos(linha.cells[3].textContent);
                const status = removerAcentos(linha.cells[4].textContent);
                
                if (pet.includes(termo) || tutor.includes(termo) || servico.includes(termo) || status.includes(termo)) {
                    linha.classList.remove('d-none');
                } else {
                    linha.classList.add('d-none');
                }
            });
        });
    }

    carregarPets();

});