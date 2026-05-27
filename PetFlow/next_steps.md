# Próximos Passos: PetFlow

Este documento descreve as etapas necessárias para finalizar o desenvolvimento do **PetFlow**, conectando todas as telas do front-end ao back-end em Node.js e banco de dados SQLite, tornando o sistema 100% funcional.

---

## 📅 Status Atual do Projeto
* **Banco de Dados (SQLite):** Estrutura física pronta com as tabelas `Cliente`, `Pet`, `Usuario`, `Agendamento` e `Registro_Jornada`.
* **Clientes (`/clientes`):** Integração completa (CRUD funcional).
* **Pets (`/pets`):** Integração completa (CRUD funcional com associação ao tutor).
* **Autenticação, Dashboard, Agendamentos e Jornada:** Front-end completo, porém funcionando com dados estáticos e simulações.

---

## 🛠️ Etapas para Finalização (Plano de Trabalho)

### 1. Autenticação Administrativa Real (Login)
Atualmente, o login em `login.html` apenas simula o acesso.
* [x] **Back-end (`/server.js`):**
  * Criar rota `POST /login` para verificar credenciais na tabela `Usuario`.
  * Implementar criptografia de senhas (ex: `bcrypt` ou hashes simples se mantendo minimalista).
  * Gerar token de sessão básico (ou JWT simples) para proteger rotas administrativas.
* [x] **Banco de Dados:**
  * Criar script de seed (`seed.js` ou carga inicial automática no `server.js`) para registrar o primeiro usuário administrador no banco.
* [x] **Front-end (`login.html` & Admin Pages):**
  * Alterar a submissão de formulário para fazer `POST /login`.
  * Armazenar o estado de login no `localStorage` ou `sessionStorage`.
  * Adicionar um script de proteção no topo de cada página da pasta `/pages/` que redireciona para `/login.html` se o usuário não estiver autenticado.

---

### 2. Integração Completa de Agendamentos
A tela de agendamentos (`pages/agendamentos.html`) exibe dados dinâmicos vinculados ao SQLite.
* [x] **Back-end (`/server.js`):**
  * Criar endpoints para `Agendamento`:
    * `GET /agendamentos`: Listar todos os agendamentos de uma data específica (filtro por query param `?data=YYYY-MM-DD`). Deve fazer `JOIN` para trazer o nome do pet, nome do tutor e nome do usuário.
    * `POST /agendamentos`: Criar novo agendamento.
    * `PUT /agendamentos/:id/status`: Rota específica para atualizar o status (`status_atual`) de um agendamento.
    * `DELETE /agendamentos/:id`: Excluir um agendamento.
* [x] **Front-end (`/assets/js/script.js` & `pages/agendamentos.html`):**
  * Substituir a tabela estática por renderização dinâmica baseada no `GET /agendamentos`.
  * No modal "+ Novo Agendamento", carregar a lista de Tutores e Pets de forma dinâmica (fazendo requisições para `/clientes` e `/pets`) substituindo as opções estáticas.
  * Implementar o envio do formulário de agendamento fazendo `POST /agendamentos`.
  * Vincular os modais de status de cada pet na tabela para fazerem o `PUT /agendamentos/:id/status` e atualizar a tabela após a resposta.

---

### 3. Integração do Dashboard em Tempo Real
O dashboard administrativo exibe métricas do dia e a tabela "Acontecendo Agora" dinamicamente.
* [x] **Back-end (`/server.js`):**
  * Criar rota `GET /dashboard/metricas` que retorna:
    * Total de agendamentos no dia atual.
    * Total de pets com status 'Em atendimento'.
    * Total de pets com status 'Aguardando'.
* [x] **Front-end (`pages/dashboard.html`):**
  * Consumir a rota `/dashboard/metricas` para atualizar os três cards de contadores no topo da página.
  * Renderizar a tabela "Acontecendo Agora" dinamicamente com os agendamentos ativos (status 'Aguardando' ou 'Em atendimento').
  * Corrigir os links "Ver Visão do Cliente" para redirecionar para a jornada passando o ID do agendamento real na URL: `jornada.html?agendamento={id_agendamento}`.

---

### 4. Linha do Tempo e Jornada do Tutor
A tela do tutor (`pages/jornada.html`) deve exibir o progresso em tempo real do pet associado ao agendamento.
* [x] **Back-end (`/server.js`):**
  * Criar rota `GET /jornada/:id_agendamento` para buscar o histórico de eventos da tabela `Registro_Jornada`.
  * Implementar gatilho automático: sempre que o status de um agendamento for alterado (via `PUT /agendamentos/:id/status`), inserir automaticamente uma nova linha na tabela `Registro_Jornada` (ex: "Banho Iniciado", "Serviço Concluído").
  * Permitir que funcionários adicionem notas customizadas durante o atendimento.
* [x] **Front-end (`pages/jornada.html`):**
  * Extrair o `id_agendamento` dos parâmetros da URL (`URLSearchParams`).
  * Buscar os dados dinamicamente de `GET /jornada/:id_agendamento`.
  * Renderizar a timeline dinâmica, ativando as bolinhas de progresso (`.completed` e `.active`) baseando-se no último status registrado no banco de dados.

---

### 5. Correções de Consistência e Rastreamento
* [x] **Dashboard (`pages/dashboard.html` & `assets/js/script.js`):** Adicionar colunas de Horário e Serviço à tabela "Acontecendo Agora" para eliminar a ambiguidade visual de pets com múltiplos agendamentos no mesmo dia.
* [x] **Jornada do Cliente (`pages/jornada.html`):**
  * Implementar formulário de busca de agendamento em `jornada.html` quando o ID do agendamento não for especificado na URL, evitando que o tutor veja um mock fixo sem explicação.
  * Corrigir a validação do tipo de serviço para garantir que a etapa de tosa e as notas de tosa não apareçam em agendamentos do tipo "Apenas Banho".
* [x] **Landing Page (`index.html`):** Apontar o botão "Ver Demonstração" para a URL de demonstração correspondente (`pages/jornada.html?demo=true`).

---

## 6. Validações de Negócio & Segurança
* [ ] Garantir que não existam agendamentos duplicados para o mesmo pet no mesmo horário.
* [ ] Bloquear a exclusão de clientes se eles possuírem agendamentos em aberto (ou deletar em cascata com confirmação clara).
* [ ] Tratar erros de banco de dados no back-end de forma amigável, retornando JSON com mensagens claras para o front-end exibir nos modais.

