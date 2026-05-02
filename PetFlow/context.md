```markdown
# Contexto do Projeto: PetFlow

## 1. Visão Geral
O **PetFlow** é um sistema web responsivo para gestão de petshops[cite: 3]. O projeto é dividido em duas frentes: um Painel Administrativo para os funcionários e uma interface mobile-first chamada "Jornada" para os tutores acompanharem seus pets em tempo real[cite: 3].

## 2. Stack Tecnológica
* **HTML5:** Estrutura semântica[cite: 3].
* **CSS3:** Estilos customizados globais e utilitários via `:root`, além de animações de UI[cite: 3].
* **JavaScript (Vanilla):** Lógica de manipulação do DOM, simulação de buscas e atualização de status em tempo real[cite: 3].
* **Framework:** Bootstrap 5.3.2 (via CDN) para grid, modais, tooltips e ícones (Bootstrap Icons)[cite: 3].

## 3. Estrutura de Arquivos e Telas
* `/index.html`: Landing page com apresentação do produto e links para o sistema[cite: 3].
* `/pages/dashboard.html`: Visão geral administrativa com métricas e painel "Acontecendo Agora"[cite: 3].
* `/pages/agendamentos.html`: Gerenciamento de horários com botões para atualizar o status do pet (via Modal) e simulação de busca de clientes/pets[cite: 3].
* `/pages/clientes.html`: Tabela de gestão de tutores e formulário de cadastro[cite: 3].
* `/pages/pets.html`: Galeria em cards dos pets cadastrados, exibindo avatares e tooltips com informações de saúde (alergias/vacinas)[cite: 3].
* `/pages/jornada.html`: Interface com largura máxima de 480px, contendo uma "Timeline" dinâmica e carrossel de notas do tosador para o cliente final[cite: 3].
* `/assets/css/style.css`: Arquivo central de estilos e responsividade[cite: 3].
* `/assets/js/script.js`: Arquivo central de comportamento e interatividade[cite: 3].

## 4. Padrões de CSS e Design (style.css)
* **Variáveis Globais:** Utilização de CSS Variables (`--color-primary: #0D9488`, `--color-secondary: #F97316`) para consistência de cores[cite: 3].
* **Cores de Status:** Padronização visual para status `warning` (Em atendimento), `success` (Finalizado) e `danger` (Alertas)[cite: 3].
* **Componentes Customizados:** Classes como `.avatar-box`, `.avatar-dog` e `.avatar-cat` substituem estilos inline para fotos de perfil[cite: 3].
* **Timeline (Jornada):** Construída com pseudo-elementos (`::before`) e classes `.completed` e `.active` (com animação `@keyframes pulse`)[cite: 3].
* **Responsividade Extrema (Mobile App):** O `@media (max-width: 767.98px)` transforma a `sidebar` lateral de desktop em uma "Bottom Navigation Bar" fixa no rodapé da tela para navegação mobile[cite: 3].

## 5. Lógica JavaScript (script.js)
* **Tooltips:** Inicialização global dos tooltips do Bootstrap[cite: 3].
* **Animações de Feedback:** Os botões de submissão de formulário alteram o texto para "Processando...", bloqueiam o botão, exibem um `alert` de sucesso e fecham o modal após 1 segundo[cite: 3].
* **Motor de Busca Local:** Lógica de "Busca Inteligente" ignorando acentos (`removerAcentos`) para filtrar listas de dropdown personalizadas (simulando um auto-complete para tutores e pets)[cite: 3].
* **Gestão de Status Dinâmico:** A lógica identifica qual modal de status foi aberto e, ao selecionar uma opção, atualiza a classe CSS e o HTML (incluindo o ícone) da *Badge* correspondente na tabela, além de pintar o botão selecionado no modal[cite: 3].

## 6. Situação Atual
O front-end está completo e refatorado[cite: 3]. O HTML está limpo, o CSS segue o princípio DRY (Don't Repeat Yourself) e o JavaScript manipula apenas classes em vez de estilos inline brutos[cite: 3].
```