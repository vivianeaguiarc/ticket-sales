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
| Legado      | `use-cases/create-reservation-use-case.ts`             | Facade que delega à application layer                    |

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
| Legado      | `use-cases/create-purchase-use-case.ts`                  | Facade de criação                       |
| Legado      | `use-cases/cancel-purchase-use-case.ts`                  | Facade de cancelamento                  |

### O que ainda está legado (Purchases)

| Componente                     | Situação                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `PurchaseService.create`       | Fluxo alternativo com pagamento simulado; não migrado                              |
| `PurchaseTicketUseCase`        | Rota em `ticket-controller` (`POST /partners/events/purchases`); duplicata parcial |
| `purchase-ticket-service.ts`   | Arquivo legado excluído do build                                                   |
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

### Decisões técnicas

- **TransactionManager como port**: use case não conhece `PoolConnection`
- **Enums duplicados no domain**: desacoplamento do model legado; adapters fazem cast seguro
- **Facade legado**: imports antigos (`src/use-cases/create-reservation-use-case.ts`) continuam funcionando
- **Factory singleton**: `getCreateReservationUseCase()` centraliza wiring; resetável em testes

## Plano incremental de migração

| Fase | Módulo                                                      | Status       |
| ---- | ----------------------------------------------------------- | ------------ |
| 1    | Reservas (`CreateReservationUseCase`)                       | ✅ Concluído |
| 2    | Compras (`CreatePurchaseUseCase` / `CancelPurchaseUseCase`) | ✅ Concluído |
| 3    | Reservas (`ReserveTicketUseCase` + `ticket-controller`)     | 🔜 Próximo   |
| 4    | Compras (`PurchaseTicketUseCase` em `ticket-controller`)    | Pendente     |
| 5    | `PurchaseService.create` (pagamento simulado)               | Pendente     |
| 6    | Eventos e tickets (criação)                                 | Pendente     |
| 7    | Auth, partners, customers                                   | Pendente     |
| 8    | Jobs (expiração de reservas)                                | Pendente     |
| 9    | Mover controllers para `presentation/`                      | Pendente     |

### Próximo passo recomendado

Unificar fluxos duplicados em `ticket-controller`:

- Migrar `ReserveTicketUseCase` para a application layer de reservas
- Migrar `PurchaseTicketUseCase` para reutilizar `CreatePurchaseUseCase`
- Resolver ordem de rotas em `app.ts` (`ticketRoutes` vs rotas dedicadas)

## Como testar o módulo piloto

```bash
pnpm test src/application/use-cases/create-reservation-use-case.test.ts
pnpm test src/use-cases/create-reservation-use-case.test.ts
pnpm test src/controller/reservation-controller.test.ts
pnpm test src/infra/repositories/mysql-ticket-repository.test.ts
```

## Referências

- Clean Architecture (Robert C. Martin)
- Hexagonal Architecture (Ports & Adapters)
- Strangler Fig Pattern — migração gradual sobre sistema legado
