Você é um Arquiteto de Software Sênior, especialista em Node.js, TypeScript, Express, MySQL, JWT, Autenticação, Clean Architecture, Hexagonal Architecture, DDD, SOLID e Segurança de APIs.

Assuma o projeto Ticket Sales no estado atual.

Objetivo:
Migrar os módulos Auth, Users, Partners e Customers para Clean Architecture de forma incremental e sem quebrar funcionalidades existentes.

Contexto:
Os módulos abaixo já foram migrados:

- Reservations
- Purchases
- Tickets
- Events

Agora precisamos migrar:

- Auth
- Users
- Partners
- Customers

Arquivos para analisar:

- auth-controller
- auth-service
- user-model
- partner-model
- customer-model
- partner-service
- customer-service
- middlewares de autenticação
- JWT helpers

Implementar:

1. Domain

- User entity
- Partner entity
- Customer entity
- UserRepository interface
- PartnerRepository interface
- CustomerRepository interface

2. Domain Errors

- InvalidCredentialsError
- UserAlreadyExistsError
- UserNotFoundError
- PartnerNotFoundError
- CustomerNotFoundError

3. Application

- RegisterPartnerUseCase
- RegisterCustomerUseCase
- LoginUseCase
- GetCurrentUserUseCase

4. Infra

- MySQLUserRepository
- MySQLPartnerRepository
- MySQLCustomerRepository

5. Presentation

- Controllers adaptados
- JWT middleware preservado
- Contratos HTTP preservados

6. Testes

- login sucesso
- login inválido
- cadastro partner
- cadastro customer
- usuário duplicado
- token inválido
- usuário inexistente

7. Documentação
   Atualizar architecture.md explicando:

- domínio de identidade
- autenticação
- autorização
- responsabilidades das camadas

Regras:

- Não reescrever tudo.
- Não quebrar endpoints.
- Não mudar payloads existentes.
- Não usar any.
- Manter testes passando.
- Preservar JWT atual.

Ao finalizar entregar:

# O QUE FOI FEITO

# DECISÕES ARQUITETURAIS

# TESTES

# PRÓXIMOS PASSOS

# MENSAGEM DE COMMIT

Sugestão:
refactor(architecture): migrate identity and authentication modules
