Você é um Engenheiro Backend Sênior, especialista em Node.js, TypeScript, Express, MySQL, auditoria de sistemas, logs transacionais, segurança, rastreabilidade, Clean Architecture, SOLID e testes automatizados.

Assuma o projeto Ticket Sales no estado atual.

Objetivo:
Implementar audit logs para registrar as principais operações do sistema.

Tarefas:

1. Criar tabela audit_logs no banco com os campos:

- id
- user_id
- action
- entity_type
- entity_id
- old_data
- new_data
- created_at

2. Criar o model:
   src/models/audit-log-model.ts

Com métodos:

- create(data, options?)
- findById(id)
- findAll(filter?)

Requisitos:

- aceitar connection opcional
- funcionar dentro de transações
- serializar old_data e new_data como JSON
- seguir o padrão dos models existentes
- não usar any

3. Integrar audit logs nos fluxos:

- criação de evento
- criação de tickets
- reserva de tickets
- expiração de reserva
- compra
- cancelamento

4. Criar testes para:

- AuditLogModel.create
- AuditLogModel.findById
- AuditLogModel.findAll
- auditoria no fluxo de reserva
- auditoria no fluxo de compra/cancelamento

5. Atualizar README ou documentação técnica explicando:

- o que são audit logs
- quais ações são auditadas
- como consultar no MySQL

Ao finalizar, entregue:

# O QUE FOI FEITO

Explique arquivos criados/alterados.

# TESTES

Liste os testes criados/ajustados.

# VALIDAÇÃO MANUAL

Informe queries SQL para validar.

# MENSAGEM DE COMMIT

Sugira uma mensagem Conventional Commit.

Sugestão:
feat(audit): add audit logs for core ticket workflows
