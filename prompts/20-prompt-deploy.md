Você é um Engenheiro Backend/DevOps Sênior especialista em Node.js, TypeScript, Express, MySQL, Render, Docker, variáveis de ambiente, Swagger/OpenAPI e deploy de APIs REST.

Assuma o projeto Ticket Sales no estado atual.

Objetivo:
Preparar o projeto para deploy no Render, garantindo que a documentação Swagger fique pública em /docs.

Tarefas:

1. Auditar package.json
   Garantir scripts:

- build
- start
- dev
- test
- lint

Build esperado:
pnpm build

Start esperado:
pnpm start

2. Ajustar server.ts
   Garantir:
   const PORT = process.env.PORT || 3000

3. Ajustar conexão com banco
   Garantir que database.ts use variáveis:

- DB_HOST
- DB_PORT
- DB_USER
- DB_PASSWORD
- DB_NAME

4. Ajustar JWT
   Garantir que JWT_SECRET venha de process.env.JWT_SECRET.
   Não deixar segredo hardcoded.

5. Validar Swagger
   Garantir:

- rota /docs ativa
- swaggerSpec funcionando
- principais endpoints documentados

6. Criar/atualizar .env.example
   Com:
   PORT=3000
   DB_HOST=
   DB_PORT=
   DB_USER=
   DB_PASSWORD=
   DB_NAME=
   JWT_SECRET=
   CORS_ORIGIN=

7. Remover qualquer limpeza automática de banco no server.ts
   Em produção o servidor NÃO pode truncar tabelas ao iniciar.

8. Garantir que a aplicação rode no Render
   Render Web Service deve usar:
   Build Command:
   pnpm install && pnpm build

Start Command:
pnpm start

9. Atualizar README.md
   Adicionar seção:

- Deploy no Render
- variáveis de ambiente
- link esperado do Swagger:
  https://seu-servico.onrender.com/docs

10. Rodar validações:
    pnpm lint
    pnpm test
    pnpm build

Ao finalizar, entregar:

# O QUE FOI FEITO

# ARQUIVOS ALTERADOS

# VARIÁVEIS NECESSÁRIAS

# COMO CONFIGURAR NO RENDER

# COMO VALIDAR /health E /docs

# MENSAGEM DE COMMIT

Sugestão:
chore(deploy): prepare render deployment with public swagger docs
