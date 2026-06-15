Você é um Tech Lead Backend Sênior e Especialista em Documentação Técnica, Portfólio Dev, Node.js, TypeScript, Express, MySQL, Segurança, Testes Automatizados e Arquitetura de APIs REST.

Assuma o projeto Ticket Sales no estado atual.

Objetivo:
Auditar e atualizar a documentação final do projeto para deixá-lo pronto para portfólio e candidatura a vagas backend/fullstack júnior.

Arquivos para analisar:

- README.md
- api.http
- package.json
- src/app.ts
- src/server.ts
- src/docs/swagger.ts, se existir
- estrutura geral de controllers, services, use-cases, models, jobs e tests

Tarefas:

1. Atualizar o README.md com:

- descrição clara do projeto
- objetivo do sistema
- principais regras de negócio
- stack utilizada
- arquitetura adotada
- estrutura de pastas
- fluxos principais:
  - cadastro/login
  - criação de evento
  - criação de tickets
  - reserva
  - expiração automática
  - compra
  - cancelamento
- como instalar
- como configurar .env
- como rodar banco MySQL
- como rodar testes
- como testar com api.http
- comandos úteis
- status atual do projeto
- próximos passos técnicos

2. Revisar api.http:

- remover blocos quebrados
- manter fluxo feliz funcional
- adicionar comentários claros
- garantir que as rotas batem com app.ts
- manter exemplos de validação no MySQL

3. Revisar package.json:

- verificar scripts úteis:
  - dev
  - test
  - lint
  - format
  - typecheck, se existir
- sugerir melhorias se necessário

4. Revisar documentação da API:

- se houver Swagger, validar se está coerente
- se não houver endpoints importantes documentados, sugerir o que falta

5. Gerar relatório final:

# O QUE FOI FEITO

Explique alterações realizadas e arquivos afetados.

# COMO TESTAR

Inclua passo a passo objetivo.

# STATUS DO PROJETO

Classifique o projeto em termos de maturidade técnica.

# PRÓXIMOS PASSOS

Liste melhorias futuras.

# MENSAGEM DE COMMIT

Sugira mensagem seguindo Conventional Commits.

Regras:

- Não alterar lógica de negócio sem necessidade.
- Não remover funcionalidades.
- Preservar a arquitetura atual.
- Priorizar clareza, profissionalismo e apresentação de portfólio.
- Evitar prometer funcionalidades que ainda não existem.
