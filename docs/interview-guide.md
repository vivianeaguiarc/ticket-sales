# Guia de Entrevista — Ticket Sales

Roteiro para apresentar o projeto em entrevistas técnicas de backend (Node.js / TypeScript).

---

## Pitch de 30 segundos

> "Desenvolvi uma API REST de venda de ingressos em Node.js e TypeScript, com MySQL. O sistema permite que parceiros criem eventos e tickets, e clientes reservem ou comprem ingressos. O diferencial técnico está no controle de concorrência com transações e locking pessimista, evitando venda duplicada do mesmo ticket, além de reservas com expiração automática, audit logs e evolução incremental para Clean Architecture — com mais de 330 testes automatizados e um fluxo E2E completo."

---

## Pitch de 2 minutos (estrutura STAR técnica)

1. **Contexto:** API de ticketing com dois perfis (partner e customer), JWT, MySQL.
2. **Problema:** Venda concorrente do mesmo ingresso; reservas temporárias; rastreabilidade.
3. **Solução:** Transações + `FOR UPDATE` + updates condicionais de status; job de expiração; histórico e auditoria.
4. **Resultado:** Fluxo completo testado (unitário, integração mockada, E2E com MySQL real); cobertura ~86%; deploy via Docker.

---

## Como explicar o projeto

### O que o sistema faz

- Partners cadastram eventos e criam tickets em lote.
- Customers reservam tickets (bloqueio de 5 minutos) ou compram diretamente.
- Compras podem ser canceladas; tickets voltam a `available`.
- Job libera reservas expiradas automaticamente.
- Partners consultam histórico unificado (status + audit) por evento.

### Por que é relevante para backend

Demonstra competências que empresas valorizam:

- Modelagem relacional e transações
- Concorrência e consistência
- Autenticação JWT
- Testes em múltiplas camadas
- Evolução arquitetural sem reescrita total
- Containerização e readiness para deploy

---

## Como explicar transações

**Frase curta:**

> "Operações críticas — reserva, compra e cancelamento — rodam dentro de uma transação MySQL. Se qualquer passo falha, faço rollback e nenhuma alteração parcial persiste."

**Detalhe se pedirem:**

1. `TransactionManager` abre conexão e `BEGIN`.
2. Tickets são lidos com `SELECT ... FOR UPDATE` (lock pessimista).
3. Status muda via `UPDATE WHERE status = 'available'` (ou `sold` no cancelamento).
4. Inserts em reservations, purchases, histórico e audit na mesma transação.
5. `COMMIT` ou `ROLLBACK` + `release()` da conexão.

**Exemplo concreto:** dois usuários comprando o ticket #5 ao mesmo tempo — apenas um `sellIfAvailable` altera 1 linha; o outro recebe 409.

---

## Como explicar concorrência

**Frase curta:**

> "Uso locking pessimista no MySQL: leio os tickets com `FOR UPDATE` e só atualizo se o status esperado ainda for válido. Isso evita double selling sem depender só de lógica na aplicação."

**Camadas de proteção:**

| Camada    | Mecanismo                                      |
| --------- | ---------------------------------------------- |
| Banco     | `FOR UPDATE` + `UPDATE` condicional por status |
| Aplicação | Use case transacional (tudo ou nada)           |
| API       | HTTP 409 quando ticket indisponível            |

**Limitação honesta:** o job de expiração roda em cada instância da API — em multi-instância sem lock distribuído, duas instâncias poderiam processar a mesma reserva (mitigado por transação, mas é evolução futura).

---

## Como explicar testes

**Frase curta:**

> "Tenho três níveis: unitários nos use cases com repositórios mockados, integração HTTP com Supertest e mocks de factories, e E2E com MySQL real validando o fluxo feliz completo — cadastro, login, evento, tickets, reserva, compra e cancelamento."

**Números atuais (referência):**

