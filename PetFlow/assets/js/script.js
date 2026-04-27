console.log("🚀 PetFlow Script Carregado com Sucesso!");

document.addEventListener('DOMContentLoaded', function() {

    // =========================================================
    // 0. INICIALIZAR TOOLTIPS DO BOOTSTRAP (Usado na tela Pets)
    // =========================================================
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

    // =========================================================
    // 1. ANIMAÇÃO DE SALVAR (Clientes e Agendamentos)
    // =========================================================
    const botoesSalvar = document.querySelectorAll('.btn-salvar-agendamento, #modalCliente .btn-primary-custom');
    
    botoesSalvar.forEach(btn => {
        btn.addEventListener('click', function() {
            const textoOriginal = this.innerText;
            this.innerHTML = '⏳ Processando...';
            this.disabled = true;
            
            setTimeout(() => {
                this.innerHTML = textoOriginal;
                this.disabled = false;
                alert('✅ Operação realizada com sucesso!');
                
                const modalEl = this.closest('.modal');
                const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                if (modalInstance) modalInstance.hide();
                
                const form = modalEl.querySelector('form');
                if (form) form.reset();
            }, 1000); 
        });
    });

    // =========================================================
    // 2. TROCA DE STATUS DA TABELA E DO MODAL
    // =========================================================
    // Usamos a classe específica que adicionamos no HTML agora
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
                if (novoStatusTextoOriginal.includes('Finalizar')) {
                    badgeAlvo.className = 'badge rounded-pill px-3 py-2 shadow-sm';
                    badgeAlvo.style.cssText = 'background-color: #DCFCE7; color: #166534;';
                    badgeAlvo.innerHTML = '<i class="bi bi-check-circle me-1"></i> Finalizado';
                } 
                else if (novoStatusTextoOriginal.includes('Iniciar') || novoStatusTextoOriginal.includes('Banho')) {
                    badgeAlvo.className = 'badge rounded-pill px-3 py-2 shadow-sm';
                    badgeAlvo.style.cssText = 'background-color: #FEF3C7; color: #D97706;';
                    badgeAlvo.innerHTML = '<i class="bi bi-arrow-repeat me-1"></i> Em atendimento';
                } 
                else if (novoStatusTextoOriginal.includes('Chegou')) {
                    badgeAlvo.className = 'badge rounded-pill px-3 py-2 bg-light text-secondary border';
                    badgeAlvo.style.cssText = '';
                    badgeAlvo.innerHTML = '<i class="bi bi-house me-1"></i> Aguardando';
                }
            }

            // --- B. ATUALIZAR O VISUAL DO PRÓPRIO MODAL ---
            const modalBody = this.closest('.modal-body');
            const todosBotoes = modalBody.querySelectorAll('.btn-status-opcao');

            todosBotoes.forEach(b => {
                b.className = 'btn btn-light text-start border rounded-3 fw-semibold text-secondary btn-status-opcao';
                b.style.cssText = '';
                b.innerText = b.innerText.replace(' (Atual)', '').trim();

                if (b.innerText.includes('Finalizar')) {
                    b.className = 'btn text-start border rounded-3 fw-bold btn-status-opcao';
                    b.style.cssText = 'background-color: #DCFCE7; color: #166534;';
                }
            });

            // Pinta o que foi clicado
            this.className = 'btn text-start border rounded-3 fw-bold shadow-sm btn-status-opcao';
            this.style.cssText = 'background-color: #FEF3C7; color: #D97706; border-color: #FCD34D !important;';
            this.innerText = novoStatusTextoOriginal + ' (Atual)';
            
            // O HTML vai fechar a janela sozinho agora!
        });
    });

    // =========================================================
    // 3. BUSCA INTELIGENTE (GOOGLE-LIKE) IGNORANDO ACENTOS
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