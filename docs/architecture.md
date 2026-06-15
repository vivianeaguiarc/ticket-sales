# Arquitetura — Ticket Sales

Este documento descreve a evolução arquitetural gradual do projeto, do modelo atual (MVC + services/use-cases) para uma arquitetura mais limpa, sem reescrita total.

## Arquitetura atual (legado)

```
src/
  controller/       → HTTP, validação superficial, mapeamento de status
  services/         → orquestração e CRUD de entidades
  use-cases/        → regras de negócio com acesso direto a models/MySQL
  models/           → Active Record (SQL + entidade no mesmo arquivo)
  jobs/             → tarefas agendadas
  database.ts       → pool MySQL singleton
  app.ts / server.ts
```

### Pontos identificados na auditoria

| Problema                                 | Exemplo                                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Acoplamento use case → model             | `CreateReservationUseCase` importava `TicketModel`, `Database` diretamente                                          |
| Dependência direta de MySQL              | `pool.getConnection()`, transações dentro do use case                                                               |
| Falta de interfaces                      | Nenhum `Repository` formal; difícil testar sem mock de módulo inteiro                                               |
| Duplicação de lógica                     | `CreateReservationUseCase` vs `ReserveTicketUseCase` (dois fluxos de reserva)                                       |
| Inconsistência services/use-cases        | Reserva via `ticket-controller` usa `ReserveTicketUseCase`; `reservation-controller` usa `CreateReservationUseCase` |
| Regras no controller                     | Validação de `ticket_ids`, checagem de customer/partner espalhadas                                                  |
| Services com múltiplas responsabilidades | `EventService` cria evento + audit + histórico                                                                      |

## Arquitetura alvo (incremental)

```
src/
  application/
    use-cases/          → orquestração de regras de negócio (sem SQL)
  domain/
    entities/           → entidades puras
    repositories/       → interfaces (ports)
    errors/             → erros de domínio
  infra/
    database/           → transações MySQL
    repositories/       → implementações (adapters)
    composition/        → factories / wiring de dependências
  presentation/
    controllers/        → (migração futura; hoje em src/controller)
  shared/
    mappers/            → conversão domínio ↔ contrato legado da API
  controller/           → legado, delegando gradualmente
  use-cases/            → facades legados durante transição
  models/               → persistência legada (serão encapsulados pelos repos)
```

### Princípios da migração

1. **Um módulo por vez** — sem big bang
2. **Rotas e contratos HTTP preservados** — mesmos status e payloads
3. **Código legado mantido** até validação — facades em `src/use-cases/`
4. **Testes como rede de segurança** — regressão + testes isolados da application layer
5. **Models existentes reutilizados** nos adapters MySQL (não reescrever SQL agora)

## Módulo piloto: Reservas

Fluxo escolhido: **criação de reserva** (`POST /partners/events/reservations` via `reservation-controller`).

### Componentes criados

| Camada      | Arquivo                                                | Responsabilidade                                         |
| ----------- | ------------------------------------------------------ | -------------------------------------------------------- |
| Domain      | `domain/entities/ticket.ts`                            | Entidade `Ticket`                                        |
| Domain      | `domain/entities/reservation.ts`                       | Entidade `Reservation`                                   |
| Domain      | `domain/errors/reservation-errors.ts`                  | Erros de validação                                       |
| Domain      | `domain/repositories/*.ts`                             | Ports: `TicketRepository`, `ReservationRepository`, etc. |
| Application | `application/use-cases/create-reservation-use-case.ts` | Regra de negócio sem MySQL                               |
| Infra       | `infra/repositories/mysql-*.ts`                        | Adapters sobre models legados                            |
| Infra       | `infra/database/mysql-transaction-manager.ts`          | Transações                                               |
| Infra       | `infra/composition/create-reservation-factory.ts`      | Composition root                                         |
| Shared      | `shared/mappers/reservation-mapper.ts`                 | Domínio → `ReservationTicketModel` (API)                 |

## Módulo migrado: Purchases

Fluxos migrados:

- **Criação de compra** (`POST /partners/events/purchases` via `purchase-controller`)
- **Cancelamento de compra** (`POST /partners/events/purchases/:id/cancel`)

### Componentes criados

