# Regras de Negócio — Ticket Sales

Este documento descreve as regras de negócio implementadas no código atual. Use-o como referência técnica e para preparação de entrevistas.

## Atores

| Ator         | Descrição                                      |
| ------------ | ---------------------------------------------- |
| **Partner**  | Organizador de eventos; cria eventos e tickets |
| **Customer** | Comprador final; reserva e compra ingressos    |

Ambos possuem conta de **User** (email + senha com bcrypt). O JWT identifica o `user_id`; controllers validam o perfil (partner ou customer) conforme a operação.

---

## Ciclo de vida do ticket

```
available → reserved → sold
     ↑         │         │
     └─────────┴─────────┘
   (expiração / cancelamento)
```

| Status      | Significado                              |
| ----------- | ---------------------------------------- |
| `available` | Disponível para reserva ou compra        |
| `reserved`  | Bloqueado temporariamente por um cliente |
| `sold`      | Vendido em uma compra confirmada         |

Toda transição relevante gera registro em `ticket_status_history` (`from_status`, `to_status`, `changed_at`).

---

## Criação de tickets

- Apenas o **partner dono do evento** pode criar tickets.
- Endpoint: `POST /partners/events/:eventId/tickets`
- Body: `{ "num_tickets": N, "price": valor }`
- Tickets são criados em lote com status inicial `available`.
- Gera audit log `TICKETS_CREATED`.

---

## Reserva

### Quem pode reservar

- Cliente autenticado (`Customer` vinculado ao `user_id` do token).

### Regras

1. `ticket_ids` é obrigatório e não pode ser vazio.
2. Todos os tickets devem existir.
3. Cada ticket deve estar `available` no momento da reserva.
4. Operação é **atômica** (transação MySQL): ou todos os tickets são reservados, ou nenhum.
5. Para cada ticket:
   - `UPDATE` condicional `available → reserved` (`reserveIfAvailable`)
   - Cria `reservation_tickets` com status `reserved`
   - Registra histórico `available → reserved`
6. Expiração padrão: **5 minutos** após a reserva (`expires_at`).

### Endpoint

`POST /partners/events/reservations`  
Body: `{ "ticket_ids": [1, 2] }`

### Erros comuns

| Situação              | HTTP |
| --------------------- | ---- |
| Sem token             | 401  |
| `ticket_ids` vazio    | 400  |
| Ticket indisponível   | 409  |
| Ticket não encontrado | 404  |

---

## Expiração automática de reservas

### Job em background

- Inicia com o servidor (`startReleaseExpiredReservationsJob`).
- Executa a cada **60 segundos**.
- Flag `isRunning` evita execuções sobrepostas na mesma instância.

### Regras na expiração

Para cada reserva com `status = reserved` e `expires_at < NOW()`:

1. Reserva → `cancelled`
2. Ticket → `available` (se ainda estiver `reserved`)
3. Histórico `reserved → available`
4. Audit log `RESERVATION_EXPIRED` (`user_id` nulo)

### Limitação conhecida

Em deploy com **múltiplas instâncias**, cada instância executa o job localmente. Não há lock distribuído — item listado nos próximos passos do projeto.

---

## Compra

### Quem pode comprar

- Cliente autenticado.

### Regras

1. `ticket_ids` obrigatório (array não vazio).
2. `card_token` obrigatório no controller (validação HTTP; pagamento **não** integrado a gateway real — token é exigido como contrato da API).
3. Tickets devem existir e estar `available`.
4. Operação transacional:
   - `SELECT ... FOR UPDATE` nos tickets
   - `sellIfAvailable` por ticket (`available → sold`)
   - Cria `purchase` com status `paid` e `total_amount` = soma dos preços
   - Cria registros em `purchase_tickets`
   - Histórico `available → sold` por ticket
   - Audit log `PURCHASE_CREATED`

### Endpoint

`POST /partners/events/purchases`  
Body: `{ "ticket_ids": [3, 4], "card_token": "..." }`

### Observação importante