| Suíte             | Comando              | Escopo                       |
| ----------------- | -------------------- | ---------------------------- |
| Unit + integração | `pnpm test`          | ~331 testes, sem MySQL       |
| E2E               | `pnpm test:e2e`      | 15 testes, MySQL obrigatório |
| Cobertura         | `pnpm test:coverage` | ~86% statements/lines        |

**Por que separar E2E:** o E2E trunca o banco; rodar em paralelo com outros testes de integração causaria race conditions.

---

## Como explicar arquitetura

**Frase curta:**

> "Migrei incrementalmente de MVC + services para Clean Architecture: domain com entidades e ports, application com use cases, infra com adapters MySQL, e controllers como entrada HTTP. Preservei rotas e contratos — foi um Strangler Fig Pattern, não um big bang."

**Camadas:**

```
Controller → Factory → Use Case → Repository (interface) → Adapter MySQL → Model legado
```

**Módulos já migrados:** Reservations, Purchases, Tickets, Events, Identidade (Auth/Users/Partners/Customers).

**O que ainda é legado:** `ticket-controller` (variantes antigas de reserva/compra), `EventService.getHistory`, job de expiração em `src/use-cases/`.

---

## Perguntas frequentes — respostas curtas

### Por que MySQL e não PostgreSQL?

> "Escolhi MySQL por familiaridade no ecossistema e por demonstrar transações e `FOR UPDATE` em um banco relacional amplamente usado em produção."

### Como funciona a autenticação?

> "Cadastro cria User + perfil (partner ou customer) com bcrypt. Login retorna JWT com `id` e `email`, expira em 1h. Middleware em `app.ts` valida o token e carrega o usuário antes das rotas protegidas."

### Reserva vs compra — qual a diferença?

> "Reserva bloqueia o ticket por 5 minutos (`reserved`). Compra exige ticket `available` e marca como `sold` imediatamente, criando uma purchase `paid`."

### O pagamento é real?

> "Não. O `card_token` é validado no controller como contrato da API, mas não há integração com gateway — foco do projeto é backend, concorrência e domínio."

### Como evita vender o mesmo ticket duas vezes?

> "Transação + `FOR UPDATE` + `UPDATE WHERE status = 'available'`. Se zero linhas afetadas, lanço erro e retorno 409."

### O que acontece se a reserva expirar?

> "Job a cada 60s busca reservas `reserved` com `expires_at` passado, cancela a reserva, libera o ticket e registra audit `RESERVATION_EXPIRED`."

### Por que Clean Architecture num projeto de portfólio?

> "Separa regras de negócio do MySQL, facilita testes unitários dos use cases e mostra maturidade para evoluir o sistema sem quebrar contratos HTTP."

### Qual o maior trade-off da migração incremental?

> "Convivência temporária de código legado e novo — por exemplo, rotas duplicadas em `ticket-controller`. Ganho: zero downtime conceitual, testes como rede de segurança, entrega contínua."

### O que você melhoraria para produção?

> "CI/CD, Helmet/CORS/rate limiting, logs estruturados (Pino), lock distribuído no job, Testcontainers, Swagger completo e unificação das rotas legadas."

---

## Perguntas para fazer ao entrevistador (opcional)

- "Como o time lida com concorrência em operações financeiras ou de estoque?"
- "Qual o padrão de arquitetura adotado — camadas, hexagonal, modular monolith?"
- "Como vocês estruturam testes de integração com banco real?"

---

## Demonstração ao vivo (5 min)

1. `docker compose up -d mysql` + `pnpm dev`
2. Abrir `api.http` → health → register partner → login → create event → create tickets
3. `GET .../tickets` → copiar IDs
4. Register/login customer → reserve → purchase → cancel
5. No MySQL: `SELECT id, status FROM tickets` e `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10`

---

## Links úteis no repositório

| Documento                              | Conteúdo                 |
| -------------------------------------- | ------------------------ |
| [README.md](../README.md)              | Visão geral e como rodar |
| [architecture.md](architecture.md)     | Camadas e migração       |
| [business-rules.md](business-rules.md) | Regras de domínio        |
| [api.http](../api.http)                | Fluxo manual HTTP        |