| Camada      | Arquivo                                                  | Responsabilidade                        |
| ----------- | -------------------------------------------------------- | --------------------------------------- |
| Domain      | `domain/entities/purchase.ts`                            | Entidade `Purchase`                     |
| Domain      | `domain/entities/purchase-ticket.ts`                     | Entidade `PurchaseTicket`               |
| Domain      | `domain/errors/purchase-errors.ts`                       | Erros de domínio de compra              |
| Domain      | `domain/repositories/purchase-repository.ts`             | Port de persistência de compras         |
| Domain      | `domain/repositories/purchase-ticket-repository.ts`      | Port de associação purchase_tickets     |
| Application | `application/use-cases/create-purchase-use-case.ts`      | Compra transacional sem MySQL           |
| Application | `application/use-cases/cancel-purchase-use-case.ts`      | Cancelamento com restauração de tickets |
| Infra       | `infra/repositories/mysql-purchase-repository.ts`        | Adapter MySQL                           |
| Infra       | `infra/repositories/mysql-purchase-ticket-repository.ts` | Adapter MySQL                           |
| Infra       | `infra/composition/purchase-factory.ts`                  | Composition root                        |
| Shared      | `shared/mappers/purchase-mapper.ts`                      | Domínio → `PurchaseModel` (API)         |

### O que ainda está legado (Purchases)

| Componente                     | Situação                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `PurchaseTicketUseCase`        | Rota em `ticket-controller` (`POST /partners/events/purchases`); duplicata parcial |
| Models (`PurchaseModel`, etc.) | Encapsulados por adapters; SQL não reescrito                                       |

### Fluxo após migração Purchases

```
HTTP Request
  → purchase-controller
  → getCreatePurchaseUseCase() / getCancelPurchaseUseCase() [factory]
  → CreatePurchaseUseCase / CancelPurchaseUseCase [application]
  → PurchaseRepository / TicketRepository / ... [interfaces]
  → MysqlPurchaseRepository / MysqlTicketRepository [infra]
  → PurchaseModel / TicketModel [legado]
  → MySQL
```

## Módulo migrado: Tickets

Fluxos migrados:

- **Criação em lote** (`POST /partners/events/:eventId/tickets`)
- **Listagem por evento** (`GET /partners/events/:eventId/tickets`)
- **Busca por id** (`GET /partners/events/:eventId/tickets/:ticketId`)

### Componentes criados/estendidos

| Camada      | Arquivo                                               | Responsabilidade                             |
| ----------- | ----------------------------------------------------- | -------------------------------------------- |
| Domain      | `domain/entities/ticket-status-history.ts`            | Entidade de histórico                        |
| Domain      | `domain/errors/ticket-errors.ts`                      | Erros de ticket e transição de status        |
| Domain      | `domain/repositories/event-repository.ts`             | Port mínimo para validar evento              |
| Domain      | `domain/repositories/ticket-repository.ts`            | Port completo de tickets (CRUD + transições) |
| Application | `application/use-cases/create-tickets-use-case.ts`    | Criação transacional com audit               |
| Application | `application/use-cases/get-event-tickets-use-case.ts` | Listagem por evento                          |
| Application | `application/use-cases/get-ticket-by-id-use-case.ts`  | Busca com validação de evento                |
| Infra       | `infra/repositories/mysql-ticket-repository.ts`       | Adapter expandido (find/create/transições)   |
| Infra       | `infra/repositories/mysql-event-repository.ts`        | Adapter de eventos                           |
| Infra       | `infra/composition/ticket-factory.ts`                 | Composition root compartilhado               |
| Shared      | `shared/mappers/ticket-mapper.ts`                     | Domínio → `TicketModel` (API)                |

### Dependências com Reservations e Purchases

`TicketRepository` é **compartilhado** entre os três módulos:

| Módulo       | Métodos utilizados                                            |
| ------------ | ------------------------------------------------------------- |
| Reservations | `findByIds`, `reserveIfAvailable`                             |
| Purchases    | `findByIds`, `sellIfAvailable`, `releaseIfSold`               |
| Tickets      | `findById`, `findByEventId`, `createMany`, `markAsSold`, etc. |

Factories (`create-reservation-factory`, `purchase-factory`, `ticket-factory`) instanciam o mesmo `MysqlTicketRepository` via `getSharedTicketRepository()` no módulo Tickets.

### O que ainda está legado (Tickets)

| Componente                                                              | Situação                                       |
| ----------------------------------------------------------------------- | ---------------------------------------------- |
| `ReserveTicketUseCase` / `PurchaseTicketUseCase` em `ticket-controller` | Não migrados; ainda acessam models diretamente |
| `TicketModel` / `TicketStatusHistoryModel`                              | Encapsulados por adapters; SQL não reescrito   |
| Rotas duplicadas reserva/compra em `app.ts`                             | Pendente unificação                            |

