```markdown
# Contexto do Projeto: PetFlow

## 1. Visão Geral
O **PetFlow** é um sistema web responsivo para gestão de petshops. O projeto é dividido em duas frentes: um Painel Administrativo para os funcionários e uma interface mobile-first chamada "Jornada" para os tutores acompanharem seus pets em tempo real.

## 2. Stack Tecnológica
* **HTML5:** Estrutura semântica.
* **CSS3:** Estilos customizados globais e utilitários via `:root`, além de animações de UI.
* **JavaScript (Vanilla):** Lógica de manipulação do DOM, simulação de buscas, consumo da API REST e atualização de status em tempo real.
* **Framework CSS:** Bootstrap 5.3.2 (via CDN) para grid, modais, tooltips e ícones (Bootstrap Icons).
* **Back-end:** Node.js com Express para servidor de API REST.
* **Banco de Dados:** SQLite (`petflow.db`) para armazenamento persistente dos dados.

## 3. Estrutura de Arquivos e Telas
* `/index.html`: Landing page com apresentação do produto e links para o sistema.
* `/login.html`: Tela de login administrativo com autenticação simulada e redirecionamento para o dashboard.
* `/pages/dashboard.html`: Visão geral administrativa com métricas e painel "Acontecendo Agora" (dados estáticos/simulados).
* `/pages/agendamentos.html`: Gerenciamento de horários com botões para atualizar o status do pet (via Modal) e simulação de busca de clientes/pets (dados estáticos/simulados).
* `/pages/clientes.html`: Tabela de gestão de tutores e formulário de cadastro integrados dinamicamente com o back-end.
* `/pages/pets.html`: Galeria em cards dos pets cadastrados, com exibição de avatares, tutores associados e tooltips (integrada dinamicamente com o back-end).
* `/pages/jornada.html`: Interface mobile-first (timeline e notas do tosador).
* `/assets/css/style.css`: Arquivo central de estilos e responsividade.
* `/assets/js/script.js`: Comportamento dinâmico do front-end e consumo da API do back-end.
* `/server.js`: API back-end em Express que gerencia as conexões e operações com o banco de dados.
* `/schema.sql`: Definição de esquema do banco de dados relacional.
* `/petflow.db`: Banco de dados relacional SQLite local.

## 4. Banco de Dados e API Back-end
O back-end do PetFlow é estruturado em SQLite com as seguintes tabelas (definidas em `/schema.sql`):
* `Cliente`: Contém dados de contato e CPF único.
* `Pet`: Cadastro dos animais vinculados a um tutor (`id_cliente`).
* `Usuario`: Controle de acesso de funcionários.
* `Agendamento`: Agenda vinculando pet, funcionário, data, hora, serviço e status.
* `Registro_Jornada`: Timeline de status do pet para a interface de Jornada.

O servidor Express (`/server.js`) roda na porta 3000 e expõe as seguintes rotas de API:
* **Clientes (`/clientes`)**: CRUD completo (POST, GET, PUT, DELETE).
* **Pets (`/pets`)**: CRUD completo (POST, GET, PUT, DELETE) com dados relacionais de tutor.

## 5. Padrões de CSS e Design (style.css)
* **Variáveis Globais:** Utilização de CSS Variables (`--color-primary`, `--color-secondary`) para consistência de cores.
* **Cores de Status:** Padronização visual para status `warning` (Em atendimento), `success` (Finalizado) e `danger` (Alertas).
* **Componentes Customizados:** Classes como `.avatar-box`, `.avatar-dog` e `.avatar-cat` substituem estilos inline para fotos de perfil.
* **Timeline (Jornada):** Construída com pseudo-elementos (`::before`) e classes `.completed` e `.active` (com animação `@keyframes pulse`).
* **Responsividade Extrema (Mobile App):** Sidebar lateral no desktop se transforma em uma "Bottom Navigation Bar" fixa no rodapé em telas menores.

## 6. Lógica JavaScript (script.js)
* **Consumo de API Dinâmico:** Utilização de chamadas `fetch` assíncronas para carregar, adicionar, editar e excluir dados de Clientes e Pets no servidor.
* **Modal Universal:** Módulo centralizado para exibição de alertas e confirmações de exclusão customizados.
* **Tooltips:** Inicialização global dos tooltips do Bootstrap.
* **Motor de Busca Local:** Lógica de "Busca Inteligente" ignorando acentos (`removerAcentos`) para filtrar listas de dropdown personalizadas.
* **Gestão de Status Dinâmico:** Identificação de modais e alteração dinâmica de classes, Badges e ícones conforme o progresso do atendimento.

## 7. Situação Atual
* **Autenticação Administrativa:** Implementado login administrativo real com tokens stateless criptografados, validação em banco de dados e proteção de rotas no front-end e back-end.
* **Clientes e Pets:** Totalmente integrados entre front-end e back-end relacional com persistência e protegidos por autenticação.
* **Dashboard e Agendamentos:** Layouts prontos e funcionais no front-end, operando atualmente com dados estáticos de simulação.
* **Timeline/Jornada:** Estrutura pronta para ser integrada com o banco de dados.
```