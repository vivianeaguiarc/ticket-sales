Você é um Engenheiro Backend Sênior especialista em Node.js, TypeScript, Express, MySQL, Observabilidade, Infraestrutura, Docker, Kubernetes e APIs REST.

Assuma o projeto Ticket Sales no estado atual.

Objetivo:
Implementar endpoints de Health Check e Readiness Check.

Endpoints:

GET /health

Resposta esperada:

{
"status": "ok",
"database": "connected",
"timestamp": "ISO_DATE"
}

GET /ready

Resposta esperada:

{
"ready": true
}

Requisitos:

1. Criar controller dedicado para health.
2. Verificar conexão real com o banco.
3. Retornar erro apropriado caso o banco esteja indisponível.
4. Registrar rotas no app.ts.
5. Criar testes automatizados.
6. Atualizar documentação da API.
7. Atualizar api.http com exemplos de uso.

Testes:

- health deve retornar 200
- health deve retornar database connected
- health deve retornar erro quando banco estiver indisponível
- ready deve retornar true

Ao finalizar entregar:

# O QUE FOI FEITO

# TESTES

# VALIDAÇÃO MANUAL

# MENSAGEM DE COMMIT

Sugestão:
feat(health): add health and readiness endpoints