### Fluxo após migração Tickets

```
HTTP Request
  → ticket-controller
  → getCreateTicketsUseCase() / getGetEventTicketsUseCase() / getGetTicketByIdUseCase()
  → Application use case
  → TicketRepository / EventRepository / AuditLogRepository [interfaces]
  → MysqlTicketRepository / MysqlEventRepository [infra]
  → TicketModel / EventModel [legado]
  → MySQL
```

### Fluxo Reservas (referência)

```
HTTP Request
  → reservation-controller
  → getCreateReservationUseCase() [factory]
  → CreateReservationUseCase [application]
  → TicketRepository / ReservationRepository [interfaces]
  → MysqlTicketRepository / MysqlReservationRepository [infra]
  → TicketModel / ReservationTicketModel [legado]
  → MySQL
```

## Módulo migrado: Events

Fluxos migrados:

- **Criação** (`POST /partners/events`)
- **Listagem pública** (`GET /events`)
- **Busca pública** (`GET /events/:eventId`)
- **Listagem do partner** (`GET /partners/events`)
- **Busca do partner** (`GET /partners/events/:eventId`)

### Componentes criados/estendidos

| Camada      | Arquivo                                                | Responsabilidade                                |
| ----------- | ------------------------------------------------------ | ----------------------------------------------- |
| Domain      | `domain/entities/event.ts`                             | Entidade `Event`                                |
| Domain      | `domain/errors/event-errors.ts`                        | Erros de evento e acesso                        |
| Domain      | `domain/repositories/event-repository.ts`              | Port CRUD de eventos                            |
| Application | `application/use-cases/create-event-use-case.ts`       | Criação transacional com audit                  |
| Application | `application/use-cases/get-events-use-case.ts`         | Listagem pública                                |
| Application | `application/use-cases/get-partner-events-use-case.ts` | Listagem por partner                            |
| Application | `application/use-cases/get-event-by-id-use-case.ts`    | Busca por id                                    |
| Infra       | `infra/repositories/mysql-event-repository.ts`         | Adapter MySQL completo                          |
| Infra       | `infra/composition/event-factory.ts`                   | Composition root + `getSharedEventRepository()` |
| Shared      | `shared/mappers/event-mapper.ts`                       | Domínio → `EventModel` (API)                    |
| Legado      | `services/event-service.ts`                            | Apenas `getHistory` permanece legado            |

### Dependências com Tickets

`ticket-factory` reutiliza `getSharedEventRepository()` para validar existência do evento na criação de tickets.

### O que ainda está legado (Events)

| Componente                | Situação                                    |
| ------------------------- | ------------------------------------------- |
| `EventService.getHistory` | Consulta direta a models de histórico/audit |
| `EventModel`              | Encapsulado pelo adapter; SQL não reescrito |

## Módulo migrado: Identidade e Autenticação

Fluxos migrados:

- **Login** (`POST /auth/login`)
- **Cadastro de partner** (`POST /partners/register`)
- **Cadastro de customer** (`POST /customers/register`)
- **Autenticação JWT** (middleware em `app.ts` via `UserService` facade)

### Domínio de identidade

O domínio de identidade agrupa três agregados relacionados:

| Entidade   | Responsabilidade                                 |
| ---------- | ------------------------------------------------ |
| `User`     | Credenciais e dados básicos (nome, email, senha) |
| `Partner`  | Perfil de parceiro vinculado a um `User`         |
| `Customer` | Perfil de cliente vinculado a um `User`          |

Cadastro de partner/customer cria **User + perfil** em transação atômica.

### Autenticação

| Componente             | Responsabilidade                                          |
| ---------------------- | --------------------------------------------------------- |
| `LoginUseCase`         | Valida credenciais via `UserRepository`                   |
| `JwtTokenService`      | Gera token JWT (`id`, `email`, expiração 1h)              |
| Middleware em `app.ts` | Verifica token com `jwt.verify`, carrega usuário por `id` |

O contrato JWT existente é preservado: payload `{ id, email }`, secret em `env.jwtSecret`.

### Autorização

A autorização permanece **no controller** (padrão legado):

- Rotas públicas listadas em `unprotectedRoutes` (`/auth/login`, `/partners/register`, etc.)
- Rotas protegidas exigem `Authorization: Bearer <token>`
- Checagem de perfil partner (`PartnerService.findByUserId`) antes de operações de eventos/tickets

### Componentes criados

