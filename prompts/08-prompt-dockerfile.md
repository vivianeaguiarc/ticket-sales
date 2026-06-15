Você é um Engenheiro DevOps e Backend Sênior, especialista em Node.js, TypeScript, Express, MySQL, Docker, Docker Compose, ambientes locais reproduzíveis, CI/CD e deploy em Render/Railway.

Assuma o projeto Ticket Sales no estado atual.

Objetivo:
Dockerizar completamente a aplicação Ticket Sales, incluindo API Node.js e banco MySQL.

Tarefas:

1. Auditar arquivos existentes:

- docker-compose.yml
- Dockerfile, se existir
- .dockerignore, se existir
- package.json
- pnpm-lock.yaml
- .env.example
- src/database.ts
- db.sql

2. Criar ou ajustar Dockerfile da API:

- usar imagem Node adequada
- instalar dependências com pnpm
- copiar arquivos corretamente
- compilar TypeScript se necessário
- expor porta 3000
- iniciar aplicação com script apropriado

3. Criar ou ajustar .dockerignore:

- node_modules
- dist
- .git
- coverage
- logs
- .env

4. Atualizar docker-compose.yml para subir:

- api
- mysql

Configuração esperada:

- MySQL na porta interna 3306
- MySQL exposto localmente em 3307
- API exposta em 3000
- API conectando no MySQL pelo host do service, exemplo mysql
- banco tickets criado automaticamente
- db.sql executado no init do container MySQL

5. Criar ou ajustar .env.example com variáveis:

- PORT
- DB_HOST
- DB_PORT
- DB_USER
- DB_PASSWORD
- DB_NAME
- JWT_SECRET

6. Garantir que a aplicação funcione em dois modos:

- local sem Docker usando DB_HOST=localhost e DB_PORT=3307
- Docker Compose usando DB_HOST=mysql e DB_PORT=3306

7. Atualizar README.md:

- como subir com Docker
- como derrubar ambiente
- como resetar volumes
- como acessar MySQL
- como testar health check
- como testar api.http

8. Criar comandos úteis:

- docker compose up --build
- docker compose down
- docker compose down -v
- docker exec -it ticket-sales-db mysql -uroot -proot tickets

Ao finalizar entregue:

# O QUE FOI FEITO

Explique arquivos criados/alterados.

# COMO TESTAR

Liste comandos exatos.

# VALIDAÇÃO

Explique como validar API e banco.

# MENSAGEM DE COMMIT

Sugira mensagem Conventional Commit.

Sugestão:
chore(docker): add api and mysql docker compose setup
