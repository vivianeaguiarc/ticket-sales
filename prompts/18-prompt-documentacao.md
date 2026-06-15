Você é um Tech Lead Backend Sênior, especialista em Node.js, TypeScript, Express, MySQL, Clean Architecture, Docker, Segurança, Testes Automatizados, Documentação Técnica e preparação de projetos para portfólio e entrevistas.

Assuma o projeto Ticket Sales no estado atual.

Objetivo:
Finalizar a documentação técnica e de portfólio do projeto Ticket Sales para currículo, GitHub e entrevistas técnicas.

Contexto:
O projeto possui:

- API REST Node.js + TypeScript + Express
- MySQL
- autenticação JWT
- partners/customers/events/tickets/reservations/purchases
- reserva com expiração automática
- compra e cancelamento
- transações
- controle de concorrência
- audit logs
- event history
- health check
- Docker
- deploy
- testes unitários/integrados/E2E
- rate limiting, helmet, CORS e logs estruturados
- evolução arquitetural para Clean Architecture

Tarefas:

1. Atualizar README.md com:

- visão geral do projeto
- problema que o sistema resolve
- principais funcionalidades
- regras de negócio
- arquitetura
- stack
- estrutura de pastas
- fluxos principais
- como rodar localmente
- como rodar com Docker
- como configurar .env
- como rodar testes
- como rodar coverage
- como testar com api.http
- como validar no MySQL
- endpoints principais
- status do projeto
- próximos passos

2. Criar ou atualizar docs/architecture.md com:

- arquitetura inicial
- arquitetura alvo
- explicação das camadas:
  - domain
  - application
  - infra
  - presentation
  - shared
- motivo da migração incremental
- módulos migrados
- decisões arquiteturais
- trade-offs

3. Criar ou atualizar docs/business-rules.md com:

- ciclo de vida dos tickets:
  available -> reserved -> sold
- reserva
- expiração automática
- compra
- cancelamento
- histórico
- auditoria
- regras de concorrência

4. Criar ou atualizar docs/interview-guide.md com:

- como explicar o projeto em entrevista
- como explicar transações
- como explicar concorrência
- como explicar testes
- como explicar arquitetura
- respostas curtas para perguntas comuns

5. Revisar api.http:

- manter fluxo feliz funcional
- remover blocos quebrados
- adicionar comentários claros
- manter tokens e variáveis bem organizados

6. Atualizar .env.example:

- PORT
- DB_HOST
- DB_PORT
- DB_USER
- DB_PASSWORD
- DB_NAME
- JWT_SECRET
- CORS_ORIGIN
- RATE_LIMIT_WINDOW_MS
- RATE_LIMIT_MAX_REQUESTS

7. Garantir que:

- pnpm lint passa
- pnpm test passa
- pnpm build passa

Ao finalizar, entregue:

# O QUE FOI FEITO

# DOCUMENTOS CRIADOS/ATUALIZADOS

# COMO USAR NO CURRÍCULO

# COMO EXPLICAR EM ENTREVISTA

# MENSAGEM DE COMMIT

Sugestão:
docs: finalize project documentation for portfolio and interviews

Regras:

- Não inventar funcionalidades que não existam.
- Não alterar regra de negócio sem necessidade.
- Não quebrar código.
- Ser claro, técnico e profissional.
