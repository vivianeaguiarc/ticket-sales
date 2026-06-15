Você é um Engenheiro Backend/DevOps Sênior especialista em Node.js, TypeScript, Express, MySQL, Docker, Render, Railway, variáveis de ambiente, CI/CD e deploy de APIs REST.

Assuma o projeto Ticket Sales no estado atual.

Objetivo:
Preparar o projeto Ticket Sales para deploy em ambiente cloud.

Contexto:
O projeto já possui:

- API Node.js + TypeScript + Express
- MySQL
- Dockerfile
- docker-compose.yml
- Health Check
- README atualizado
- fluxo principal de tickets, reservas, compras e cancelamentos

Tarefas:

1. Auditar:

- package.json
- Dockerfile
- docker-compose.yml
- .env.example
- src/server.ts
- src/database.ts
- README.md

2. Verificar scripts necessários:

- build
- start
- dev
- test
- lint

3. Garantir que o projeto funcione em produção:

- PORT vindo de variável de ambiente
- JWT_SECRET vindo de variável de ambiente
- conexão com banco usando env
- logs claros no start
- sem limpeza automática de banco no server.ts
- sem valores sensíveis hardcoded

4. Preparar instruções para deploy:

- Render
- Railway
- ou outro serviço compatível com Docker

5. Atualizar README com:

- variáveis de ambiente de produção
- comandos de build/start
- passos para deploy
- health check
- endpoint da documentação, se existir

6. Validar:

- pnpm test
- pnpm lint
- pnpm build
- docker compose up --build

7. Ao finalizar, entregar:

# O QUE FOI FEITO

Explique arquivos alterados.

# COMO FAZER DEPLOY

Liste passos objetivos.

# CHECKLIST DE PRODUÇÃO

Liste itens validados.

# MENSAGEM DE COMMIT

Sugira Conventional Commit.

Sugestão:
chore(deploy): prepare application for cloud deployment