A compra exige tickets **available**. Um ticket `reserved` (por outro cliente ou pelo mesmo) **não** pode ser comprado até voltar a `available` (expiração ou cancelamento de reserva).

---

## Cancelamento de compra

### Regras

1. Purchase deve existir.
2. Purchase não pode já estar `cancelled`.
3. Operação transacional com `FOR UPDATE` na purchase:
   - Para cada ticket da compra: `releaseIfSold` (`sold → available`) + histórico
   - Cancela reservas ativas do mesmo customer para esses tickets (se existirem)
   - Purchase → `cancelled`
   - Audit log `PURCHASE_CANCELLED`

### Endpoint

`POST /partners/events/purchases/:id/cancel`

### Erros comuns

| Situação                | HTTP |
| ----------------------- | ---- |
| Purchase não encontrada | 404  |
| Purchase já cancelada   | 409  |

---

## Histórico do evento

- Endpoint: `GET /partners/events/:eventId/history`
- Apenas o **partner dono** do evento (403 caso contrário).
- Retorna array unificado de:
  - `ticket_status_history` (transições de status)
  - `audit_logs` (ações de negócio)
- Ordenado por data decrescente.

Implementação atual: `EventService.getHistory` (legado, consulta direta aos models).

---

## Auditoria (`audit_logs`)

Registros gravados na **mesma transação** da operação principal.

| Action                | Entity        | Quando                     |
| --------------------- | ------------- | -------------------------- |
| `EVENT_CREATED`       | `event`       | Criação de evento          |
| `TICKETS_CREATED`     | `ticket`      | Criação de tickets em lote |
| `TICKETS_RESERVED`    | `reservation` | Reserva de tickets         |
| `RESERVATION_EXPIRED` | `reservation` | Expiração automática       |
| `PURCHASE_CREATED`    | `purchase`    | Compra confirmada          |
| `PURCHASE_CANCELLED`  | `purchase`    | Cancelamento de compra     |

Campos úteis: `user_id`, `entity_id`, `old_data`, `new_data` (JSON), `created_at`.

### Consultas MySQL

```sql
SELECT * FROM audit_logs ORDER BY created_at DESC;

SELECT * FROM audit_logs WHERE action = 'PURCHASE_CREATED' ORDER BY created_at DESC;
```

---

## Concorrência e integridade

### Mecanismos implementados

| Mecanismo                     | Onde                                                     |
| ----------------------------- | -------------------------------------------------------- |
| Transações (`BEGIN`/`COMMIT`) | Reserva, compra, cancelamento, cadastros                 |
| `SELECT ... FOR UPDATE`       | Busca de tickets/reservas/purchases                      |
| Update condicional de status  | `reserveIfAvailable`, `sellIfAvailable`, `releaseIfSold` |
| Rollback em falha             | `TransactionManager` / models legados                    |

### Comportamento em corrida

Dois clientes tentando reservar/comprar o **mesmo** ticket `available`:

- O primeiro commit ganha.
- O segundo recebe erro (`Ticket X is not available`) → HTTP **409**.

O `UPDATE ... WHERE status = 'available'` garante que apenas uma operação altera o status com sucesso.

---

## Autenticação e autorização

| Regra                 | Implementação                             |
| --------------------- | ----------------------------------------- |
| Login                 | `POST /auth/login` → JWT                  |
| Token                 | Payload `{ id, email }`, expiração **1h** |
| Rotas públicas        | login, register, `GET /events`, health    |
| Rotas protegidas      | Header `Authorization: Bearer <token>`    |
| Operações de partner  | Checagem `PartnerService.findByUserId`    |
| Operações de customer | Checagem `CustomerService.findByUserId`   |

Em produção (`NODE_ENV=production`): variáveis de banco e `JWT_SECRET` forte são obrigatórias no startup.

---

## Health check

| Endpoint      | Propósito                     |
| ------------- | ----------------------------- |
| `GET /health` | Liveness + conexão MySQL      |
| `GET /ready`  | Readiness para orquestradores |

Ambos executam `SELECT 1` no pool MySQL.