| Camada      | Arquivo                                                                 | Responsabilidade                                 |
| ----------- | ----------------------------------------------------------------------- | ------------------------------------------------ |
| Domain      | `domain/entities/user.ts`, `partner.ts`, `customer.ts`                  | Entidades puras                                  |
| Domain      | `domain/errors/identity-errors.ts`                                      | Erros de credenciais, duplicidade, etc.          |
| Domain      | `domain/repositories/user-repository.ts`                                | Port de usuários                                 |
| Domain      | `domain/repositories/partner-repository.ts`                             | Port de partners                                 |
| Domain      | `domain/repositories/customer-repository.ts`                            | Port de customers                                |
| Domain      | `domain/services/token-service.ts`                                      | Port de geração de JWT                           |
| Application | `application/use-cases/login-use-case.ts`                               | Login sem MySQL direto                           |
| Application | `application/use-cases/get-current-user-use-case.ts`                    | Usuário autenticado por id                       |
| Application | `application/use-cases/register-partner-use-case.ts`                    | Cadastro transacional partner                    |
| Application | `application/use-cases/register-customer-use-case.ts`                   | Cadastro transacional customer                   |
| Infra       | `infra/repositories/mysql-user-repository.ts`                           | Adapter MySQL + mapeamento ER_DUP_ENTRY          |
| Infra       | `infra/repositories/mysql-partner-repository.ts`                        | Adapter MySQL                                    |
| Infra       | `infra/repositories/mysql-customer-repository.ts`                       | Adapter MySQL                                    |
| Infra       | `infra/services/jwt-token-service.ts`                                   | Implementação JWT                                |
| Infra       | `infra/composition/identity-factory.ts`                                 | Composition root compartilhado                   |
| Shared      | `shared/mappers/user-mapper.ts`, `partner-mapper.ts`, etc.              | Domínio → models legados (API/middleware)        |
| Legado      | `services/user-service.ts`, `partner-service.ts`, `customer-service.ts` | Facades finos para middleware e lookup de perfil |

### Responsabilidades das camadas (identidade)

```
Domain        → entidades, erros, ports (repositórios, TokenService)
Application   → orquestração (login, cadastro, get current user)
Infra         → adapters MySQL sobre models legados + JWT
Presentation  → controllers adaptados (factory), middleware JWT preservado
Legado        → services como facades para imports existentes
```

### Fluxo após migração Identidade

```
HTTP Request
  → auth-controller / partner-controller / customer-controller
  → getLoginUseCase() / getRegisterPartnerUseCase() / ...
  → Application use case
  → UserRepository / PartnerRepository / CustomerRepository / TokenService
  → MysqlUserRepository / JwtTokenService [infra]
  → UserModel / PartnerModel / CustomerModel [legado]
  → MySQL
```

### O que ainda está legado (Identidade)

| Componente                          | Situação                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------- |
| Middleware JWT em `app.ts`          | Usa `UserService` facade + `jwt.verify` direto                             |
| `UserModel` / `PartnerModel` / etc. | Encapsulados por adapters; SQL não reescrito                               |
| Tratamento HTTP de email duplicado  | `UserAlreadyExistsError` mapeado no repo; controllers não tratam 409 ainda |

### Fluxo após migração Events

```
HTTP Request
  → event-controller / partner-controller
  → getCreateEventUseCase() / getGetEventsUseCase() / ...
  → Application use case
  → EventRepository / AuditLogRepository [interfaces]
  → MysqlEventRepository [infra]
  → EventModel [legado]
  → MySQL
```

### Decisões técnicas

- **TransactionManager como port**: use case não conhece `PoolConnection`
- **Enums duplicados no domain**: desacoplamento do model legado; adapters fazem cast seguro
- **Factory singleton**: `getCreateReservationUseCase()` centraliza wiring; resetável em testes

## Limpeza pós-migração

Após migrar Reservations, Purchases, Tickets, Events e Identidade, foi realizada auditoria e remoção de código morto.

### Arquivos removidos

| Arquivo                                    | Motivo                                                               |
| ------------------------------------------ | -------------------------------------------------------------------- |
| `services/auth-service.ts`                 | Substituído por `getLoginUseCase()` no controller                    |
| `services/ticket-service.ts`               | Substituído por `ticket-factory`                                     |
| `services/purchase-service.ts`             | Fluxo alternativo com pagamento simulado; sem consumidor em produção |
| `services/payment-service.ts`              | Usado apenas por `PurchaseService` removido                          |
| `services/purchase-ticket-service.ts`      | Órfão; já excluído do build                                          |
| `use-cases/create-reservation-use-case.ts` | Facade duplicada; controllers usam factory                           |
| `use-cases/create-purchase-use-case.ts`    | Facade duplicada                                                     |
| `use-cases/cancel-purchase-use-case.ts`    | Facade duplicada; `ticket-controller` migrado para factory           |

