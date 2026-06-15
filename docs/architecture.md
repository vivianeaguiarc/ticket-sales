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

### Fluxo após migração piloto

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

| Fase | Módulo                                                      | Status              |
| ---- | ----------------------------------------------------------- | ------------------- |
| 1    | Reservas (`CreateReservationUseCase`)                       | ✅ Piloto concluído |
| 2    | Reservas (`ReserveTicketUseCase` + `ticket-controller`)     | 🔜 Próximo          |
| 3    | Compras (`CreatePurchaseUseCase` / `PurchaseTicketUseCase`) | Pendente            |
| 4    | Cancelamento de compras                                     | Pendente            |
| 5    | Eventos e tickets (criação)                                 | Pendente            |
| 6    | Auth, partners, customers                                   | Pendente            |
| 7    | Jobs (expiração de reservas)                                | Pendente            |
| 8    | Mover controllers para `presentation/`                      | Pendente            |

### Próximo passo recomendado

Unificar os dois fluxos de reserva:

- `ReserveTicketUseCase` (rota real em `ticket-controller`) deve migrar para a mesma application layer
- Resolver ordem de rotas em `app.ts` (`ticketRoutes` vs `reservationRoutes`)
- Extrair validação HTTP para handlers finos na camada presentation

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
