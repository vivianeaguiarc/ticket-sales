Você é um Arquiteto de Software Sênior, Tech Lead Backend, especialista em Node.js, TypeScript, Express, MySQL, Clean Architecture, Hexagonal Architecture, DDD, SOLID, transações, concorrência e testes automatizados.

Assuma o projeto Ticket Sales no estado atual.

Objetivo:
Continuar a evolução arquitetural gradual migrando o módulo Tickets para Clean Architecture, sem quebrar funcionalidades existentes.

Contexto:
O projeto já iniciou a evolução arquitetural pelos módulos Reservations e Purchases.
Agora precisamos migrar o módulo Tickets, que é central para regras de disponibilidade, reserva, venda, cancelamento e histórico.

Arquivos atuais para analisar:

- src/controller/ticket-controller.ts
- src/models/ticket-model.ts
- src/models/ticket-status-history-model.ts
- src/use-cases/create-reservation-use-case.ts
- src/use-cases/create-purchase-use-case.ts
- src/services/purchase-service.ts

Implementar ou ajustar:

1. Domain

- Ticket entity
- TicketStatus value/enum
- TicketStatusHistory entity
- TicketRepository interface
- TicketStatusHistoryRepository interface
- erros de domínio:
  - TicketNotFoundError
  - TicketUnavailableError
  - InvalidTicketStatusTransitionError

2. Infra

- MySQLTicketRepository
- MySQLTicketStatusHistoryRepository
- suporte a connection/transação
- métodos:
  - findById
  - findByIds
  - findByEventId
  - createMany
  - reserveIfAvailable
  - markAsSold
  - markAsAvailable

3. Application

- Use cases relacionados a tickets, quando fizer sentido:
  - CreateTicketsUseCase
  - GetEventTicketsUseCase
  - GetTicketByIdUseCase
- garantir que Reservations e Purchases reutilizem TicketRepository, se já houver integração possível

4. Presentation

- manter endpoints atuais
- adaptar controller de tickets gradualmente
- não mudar contrato HTTP sem necessidade

5. Testes
   Criar/ajustar testes para:

- criação de tickets
- listagem de tickets por evento
- busca de ticket por id
- reserva condicional
- venda condicional
- restauração para available
- erro ao alterar status inválido
- rollback quando houver falha

6. Documentação
   Atualizar docs/architecture.md ou README:

- explicar migração do módulo Tickets
- informar dependências com Reservations e Purchases
- listar próximos módulos pendentes

Regras obrigatórias:

- Não reescrever o projeto inteiro.
- Não remover código legado até nova implementação estar validada.
- Não quebrar endpoints existentes.
- Não mudar contrato da API sem necessidade.
- Não usar any.
- Manter lint, testes e build passando.
- Preservar transações e consistência de status.

Ao finalizar, entregue:

# O QUE FOI FEITO

# DECISÕES ARQUITETURAIS

# TESTES

# PRÓXIMOS PASSOS

# MENSAGEM DE COMMIT

Sugestão de commit:
refactor(architecture): migrate tickets module to clean architecture