### Código enxugado (mantido)

| Componente                                               | Situação após limpeza                               |
| -------------------------------------------------------- | --------------------------------------------------- |
| `services/event-service.ts`                              | Apenas `getHistory` (subfluxo pendente de migração) |
| `services/user-service.ts`                               | Facade fino para middleware JWT                     |
| `services/partner-service.ts`                            | Apenas `findByUserId` (autorização de partner)      |
| `services/customer-service.ts`                           | Apenas `findByUserId` (validação de perfil)         |
| `services/health-service.ts`                             | Health/readiness                                    |
| `src/use-cases/reserve-ticket-use-case.ts`               | Legado em `ticket-controller`                       |
| `src/use-cases/purchase-ticket-use-case.ts`              | Legado em `ticket-controller`                       |
| `src/use-cases/release-expired-reservations-use-case.ts` | Job de expiração                                    |
| `src/models/*`                                           | Persistência encapsulada por adapters MySQL         |

### Estrutura final adotada

```text
src/
  domain/           → entities, errors, repositories (ports), services (TokenService)
  application/      → use cases (regras de negócio)
  infra/            → repositories MySQL, JWT, factories (composition root)
  shared/mappers/   → domínio ↔ contratos HTTP legados
  controller/       → rotas Express (entrada HTTP)
  services/         → facades finos + EventService.getHistory
  use-cases/        → 3 use cases legados (reserva/compra ticket + job)
  models/           → Active Record (SQL), encapsulados por infra
  jobs/             → expiração de reservas
```

### Rotas duplicadas (mantidas por compatibilidade)

| Fluxo        | Rota canônica (api.http)                     | Rota legada em ticket-controller                            |
| ------------ | -------------------------------------------- | ----------------------------------------------------------- |
| Reserva      | `POST /partners/events/reservations`         | `POST /partners/events/reservations` (mesmo prefix)         |
| Compra       | `POST /partners/events/purchases`            | `POST /partners/events/purchases` (variante sem card_token) |
| Cancelamento | `POST /partners/events/purchases/:id/cancel` | `DELETE /partners/events/purchases/:purchaseId`             |

As rotas duplicadas permanecem até unificação planejada na fase 6–7.

## Plano incremental de migração

| Fase | Módulo                                                       | Status       |
| ---- | ------------------------------------------------------------ | ------------ |
| 1    | Reservas (`CreateReservationUseCase`)                        | ✅ Concluído |
| 2    | Compras (`CreatePurchaseUseCase` / `CancelPurchaseUseCase`)  | ✅ Concluído |
| 3    | Tickets (CRUD + transições via `TicketRepository`)           | ✅ Concluído |
| 4    | Events (CRUD + consultas via `EventRepository`)              | ✅ Concluído |
| 5    | Identidade e Autenticação (Auth, Users, Partners, Customers) | ✅ Concluído |
| 6    | Reservas (`ReserveTicketUseCase` + `ticket-controller`)      | 🔜 Próximo   |
| 7    | Compras (`PurchaseTicketUseCase` em `ticket-controller`)     | Pendente     |
| 8    | `EventService.getHistory`                                    | Pendente     |
| 9    | Jobs (expiração de reservas)                                 | Pendente     |
| 10   | Mover controllers para `presentation/`                       | Pendente     |
| 11   | Limpeza de código legado pós-migração                        | ✅ Concluído |

### Próximo passo recomendado

Unificar fluxos duplicados em `ticket-controller`:

- Migrar `ReserveTicketUseCase` para a application layer de reservas
- Migrar `PurchaseTicketUseCase` para reutilizar `CreatePurchaseUseCase`
- Resolver ordem de rotas em `app.ts` (`ticketRoutes` vs rotas dedicadas)

## Como testar o módulo piloto

```bash
pnpm test src/application/use-cases/create-reservation-use-case.test.ts
pnpm test src/controller/reservation-controller.test.ts
pnpm test src/infra/repositories/mysql-ticket-repository.test.ts
```

## Referências

- Clean Architecture (Robert C. Martin)
- Hexagonal Architecture (Ports & Adapters)
- Strangler Fig Pattern — migração gradual sobre sistema legado
