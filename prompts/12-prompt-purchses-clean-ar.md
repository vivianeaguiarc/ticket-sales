Você é um Arquiteto de Software Sênior, Tech Lead Backend, especialista em Node.js, TypeScript, Express, MySQL, Clean Architecture, Hexagonal Architecture, DDD, SOLID, transações, concorrência e testes automatizados.

Assuma o projeto Ticket Sales no estado atual.

Objetivo:
Continuar a evolução arquitetural gradual migrando o fluxo de Purchases para Clean Architecture, sem quebrar funcionalidades existentes.

Contexto:
O projeto já iniciou a evolução arquitetural pelo módulo Reservations.
Agora precisamos aplicar o mesmo padrão ao módulo Purchases.

Fluxos envolvidos:

- compra de tickets
- associação purchase_tickets
- alteração de tickets para sold
- criação de histórico
- cancelamento de compra
- restauração de tickets para available
- auditoria, se já existir

Arquivos atuais para analisar:

- src/controller/purchase-controller.ts
- src/use-cases/create-purchase-use-case.ts
- src/services/purchase-service.ts
- src/models/purchase-model.ts
- src/models/purchase-ticket-model.ts
- src/models/ticket-model.ts
- src/models/ticket-status-history-model.ts

Criar ou evoluir estrutura:

src/
domain/
entities/
repositories/
errors/
application/
use-cases/
infra/
repositories/
presentation/
controllers/
routes/

Implementar para Purchases:

1. Domain

- Purchase entity
- PurchaseTicket entity, se necessário
- PurchaseRepository interface
- PurchaseTicketRepository interface
- TicketRepository interface reutilizada, se já existir
- erros de domínio específicos:
  - PurchaseNotFoundError
  - PurchaseAlreadyCancelledError
  - TicketUnavailableError
  - TicketNotFoundError

2. Infra

- MySQLPurchaseRepository
- MySQLPurchaseTicketRepository
- reutilizar MySQLTicketRepository, se já existir
- garantir suporte a transactions/connections

3. Application

- CreatePurchaseUseCase usando interfaces
- CancelPurchaseUseCase usando interfaces
- sem dependência direta dos models MySQL
- regras de negócio explícitas no use case

4. Presentation

- adaptar purchase-controller para chamar os novos use cases
- preservar endpoints e respostas existentes

5. Testes
   Criar/ajustar testes para:

- create purchase com sucesso
- compra com ticket inexistente
- compra com ticket indisponível
- rollback em erro
- cancelamento com sucesso
- cancelamento de purchase inexistente
- cancelamento duplicado
- contrato HTTP do controller

6. Documentação
   Atualizar docs/architecture.md ou README:

- explicar migração do módulo Purchases
- listar o que ainda está legado
- indicar próximo módulo recomendado

Regras obrigatórias:

- Não reescrever o projeto inteiro.
- Não remover código legado até nova implementação estar validada.
- Não quebrar rotas existentes.
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
refactor(architecture): migrate purchases flow to clean architecture
