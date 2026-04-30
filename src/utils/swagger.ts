import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SIAPESQ Species API",
      version: "1.0.0",
      description:
        "API REST para gerenciamento e análise de dados de espécies. Autentique-se via /auth/login e use o token JWT no botão **Authorize**.",
    },
    servers: [{ url: "http://localhost:3000", description: "Desenvolvimento" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", example: "clx..." },
            email: { type: "string", example: "user@email.com" },
            name: { type: "string", example: "João" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" },
            token: { type: "string", example: "eyJhbGci..." },
          },
        },
        Species: {
          type: "object",
          properties: {
            id: { type: "string", example: "clx..." },
            commonName: { type: "string", example: "Arara-azul" },
            scientificName: {
              type: "string",
              example: "Anodorhynchus hyacinthinus",
            },
            category: {
              type: "string",
              enum: ["Bird", "Fish", "Plant", "Mammal", "Reptile", "Other"],
            },
            latitude: { type: "number", example: -15.7801 },
            longitude: { type: "number", example: -47.9292 },
            location: { type: "string", example: "Cerrado, Brasil" },
            observationDate: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            notes: { type: "string", nullable: true },
            status: {
              type: "string",
              enum: ["Active", "Inactive", "Endangered", "Extinct"],
            },
            uniqueIdentifier: { type: "string" },
            weatherData: {
              type: "object",
              nullable: true,
              properties: {
                temperature: { type: "number", example: 25 },
                windspeed: { type: "number", example: 7.6 },
                weathercode: { type: "number", example: 0 },
                time: { type: "string", example: "2026-04-28T20:45" },
              },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        SpeciesInput: {
          type: "object",
          required: ["commonName", "scientificName", "category"],
          properties: {
            commonName: { type: "string", example: "Arara-azul" },
            scientificName: {
              type: "string",
              example: "Anodorhynchus hyacinthinus",
            },
            category: {
              type: "string",
              enum: ["Bird", "Fish", "Plant", "Mammal", "Reptile", "Other"],
            },
            latitude: { type: "number", example: -15.7801 },
            longitude: { type: "number", example: -47.9292 },
            location: { type: "string", example: "Cerrado, Brasil" },
            observationDate: {
              type: "string",
              format: "date",
              example: "2026-04-28",
            },
            notes: { type: "string", example: "Avistada no período da manhã" },
            status: {
              type: "string",
              enum: ["Active", "Inactive", "Endangered", "Extinct"],
              default: "Active",
            },
          },
        },
        PaginatedSpecies: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Species" },
            },
            pagination: {
              type: "object",
              properties: {
                total: { type: "integer", example: 42 },
                page: { type: "integer", example: 1 },
                pageSize: { type: "integer", example: 10 },
                totalPages: { type: "integer", example: 5 },
              },
            },
          },
        },
        Stats: {
          type: "object",
          properties: {
            total: { type: "integer", example: 10 },
            byCategory: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  count: { type: "integer" },
                },
              },
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "Mensagem de erro" },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Autenticação de usuários" },
      { name: "Species", description: "Gerenciamento de espécies" },
    ],
    paths: {
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Registrar novo usuário",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email", example: "user@email.com" },
                    password: { type: "string", minLength: 6, example: "senha123" },
                    name: { type: "string", example: "João Silva" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Usuário criado com sucesso",
              content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
            },
            400: {
              description: "Campos obrigatórios ausentes ou senha fraca",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
            409: {
              description: "Email já cadastrado",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Fazer login e obter JWT",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email", example: "teste@siapesq.com" },
                    password: { type: "string", example: "senha123" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Login realizado com sucesso",
              content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
            },
            401: {
              description: "Credenciais inválidas",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
          },
        },
      },
      "/species": {
        get: {
          tags: ["Species"],
          summary: "Listar espécies com filtros e paginação",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "search", in: "query", description: "Busca por nome comum ou científico", schema: { type: "string" } },
            { name: "category", in: "query", description: "Filtrar por categoria", schema: { type: "string", enum: ["Bird", "Fish", "Plant", "Mammal", "Reptile", "Other"] } },
            { name: "page", in: "query", description: "Número da página", schema: { type: "integer", default: 1 } },
            { name: "pageSize", in: "query", description: "Itens por página (máx 100)", schema: { type: "integer", default: 10 } },
          ],
          responses: {
            200: { description: "Lista paginada de espécies", content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedSpecies" } } } },
            401: { description: "Não autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        post: {
          tags: ["Species"],
          summary: "Cadastrar nova espécie (busca clima automaticamente)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/SpeciesInput" } } },
          },
          responses: {
            201: { description: "Espécie criada com dados de clima (quando lat/lon fornecidos)", content: { "application/json": { schema: { $ref: "#/components/schemas/Species" } } } },
            400: { description: "Campos obrigatórios ausentes ou valores inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "Não autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/species/stats": {
        get: {
          tags: ["Species"],
          summary: "Estatísticas de espécies por categoria",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Contagem total e por categoria", content: { "application/json": { schema: { $ref: "#/components/schemas/Stats" } } } },
            401: { description: "Não autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/species/{id}": {
        get: {
          tags: ["Species"],
          summary: "Buscar espécie por ID",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Dados da espécie", content: { "application/json": { schema: { $ref: "#/components/schemas/Species" } } } },
            404: { description: "Espécie não encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        put: {
          tags: ["Species"],
          summary: "Atualizar espécie",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/SpeciesInput" } } },
          },
          responses: {
            200: { description: "Espécie atualizada", content: { "application/json": { schema: { $ref: "#/components/schemas/Species" } } } },
            404: { description: "Espécie não encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        delete: {
          tags: ["Species"],
          summary: "Remover espécie",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            204: { description: "Espécie removida com sucesso" },
            404: { description: "Espécie não encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
