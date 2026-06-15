Você é um Engenheiro Backend Sênior, especialista em Node.js, TypeScript, Express, MySQL, Clean Architecture, SOLID, auditoria de sistemas, logs transacionais, segurança e rastreabilidade.

Assuma o projeto Ticket Sales no estado atual.

Objetivo:
Implementar auditoria técnica das principais operações do sistema usando uma tabela audit_logs.

Contexto:
O projeto já possui fluxos de:

- partners
- customers
- events
- tickets
- reservations
- purchases
- cancelamento
- expiração automática de reservas
- ticket_status_history para histórico de status dos tickets

Agora precisamos adicionar uma camada de auditoria mais ampla para registrar ações importantes do sistema.

━━━━━━━━━━━━━━━━━━━━━━━
FASE 1 — AUDITORIA DO ESTADO ATUAL
━━━━━━━━━━━━━━━━━━━━━━━

Antes de implementar, analise:

- src/models
- src/services
- src/use-cases
- src/controller
- migrations ou scripts SQL existentes
- estrutura atual do banco

Identifique onde eventos importantes acontecem:

- criação de evento
- criação de tickets
- reserva de tickets
- expiração de reserva
- compra de tickets
- cancelamento de compra

Não reimplemente funcionalidades existentes.

━━━━━━━━━━━━━━━━━━━━━━━
FASE 2 — BANCO DE DADOS
━━━━━━━━━━━━━━━━━━━━━━━

Criar tabela audit_logs no padrão do projeto.

Campos sugeridos:

- id INT AUTO_INCREMENT PRIMARY KEY
- user_id INT NULL
- action VARCHAR(100) NOT NULL
- entity_type VARCHAR(100) NOT NULL
- entity_id INT NULL
- old_data JSON NULL
- new_data JSON NULL
- created_at TIMESTAMP NOT NULL

Se o projeto usa migrations, criar migration.
Se o projeto usa schema.sql/manual SQL, criar script SQL compatível.

━━━━━━━━━━━━━━━━━━━━━━━
FASE 3 — MODEL
━━━━━━━━━━━━━━━━━━━━━━━

Criar:

src/models/audit-log-model.ts

Com métodos:

- create(data, options?)
- findAll(filter?)
- findById(id)

O model deve:

- aceitar connection opcional
- funcionar dentro de transações
- serializar old_data e new_data como JSON
- retornar instância tipada
- seguir o padrão dos models existentes

━━━━━━━━━━━━━━━━━━━━━━━
FASE 4 — INTEGRAÇÃO NOS FLUXOS
━━━━━━━━━━━━━━━━━━━━━━━

Adicionar audit logs nos pontos principais:

1. Criação de evento
   action: EVENT_CREATED
   entity_type: event

2. Criação de tickets
   action: TICKETS_CREATED
   entity_type: ticket

3. Reserva de tickets
   action: TICKETS_RESERVED
   entity_type: reservation

4. Expiração de reserva
   action: RESERVATION_EXPIRED
   entity_type: reservation

5. Compra de tickets
   action: PURCHASE_CREATED
   entity_type: purchase

6. Cancelamento de compra
   action: PURCHASE_CANCELLED
   entity_type: purchase

Sempre que possível:

- usar user_id
- usar entity_id
- salvar old_data e new_data relevantes
- executar audit log na mesma transação da operação principal

━━━━━━━━━━━━━━━━━━━━━━━
FASE 5 — TESTES
━━━━━━━━━━━━━━━━━━━━━━━

Criar testes para:

- AuditLogModel.create
- AuditLogModel.findById
- AuditLogModel.findAll
- criação de audit log dentro de fluxo de reserva
- criação de audit log dentro de fluxo de compra
- rollback quando falhar operação principal

Os testes devem seguir o padrão atual do projeto:

- Vitest
- mocks tipados
- sem any
- imports ordenados
- lint sem erros

━━━━━━━━━━━━━━━━━━━━━━━
FASE 6 — DOCUMENTAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━

Atualizar README.md explicando:

- o que são audit logs
- quais ações são auditadas
- como consultar no MySQL
- exemplo de query:

SELECT \* FROM audit_logs ORDER BY created_at DESC;

━━━━━━━━━━━━━━━━━━━━━━━
FASE 7 — RELATÓRIO FINAL
━━━━━━━━━━━━━━━━━━━━━━━

Ao finalizar, entregue:

# O QUE FOI FEITO

Explique:

- arquivos criados
- arquivos alterados
- decisões técnicas
- impacto no projeto

# TESTES

Liste:

- testes criados
- testes ajustados
- cenários cobertos

# VALIDAÇÃO MANUAL

Explique como testar usando api.http e MySQL.

# MENSAGEM DE COMMIT

Sugira uma mensagem seguindo Conventional Commits.

Sugestão:
feat(audit): add audit logs for ticket sales workflows

Regras:

- Não remover funcionalidades existentes.
- Não alterar regras de negócio sem necessidade.
- Não quebrar testes existentes.
- Não usar any.
- Preservar arquitetura atual.
- Usar transações quando o fluxo já tiver transação.
