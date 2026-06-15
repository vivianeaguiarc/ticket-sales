Você é um Engenheiro Backend Sênior, especialista em Node.js, TypeScript, Express, MySQL, APIs REST, auditoria, rastreabilidade, segurança, Clean Architecture, SOLID e testes automatizados.

Assuma o projeto Ticket Sales no estado atual.

Objetivo:
Implementar endpoint de histórico para eventos, permitindo que partners consultem alterações e auditorias relacionadas aos tickets de um evento.

Endpoint esperado:
GET /partners/events/:eventId/history

Regras:

1. Apenas o partner dono do evento pode consultar o histórico.
2. Validar se o evento existe.
3. Validar se o evento pertence ao partner autenticado.
4. Buscar histórico em ticket_status_history.
5. Buscar audit logs relacionados ao evento/tickets, se audit_logs já existir.
6. Retornar resposta organizada em ordem cronológica decrescente.

Arquivos para analisar:

- src/controller/event-controller.ts
- src/controller/ticket-controller.ts
- src/models/event-model.ts
- src/models/ticket-model.ts
- src/models/ticket-status-history-model.ts
- src/models/audit-log-model.ts
- src/services/event-service.ts
- src/services/partner-service.ts
- src/app.ts

Implementar se necessário:

- método no TicketStatusHistoryModel para buscar por event_id
- método no AuditLogModel para buscar por entity/event
- rota GET /partners/events/:eventId/history
- testes automatizados do controller/service/model

A resposta do endpoint deve seguir formato parecido com:

[
{
"type": "ticket_status_history",
"ticket_id": 1,
"from_status": "available",
"to_status": "reserved",
"changed_at": "2026-04-01T12:00:00.000Z"
},
{
"type": "audit_log",
"action": "PURCHASE_CREATED",
"entity_type": "purchase",
"entity_id": 3,
"created_at": "2026-04-01T12:05:00.000Z"
}
]

Testes obrigatórios:

- deve retornar histórico do evento com sucesso
- deve retornar 404 se evento não existir
- deve retornar 403 se partner não for dono do evento
- deve retornar lista vazia se não houver histórico
- deve validar ordenação decrescente

Ao finalizar, entregue:

# O QUE FOI FEITO

Explique arquivos criados/alterados.

# TESTES

Liste os testes criados/ajustados.

# VALIDAÇÃO MANUAL

Explique como testar com api.http e MySQL.

# MENSAGEM DE COMMIT

Sugira uma mensagem Conventional Commit.

Sugestão:
feat(events): add event history endpoint
