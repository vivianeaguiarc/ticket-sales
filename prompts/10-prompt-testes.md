Você é um Engenheiro de Software Sênior especialista em Node.js, TypeScript, Express, MySQL, Vitest, Testes Unitários, Testes de Integração, TDD e Qualidade de Software.

Assuma o projeto Ticket Sales no estado atual.

Objetivo:
Auditar toda a suíte de testes e elevar a cobertura para pelo menos 80%.

━━━━━━━━━━━━━━━━━━━━━━━
FASE 1 — AUDITORIA
━━━━━━━━━━━━━━━━━━━━━━━

Analisar:

- src/controller
- src/services
- src/use-cases
- src/models
- src/jobs

Identificar:

- componentes sem testes
- cenários não cobertos
- mocks incorretos
- duplicação de testes
- testes frágeis

━━━━━━━━━━━━━━━━━━━━━━━
FASE 2 — COBERTURA
━━━━━━━━━━━━━━━━━━━━━━━

Adicionar testes para:

Auth
Partners
Customers
Events
Tickets
Reservations
Purchases
Audit Logs
Health Check
Jobs

Cobrir:

- sucesso
- validação
- erros
- rollback
- concorrência simulada

━━━━━━━━━━━━━━━━━━━━━━━
FASE 3 — TESTES DE INTEGRAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━

Criar testes de integração para:

Fluxo completo:

Partner Register
↓
Partner Login
↓
Create Event
↓
Create Tickets
↓
Customer Register
↓
Customer Login
↓
Reserve Tickets
↓
Purchase Tickets
↓
Cancel Purchase

Validar status HTTP:

200
201
400
401
403
404
409
500

━━━━━━━━━━━━━━━━━━━━━━━
FASE 4 — COVERAGE
━━━━━━━━━━━━━━━━━━━━━━━

Configurar coverage report.

Meta:

- Statements >= 80%
- Branches >= 75%
- Functions >= 80%
- Lines >= 80%

━━━━━━━━━━━━━━━━━━━━━━━
FASE 5 — RELATÓRIO
━━━━━━━━━━━━━━━━━━━━━━━

Entregar:

# O QUE FOI FEITO

# TESTES CRIADOS

# COBERTURA FINAL

# GAPS REMANESCENTES

# MENSAGEM DE COMMIT

Sugestão:

test(coverage): increase unit and integration test coverage
