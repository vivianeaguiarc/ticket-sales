Você é um Engenheiro Backend Sênior, especialista em Node.js, TypeScript, Express, MySQL, transações, concorrência, locking pessimista, race conditions e sistemas de venda de ingressos.

Assuma o projeto Ticket Sales no estado atual.

Objetivo:
Auditar, corrigir e fortalecer o controle de concorrência no fluxo de reserva e compra de tickets.

Arquivos para analisar primeiro:

- src/models/ticket-model.ts
- src/use-cases/create-reservation-use-case.ts
- src/use-cases/create-purchase-use-case.ts
- src/services/purchase-service.ts
- src/models/reservation-ticket-model.ts
- src/models/purchase-ticket-model.ts
- src/models/ticket-status-history-model.ts

Verifique se o sistema impede corretamente:

1. dois clientes reservarem o mesmo ticket simultaneamente
2. dois clientes comprarem o mesmo ticket simultaneamente
3. compra de ticket já reservado
4. compra de ticket já vendido
5. reserva de ticket já vendido
6. alterações parciais em caso de erro

Requisitos técnicos:

- usar transações corretamente
- garantir lock no banco quando necessário
- usar atualização condicional de status quando possível
- garantir rollback em qualquer falha
- garantir release da conexão
- evitar double booking
- evitar double selling

Audite especialmente métodos como:

- reserveIfAvailable
- markAsSold
- markAsAvailable
- findAll com ids
- create reservation
- create purchase

Se necessário, implemente:

- SELECT ... FOR UPDATE
- UPDATE ... WHERE id = ? AND status = 'available'
- validação de affectedRows
- erro claro quando ticket não estiver disponível

Também ajuste ou crie testes para:

- reserva com ticket disponível
- reserva com ticket indisponível
- compra com ticket disponível
- compra com ticket vendido
- rollback em erro
- tentativa simultânea simulada usando mocks

Ao finalizar, entregue:

# O QUE FOI FEITO

Explique arquivos alterados, correções e decisões técnicas.

# TESTES

Liste testes criados ou ajustados.

# VALIDAÇÃO MANUAL

Explique como testar com api.http e MySQL.

# MENSAGEM DE COMMIT

Sugira uma mensagem seguindo Conventional Commits.
