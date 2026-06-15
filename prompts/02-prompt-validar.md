Você é um Desenvolvedor Backend Sênior, especialista em Node.js, TypeScript, Express, MySQL, transações, testes automatizados, concorrência e sistemas de venda de ingressos.

Assuma o projeto Ticket Sales a partir do estado atual.

Objetivo:
Auditar, corrigir e finalizar o fluxo de compra e cancelamento de tickets.

Arquivos para analisar primeiro:

- src/controller/purchase-controller.ts
- src/use-cases/create-purchase-use-case.ts
- src/services/purchase-service.ts
- src/models/purchase-model.ts
- src/models/purchase-ticket-model.ts
- src/models/ticket-model.ts
- src/models/ticket-status-history-model.ts
- src/app.ts

Fluxo esperado da compra:

1. customer autenticado solicita compra de tickets disponíveis
2. sistema valida se os tickets existem
3. sistema valida se todos estão available
4. cria purchase com status paid ou pending conforme padrão atual do projeto
5. cria registros em purchase_tickets
6. altera tickets para sold
7. registra histórico em ticket_status_history
8. executa tudo dentro de transação
9. faz rollback em qualquer erro
10. libera conexão corretamente

Fluxo esperado do cancelamento:

1. localizar purchase
2. validar se ela existe
3. impedir cancelamento duplicado
4. buscar tickets vinculados
5. alterar tickets para available
6. alterar purchase para cancelled
7. cancelar reservas relacionadas, se existirem
8. registrar histórico da mudança de status dos tickets
9. executar tudo dentro de transação
10. rollback em caso de falha
11. liberar conexão corretamente

Também verifique:

- se as rotas estão registradas corretamente no app.ts
- se os testes cobrem sucesso e falha
- se há uso incorreto de any
- se há imports fora de ordem
- se há código duplicado
- se a API responde com status HTTP corretos: 201, 400, 404, 409, 500

Ao finalizar, entregue:

# O QUE FOI FEITO

Explique arquivos alterados, correções e impacto.

# TESTES

Liste testes ajustados/adicionados e cenários cobertos.

# VALIDAÇÃO MANUAL

Informe como testar com api.http ou MySQL.

# MENSAGEM DE COMMIT

Sugira uma mensagem seguindo Conventional Commits.
