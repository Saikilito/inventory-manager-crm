# CRM Apollo — Server

Backend GraphQL API para el sistema CRM. Construido con Node.js, Express, Apollo Server y MongoDB.

## Stack

| Tecnología    | Versión         |
| ------------- | --------------- |
| Node.js       | 24 LTS          |
| Express       | ^4.22           |
| Apollo Server | ^4.13           |
| Mongoose      | ^8.24           |
| GraphQL       | ^16.14          |
| JWT           | jsonwebtoken ^9 |
| Bcrypt        | ^5.1            |

## Requisitos

- Node.js 24 LTS o superior
- MongoDB (ver abajo cómo levantarlo)

### MongoDB

Opción 1 — **Docker** (recomendado):

```bash
docker compose up -d
```

Esto levanta MongoDB 7.0 en `localhost:27017` con la base `CRM-Apollo` lista para usar. Los datos persisten en un volumen Docker.

Opción 2 — **Instalación local**: descargá MongoDB Community Server desde mongodb.com y asegurate que corra en `localhost:27017`.

## Scripts

```bash
npm run dev    # node --watch --env-file-if-exists=.env src/index.js

# Producción
npm start      # node --env-file-if-exists=.env src/index.js

# Build (placeholder)
npm run build  # echo ...
```

## Variables de Entorno

Archivo: `server/.env`

```
SECRET=tu_secret_jwt
MONGODB_URI=mongodb://localhost:27017/CRM-Apollo
```

Node.js 24 carga el archivo `.env` automáticamente mediante `--env-file-if-exists=.env`.
Si no existe `.env`, el server usa valores por defecto:

- Puerto: `4555`
- MongoDB: `mongodb://localhost:27017/CRM-Apollo`
- Secret JWT: `JWT_SECRET_DEFAULT`

## Arquitectura

El proyecto sigue una arquitectura **schema-first** de GraphQL con separación clara de responsabilidades:

```
server/
├── src/
│   ├── index.js                  # Entry point — Express + Apollo Server
│   ├── config/
│   │   ├── index.js              # Configuración (puerto, DB, secret)
│   │   ├── apollo.js             # Apollo Server + context JWT + GraphQL schema
│   │   └── db-connection.js      # Conexión a MongoDB (Mongoose)
│   ├── models/
│   │   ├── index.js              # Agrega y exporta todos los modelos
│   │   ├── client.js             # Modelo Client
│   │   ├── product.js            # Modelo Product
│   │   ├── pedido.js             # Modelo Order
│   │   └── users.js              # Modelo User
│   └── api/
│       ├── types/                # Type definitions GraphQL (.gql)
│       │   ├── client.gql
│       │   ├── panel.gql
│       │   ├── pedido.gql
│       │   ├── product.gql
│       │   └── user.gql
│       └── resolvers/            # Resolvers GraphQL (.js)
│           ├── client.js
│           ├── panel.js
│           ├── pedido.js
│           ├── product.js
│           └── user.js
├── package.json
└── README.md
```

### Patrones

- **Schema-first**: Los tipos GraphQL se definen en archivos `.gql` separados y se cargan con `@graphql-tools/load-files`.
- **Resolvers modulares**: Cada dominio tiene su propio archivo de resolvers,合并 por `@graphql-tools/merge`.
- **Contexto JWT**: El token se extrae del header `Authorization` en cada request y se verifica con `jsonwebtoken`. Se expone como `context.token()` para los resolvers.
- **Modelos Mongoose**: Esquemas definidos con Mongoose, exportados de forma centralizada desde `models/index.js`.

## API GraphQL

Endpoint: `POST /graphql`

### Autenticación

```graphql
mutation {
  authenticateUser(user: "admin", password: "1234") {
    token
  }
}
```

Incluir el token en requests subsecuentes:

```
Authorization: <token>
```

### Queries Principales

| Query                                     | Descripción                     |
| ----------------------------------------- | ------------------------------- |
| `getAllClients(limite, offset, sellerID)` | Listar clientes                 |
| `getClient(_id)`                          | Cliente por ID                  |
| `getAllProducts(limite, offset)`          | Listar productos                |
| `getProduct(_id)`                         | Producto por ID                 |
| `getAllOrders(limite, offset)`            | Listar órdenes                  |
| `getOrder(_id)`                           | Orden por ID                    |
| `getOrderClient(client)`                  | Órdenes por cliente             |
| `getUser`                                 | Usuario actual (requiere token) |
| `topClients`                              | Top 10 clientes por gasto       |
| `topSellers`                              | Top 10 vendedores por ventas    |
| `totalClients`                            | Total de clientes               |
| `totalProducts`                           | Total de productos              |
| `totalOrders`                             | Total de órdenes                |

### Mutations Principales

| Mutation                             | Descripción            |
| ------------------------------------ | ---------------------- |
| `setUser(user, name, password, rol)` | Crear usuario          |
| `authenticateUser(user, password)`   | Login — devuelve token |
| `setClient(input)`                   | Crear cliente          |
| `updateClient(_id, input)`           | Actualizar cliente     |
| `deleteClient(_id)`                  | Eliminar cliente       |
| `setProduct(input)`                  | Crear producto         |
| `updateProduct(_id, input)`          | Actualizar producto    |
| `deleteProduct(_id)`                 | Eliminar producto      |
| `setOrder(input)`                    | Crear orden            |
| `updateOrder(_id, input)`            | Actualizar orden       |
| `deleteOrder(_id)`                   | Eliminar orden         |
