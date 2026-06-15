Você é um Engenheiro de Software Sênior, especialista em Node.js, TypeScript, Express, MySQL, Vitest, Supertest, testes unitários, testes de integração, testes E2E, qualidade de software e CI/CD.

Assuma o projeto Ticket Sales no estado atual.

Objetivo:
Aumentar a cobertura de testes e criar um teste E2E do fluxo principal da aplicação.

Contexto:
O projeto já possui:

- autenticação JWT
- partners
- customers
- events
- tickets
- reservations
- purchases
- cancelamento
- expiração automática
- audit logs
- health check
- Docker
- evolução para Clean Architecture

━━━━━━━━━━━━━━━━━━━━━━━
FASE 1 — AUDITORIA DOS TESTES
━━━━━━━━━━━━━━━━━━━━━━━

Auditar:

- src/\*_/_.test.ts
- vitest.config, se existir
- package.json

Identificar:

- arquivos sem testes
- testes frágeis
- testes duplicados
- mocks desnecessários
- cenários críticos descobertos

━━━━━━━━━━━━━━━━━━━━━━━
FASE 2 — COVERAGE
━━━━━━━━━━━━━━━━━━━━━━━

Configurar ou validar coverage com Vitest.

Adicionar script se necessário:

test:coverage

Meta:

- statements >= 80%
- functions >= 80%
- lines >= 80%
- branches >= 75%

━━━━━━━━━━━━━━━━━━━━━━━
FASE 3 — TESTE E2E PRINCIPAL
━━━━━━━━━━━━━━━━━━━━━━━

Criar teste E2E para o fluxo feliz:

1. Register Partner
2. Login Partner
3. Create Event
4. Create Tickets
5. Register Customer
6. Login Customer
7. Reserve Ticket
8. Purchase Tickets
9. Cancel Purchase
10. Validar status finais

O teste deve validar:

- status HTTP corretos
- tokens gerados
- ids retornados
- mudanças de status dos tickets
- purchase criada
- cancelamento aplicado

━━━━━━━━━━━━━━━━━━━━━━━
FASE 4 — TESTES DE ERRO IMPORTANTES
━━━━━━━━━━━━━━━━━━━━━━━

Adicionar pelo menos:

- login inválido
- reserva de ticket indisponível
- compra de ticket inexistente
- cancelamento de purchase inexistente
- acesso sem token

━━━━━━━━━━━━━━━━━━━━━━━
FASE 5 — QUALIDADE
━━━━━━━━━━━━━━━━━━━━━━━

Garantir:

- pnpm lint
- pnpm test
- pnpm test:coverage
- pnpm build

Sem uso de any.
Imports ordenados.
Sem testes dependentes de ordem externa.

━━━━━━━━━━━━━━━━━━━━━━━
FASE 6 — RELATÓRIO FINAL
━━━━━━━━━━━━━━━━━━━━━━━

Ao finalizar, entregue:

# O QUE FOI FEITO

# TESTES CRIADOS

# COBERTURA FINAL

# GAPS REMANESCENTES

# COMO RODAR

# MENSAGEM DE COMMIT

Sugestão:
test(e2e): add main ticket sales workflow coverage
