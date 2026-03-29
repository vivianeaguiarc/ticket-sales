# 🎟️ Ticket Sales API

<p align="center">
  <img src="https://img.shields.io/badge/tests-passing-brightgreen" />
  <img src="https://img.shields.io/badge/coverage-85%25-yellowgreen" />
  <img src="https://img.shields.io/badge/Node.js-24.x-339933?logo=nodejs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" />
</p>

---

<p align="center">
  <strong>
    API REST para criação, gerenciamento e venda de ingressos para eventos
  </strong>
</p>

<p align="center">
  Construída com foco em <b>fundamentos sólidos</b>, evolução arquitetural e controle de concorrência 🚀
</p>

---

> ⚠️ O projeto ainda está em evolução e ainda não atingiu o nível final descrito aqui.  
> Este README representa **onde o projeto está caminhando**.

---

## 📌 Visão Geral

O sistema permite:

- 🧑‍💼 Parceiros criarem eventos
- 🎫 Gerenciamento de tickets por lote
- 🛒 Clientes comprarem ingressos
- ❌ Cancelamento de compras
- 📊 Controle de concorrência (evita vendas duplicadas)
- ⚡ Evolução progressiva de arquitetura (monolito → camadas → hexagonal)

---

## 🧠 Regras de Negócio

### 🎟️ Gerenciamento de Tickets

- Apenas o parceiro criador pode gerenciar tickets
- Tickets são criados em lote
- Status inicial: **disponível**

---

### 🛒 Compra de Tickets

- Cliente pode comprar múltiplos tickets
- Um ticket só pode ser comprado uma única vez
- Controle de concorrência evita duplicidade
- Falhas de compra são registradas

---

### ❌ Cancelamento

- Tickets voltam para **disponível**
- Histórico de status é mantido

---

### ⚡ Concorrência

- Preparado para múltiplas requisições simultâneas
- Regras garantem integridade da compra

---

## 🧪 Testes (MUUUITO IMPORTANTE)

> 🚨 Parte essencial do projeto

### 🧪 Tecnologias

- Vitest
- Axios

---

### 📌 Cenários testados

#### ✅ Sucesso

- Criação de evento (201)

#### ❌ Erros

- ownerId inválido
- preço negativo
- latitude/longitude inválidas
- data no passado

#### ⚠️ Regras críticas

- Evitar eventos duplicados
- Garantir integridade de compra

---

### ▶️ Rodar testes

```bash
pnpm test
pnpm test:watch
```

---

## 🏗️ Arquitetura (Evolução)

- ✅ Monolito funcional
- ✅ Camada de Services
- 🔄 Em evolução para Arquitetura Hexagonal

---

## 🛠️ Tecnologias

<p align="center">

<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="50" />
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="50" />
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" width="50" />
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg" width="50" />
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="50" />
<img src="https://vitest.dev/logo.svg" width="50" />
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/eslint/eslint-original.svg" width="50" />
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prettier/prettier-original.svg" width="50" />
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" width="50" />

</p>

<p align="center">
Node.js • TypeScript • Express • MySQL • PostgreSQL • Vitest • ESLint • Prettier • Git
</p>

---

## 🔁 Fluxo de Compra

```mermaid
sequenceDiagram
    participant Cliente
    participant API
    participant Banco

    Cliente->>API: Solicita compra
    API->>Banco: Verifica disponibilidade
    Banco-->>API: Ticket disponível
    API->>Banco: Reserva ticket
    API-->>Cliente: Compra confirmada
```

---

## 🚀 Diferenciais

- ⚡ Controle de concorrência
- 🧪 Testes automatizados
- 🧠 Evolução arquitetural real
- 📈 Projeto focado em fundamentos sólidos

---

## 🗂️ Database ERD

<p align="center">
  <img src="./public/erd-diagram.png" width="800"/>
</p>

## 👩‍💻 Autora

**Viviane Aguiar**  
Backend Developer | Node.js | TypeScript

---

## ⭐ Se este projeto te chamou atenção

Deixe uma ⭐ e acompanhe a evolução 🚀
