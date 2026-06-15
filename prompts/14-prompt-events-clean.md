Você é um Arquiteto de Software Sênior, Tech Lead Backend, especialista em Node.js, TypeScript, Express, MySQL, Clean Architecture, Hexagonal Architecture, DDD, SOLID, APIs REST e testes automatizados.

Assuma o projeto Ticket Sales no estado atual.

Objetivo:
Continuar a evolução arquitetural gradual migrando o módulo Events para Clean Architecture, sem quebrar funcionalidades existentes.

Contexto:
O projeto já iniciou a evolução arquitetural pelos módulos:

- Reservations
- Purchases
- Tickets

Agora precisamos migrar o módulo Events.

Arquivos atuais para analisar:

- src/controller/event-controller.ts
- src/models/event-model.ts
- src/services/event-service.ts
- src/models/partner-model.ts
- src/services/partner-service.ts
- src/app.ts

Implementar ou ajustar:

1. Domain

- Event entity
- EventRepository interface
- erros de domínio:
  - EventNotFoundError
  - PartnerNotFoundError
  - ForbiddenEventAccessError

2. Infra

- MySQLEventRepository
- suporte a connection/transação, se necessário
- métodos:
  - create
  - findById
  - findAll
  - findByPartnerId
  - update
  - delete

3. Application

- CreateEventUseCase
- GetEventsUseCase
- GetPartnerEventsUseCase
- GetEventByIdUseCase
- UpdateEventUseCase, se já existir no fluxo atual

4. Presentation

- adaptar event-controller gradualmente
- preservar endpoints atuais
- preservar contratos HTTP
- garantir que apenas partner dono acesse/edite seus eventos

5. Testes
   Criar/ajustar testes para:

- criação de evento
- listagem pública de eventos
- listagem de eventos do partner
- busca de evento por id
- evento inexistente
- partner tentando acessar evento de outro partner
- validações de body

6. Documentação
   Atualizar docs/architecture.md ou README:

- explicar migração do módulo Events
- listar módulos já migrados
- indicar próximos módulos pendentes

Regras obrigatórias:

- Não reescrever o projeto inteiro.
- Não remover código legado até nova implementação estar validada.
- Não quebrar endpoints existentes.
- Não mudar contrato da API sem necessidade.
- Não usar any.
- Manter lint, testes e build passando.

Ao finalizar, entregue:

# O QUE FOI FEITO

# DECISÕES ARQUITETURAIS

# TESTES

# PRÓXIMOS PASSOS

# MENSAGEM DE COMMIT

Sugestão de commit:
refactor(architecture): migrate events module to clean architecture
