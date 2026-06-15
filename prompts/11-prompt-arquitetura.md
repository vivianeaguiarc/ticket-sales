Você é um Arquiteto de Software Sênior, Tech Lead Backend e especialista em Node.js, TypeScript, Express, MySQL, Clean Architecture, Hexagonal Architecture, DDD, SOLID, testes automatizados e refatoração incremental de sistemas legados.

Assuma o projeto Ticket Sales no estado atual.

Objetivo:
Iniciar uma evolução arquitetural gradual do projeto, sem quebrar funcionalidades existentes.

Contexto:
O projeto já possui:

- controllers
- services
- use-cases
- models
- jobs
- testes automatizados
- MySQL
- Docker
- health check
- audit logs
- histórico
- fluxos de tickets, reservas, compras, cancelamento e expiração

Hoje a arquitetura está próxima de MVC com services/use-cases. A meta é evoluir gradualmente para uma arquitetura mais limpa e sustentável.

NÃO reescreva o projeto inteiro.

━━━━━━━━━━━━━━━━━━━━━━━
FASE 1 — AUDITORIA ARQUITETURAL
━━━━━━━━━━━━━━━━━━━━━━━

Analise a estrutura atual:

- src/controller
- src/services
- src/use-cases
- src/models
- src/jobs
- src/database.ts
- src/app.ts
- src/server.ts
- testes existentes

Identifique:

- acoplamento excessivo entre use cases e models
- regras de negócio dentro de controllers
- services com muitas responsabilidades
- dependência direta de MySQL nos casos de uso
- falta de interfaces/repositories
- duplicação de lógica
- inconsistências entre services e use-cases

━━━━━━━━━━━━━━━━━━━━━━━
FASE 2 — PROPOSTA DE NOVA ESTRUTURA
━━━━━━━━━━━━━━━━━━━━━━━

Propor uma evolução incremental para esta estrutura:

src/
application/
use-cases/
domain/
entities/
repositories/
errors/
infra/
database/
repositories/
presentation/
controllers/
routes/
shared/

Não mover tudo de uma vez.

Escolher apenas UM módulo para iniciar a migração.

Sugestão:
Começar pelo módulo Tickets ou Reservations, porque são o coração da regra de negócio.

━━━━━━━━━━━━━━━━━━━━━━━
FASE 3 — MIGRAÇÃO PILOTO
━━━━━━━━━━━━━━━━━━━━━━━

Escolher UM fluxo para refatorar primeiro.

Recomendação:
Refatorar o fluxo de reserva de tickets.

Criar:

- Domain entity Ticket
- Domain entity Reservation
- Repository interface TicketRepository
- Repository interface ReservationRepository
- Infra repository MySQLTicketRepository
- Infra repository MySQLReservationRepository
- Application use case CreateReservationUseCase refatorado usando interfaces
- Controller adaptado para chamar o novo use case

Regras:

- manter rotas atuais
- manter contrato da API
- manter testes passando
- não remover código antigo até nova implementação estar validada
- evitar big bang refactor

━━━━━━━━━━━━━━━━━━━━━━━
FASE 4 — TESTES
━━━━━━━━━━━━━━━━━━━━━━━

Criar ou ajustar testes para:

- use case isolado sem MySQL
- repository com mock
- controller mantendo contrato HTTP
- regressão do fluxo anterior

Garantir:

- pnpm test
- pnpm lint
- pnpm build

━━━━━━━━━━━━━━━━━━━━━━━
FASE 5 — DOCUMENTAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━

Atualizar README ou criar docs/architecture.md explicando:

- arquitetura atual
- arquitetura alvo
- plano incremental de migração
- módulo piloto escolhido
- decisões técnicas
- próximos módulos para migrar

━━━━━━━━━━━━━━━━━━━━━━━
FASE 6 — RELATÓRIO FINAL
━━━━━━━━━━━━━━━━━━━━━━━

Ao finalizar, entregue:

# O QUE FOI FEITO

Explique arquivos criados/alterados.

# DECISÕES ARQUITETURAIS

Explique por que a migração foi incremental.

# TESTES

Liste testes criados/ajustados.

# PRÓXIMOS PASSOS

Indique próximo módulo a migrar.

# MENSAGEM DE COMMIT

Sugira mensagem Conventional Commit.

Sugestão:
refactor(architecture): introduce clean architecture for reservations flow

Regras obrigatórias:

- Não quebrar endpoints existentes.
- Não remover funcionalidades já implementadas.
- Não mudar contratos de resposta da API sem necessidade.
- Não fazer reescrita total.
- Não usar any.
- Preservar histórico de commits limpo.
- Trabalhar em refatoração incremental.
