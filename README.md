# ARCA API - Desafio Tecnico Backend

API REST do ARCA, desenvolvida como solucao backend para o desafio tecnico da SIAPESQ. Este repositorio faz parte da entrega junto com o app frontend e o site vitrine.

## Links da entrega

| Item | Link |
| --- | --- |
| Repositorio backend | https://github.com/Michelangelo-Costa/desafio-2026-API-NODE |
| Frontend integrado | https://github.com/Michelangelo-Costa/desafio-2026-FRONT-END |
| Aplicacao publicada | https://app-arca.michelangelocosta.dev/#/login |
| Site vitrine | https://github.com/Michelangelo-Costa/arca-site |
| Site publicado | https://arca-site.michelangelocosta.dev/ |

## Visao geral

A API gerencia autenticacao, usuarios, especies, estatisticas e dados externos usados pelo app ARCA. Ela foi construida para ser consumida pelo frontend do desafio e tambem para sustentar a versao desktop empacotada com Electron.

Principais recursos:

- API REST com Express 5 e TypeScript.
- Persistencia em PostgreSQL via Prisma.
- Autenticacao JWT com senha criptografada usando bcrypt.
- Cadastro, login, usuario autenticado, recuperacao de senha e troca de senha.
- Tokens de reset armazenados com hash e expiracao.
- Envio de email de recuperacao via Resend, com fallback de log em desenvolvimento.
- CRUD de especies com busca, filtro, paginacao e estatisticas.
- Controle de autoria para edicao e exclusao de registros.
- Integracao externa com Open-Meteo para associar dados climaticos por coordenadas.
- Swagger UI em `/docs` e especificacao JSON em `/docs.json`.
- Health check em `/health`.

## Repositorios relacionados

| Repositorio | Papel no ecossistema |
| --- | --- |
| [desafio-2026-API-NODE](https://github.com/Michelangelo-Costa/desafio-2026-API-NODE) | Backend Express/Prisma responsavel por auth, especies, estatisticas e integracao externa. |
| [desafio-2026-FRONT-END](https://github.com/Michelangelo-Costa/desafio-2026-FRONT-END) | App web e base do app desktop ARCA. |
| [arca-site](https://github.com/Michelangelo-Costa/arca-site) | Site publico de apresentacao do ARCA, com chamada para download do instalador. |

## Stack

- Node.js 20
- TypeScript
- Express 5
- Prisma
- PostgreSQL
- JWT
- bcryptjs
- Axios
- Resend
- Swagger UI

## Como executar localmente

Requisitos:

- Node.js 20.x
- npm
- PostgreSQL disponivel localmente ou em servico externo

Instale as dependencias:

```bash
npm install
```

Configure as variaveis:

```bash
cp .env.example .env
```

Exemplo de `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET="troque-este-segredo"
JWT_EXPIRES_IN="7d"
AUTH_DEBUG="false"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
RESEND_API_KEY=
EMAIL_FROM="Arca <noreply@example.com>"
PASSWORD_RESET_URL="http://localhost:5173/reset-password"
```

Gere o client Prisma:

```bash
npm run db:generate
```

Aplique as migrations em desenvolvimento:

```bash
npm run db:migrate
```

Inicie a API:

```bash
npm run dev
```

A API fica disponivel em `http://localhost:3000`.

## Scripts

```bash
npm run dev          # desenvolvimento com tsx watch
npm run build        # compila TypeScript
npm run start        # executa dist/server.js
npm run render:build # prisma generate + build para deploy
npm run db:generate  # gera Prisma Client
npm run db:migrate   # executa migrations em desenvolvimento
npm run db:push      # sincroniza schema sem migration
npm run db:studio    # abre Prisma Studio
```

## Endpoints principais

### Sistema

- `GET /health`
- `GET /docs`
- `GET /docs.json`

### Autenticacao

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/change-password`

### Especies

Todas as rotas de especies exigem `Authorization: Bearer <token>`.

- `GET /species`
- `GET /species/stats`
- `GET /species/:id`
- `POST /species`
- `PUT /species/:id`
- `DELETE /species/:id`

## Integracao com o frontend

O frontend do repositorio [desafio-2026-FRONT-END](https://github.com/Michelangelo-Costa/desafio-2026-FRONT-END) consome esta API por meio da variavel:

```env
VITE_API_URL=http://localhost:3000
```

Em producao, configure `CORS_ORIGIN` na API com a origem do front publicado e ajuste `VITE_API_URL` no build do frontend para a URL publica da API.

## Observacoes para avaliacao

- O repositorio foi mantido como fork/solucao do desafio para preservar rastreabilidade.
- A documentacao Swagger fica em `/docs` quando a API esta rodando.
- A integracao externa usa a API publica Open-Meteo quando latitude e longitude sao enviadas.
- Em desenvolvimento, se `RESEND_API_KEY` nao estiver configurada, o link de reset de senha e exibido no console.
