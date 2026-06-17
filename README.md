# CRM Apollo

Sistema CRM full-stack con GraphQL. Gestión de clientes, productos, pedidos, y panel de reports con autenticación JWT.

```
                            ┌───────────────────────┐
                            │    React 19 + Vite     │
                            │  @apollo/client hooks  │
                            │  react-router-dom v7   │
                            └──────┬────────────────┘
                                   │ GraphQL (POST /graphql)
                                   │ Authorization: <JWT>
                                   ▼
                            ┌───────────────────────┐
                            │  Express + Apollo v4   │
                            │  Mongoose 8 + GraphQL  │
                            │  jsonwebtoken + bcrypt │
                            └──────┬────────────────┘
                                   │ MongoDB protocol
                                   ▼
                            ┌───────────────────────┐
                            │     MongoDB 7.0        │
                            │   (Docker o local)     │
                            └───────────────────────┘
```

## Stack

### Client (`client/`)

| Tecnología          | Versión     |
| ------------------- | ----------- |
| React               | 19          |
| Vite                | 6           |
| Apollo Client       | 3.13        |
| React Router        | 7           |
| Bootstrap           | 4 (CDN)     |
| Recharts            | 1.x         |
| react-select        | 2.x         |

### Server (`server/`)

| Tecnología          | Versión     |
| ------------------- | ----------- |
| Node.js             | 24 LTS      |
| Express             | 4.22        |
| Apollo Server       | 4.13        |
| Mongoose            | 8.24        |
| GraphQL             | 16          |
| JWT                 | jsonwebtoken 9 |
| Bcrypt              | 5.1         |
| MongoDB             | 7.0         |

## Estructura

```
inventory-manager-crm/
├── client/                     # Frontend — React SPA
│   ├── src/
│   │   ├── index.jsx           # Entry: createRoot + ApolloProvider
│   │   ├── routes/             # Router config (react-router-dom v7)
│   │   ├── pages/              # Page components (Auth, Clients, Products, Pedidos, Panel)
│   │   ├── containers/         # Shared container components
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ApolloBridge.jsx  # <Query>/<Mutation> render-prop compat
│   │   │   └── RouterCompat.jsx  # withRouter + Redirect compat
│   │   └── services/           # GraphQL queries + mutations
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Backend — GraphQL API
│   ├── src/
│   │   ├── index.js            # Express + Apollo Server entry
│   │   ├── config/
│   │   │   ├── apollo.js       # Apollo v4 + @graphql-tools
│   │   │   ├── db-connection.js # Mongoose 8
│   │   │   └── index.js        # Config (port, DB, secret)
│   │   ├── models/             # Mongoose models
│   │   ├── api/types/          # GraphQL type definitions (.gql)
│   │   └── api/resolvers/      # GraphQL resolvers (.js)
│   ├── docker-compose.yml      # MongoDB 7.0 para desarrollo
│   └── package.json
│
├── openspec/                   # SDD artifacts (spec, design, tasks)
└── README.md
```

## Quick Path

### Una vez (setup inicial)

```bash
npm run setup           # npm install en server y client
```

### Cada vez que desarrollás

```bash
# Opción 1 — Todo desde la raíz (recomendado)
cd server && docker compose up -d      # levantar MongoDB
npm run dev                             # server (4555) + client (3000)

# Opción 2 — Terminales separadas
cd server && docker compose up -d       # MongoDB en background
cd server && npm run dev                # Terminal 1: server puerto 4555
cd client && npm run dev                # Terminal 2: client puerto 3000
```

### Scripts desde la raíz

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Server (4555) + Client (3000) en paralelo |
| `npm run start` | Server + Client en modo producción |
| `npm run setup` | Instala dependencias de ambos proyectos |

## Patrones

### GraphQL schema-first

Los tipos se definen en archivos `.gql` dentro de `server/src/api/types/` y se cargan con `@graphql-tools/load-files`. Los resolvers están en `server/src/api/resolvers/` y se mergean automáticamente.

### Apollo Client — hooks

El client usa `@apollo/client` con hooks (`useQuery`, `useMutation`). Para componentes clase que usaban render-props `<Query>`/`<Mutation>`, se mantiene compatibilidad mediante `ApolloBridge.jsx`.

### Autenticación JWT

- Server: el middleware extrae el token del header `Authorization` y lo verifica con `jsonwebtoken`. Se expone como `context.token()`.
- Client: el token se almacena en `localStorage` y se envía en cada request via `setContext` link de Apollo.

### React Router v7

Las rutas se definen con `<Routes>` y `<Route element={}>`. Componentes clase que usaban `withRouter` reciben `history`, `match`, y `location` mediante el wrapper `RouterCompat.jsx`.

## TypeScript Readiness

El proyecto está listo para migrar a TypeScript cuando quieras:

| Componente  | Acción necesaria |
|-------------|------------------|
| Client      | `npm install typescript @types/react @types/react-dom` + `tsc --init`. Vite ya soporta `.tsx` nativo con `@vitejs/plugin-react`. |
| Server      | `npm install typescript @types/node` + `tsc --init`. El build script en `package.json` está preparado para cambiar a `tsc`. |

No hay que renombrar archivos de entrada ni cambiar config de build — Vite y Node 24 (type stripping) ya entienden TS sintaxis.

## Próximos pasos posibles

- [ ] Migrar componentes clase a funciones + hooks
- [ ] Reemplazar Bootstrap 4 CDN por paquete npm (Bootstrap 5)
- [ ] Agregar code-splitting dinámico con `React.lazy()`
- [ ] Migrar Server a TypeScript
- [ ] Tests con Vitest (client) y Node test runner (server)
- [ ] Dockerizar client y server completos
