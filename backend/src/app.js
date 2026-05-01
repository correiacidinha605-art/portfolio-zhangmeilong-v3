const Fastify = require("fastify");
const cookie = require("@fastify/cookie");
const cors = require("@fastify/cors");
const rateLimit = require("@fastify/rate-limit");

const env = require("./config/env");
const adminRoutes = require("./routes/admin");
const notesRoutes = require("./routes/notes");
const publicRoutes = require("./routes/public");
const { AuthService } = require("./services/auth-service");
const { ImaApiError, ImaClient } = require("./services/ima-client");
const { KnowledgeBaseService } = require("./services/kb-service");
const { NoteService } = require("./services/note-service");

async function createApp() {
    const app = Fastify({
        logger: {
            level: env.logLevel,
        },
    });

    await app.register(cookie, {
        secret: env.sessionSecret || "portfolio-local-dev-secret",
    });

    await app.register(cors, {
        origin(origin, callback) {
            if (!origin || origin === "null") {
                callback(null, true);
                return;
            }

            if (!env.frontendOrigin || origin === env.frontendOrigin) {
                callback(null, true);
                return;
            }

            callback(null, false);
        },
        credentials: true,
    });

    await app.register(rateLimit, {
        global: false,
        addHeadersOnExceeding: {
            "x-ratelimit-limit": true,
            "x-ratelimit-remaining": true,
            "x-ratelimit-reset": true,
        },
    });

    const imaClient = new ImaClient({
        clientId: env.ima.clientId,
        apiKey: env.ima.apiKey,
        ctx: "portfolio-backend/0.1.0",
    });

    const kbService = new KnowledgeBaseService({
        imaClient,
        publicKnowledgeBaseId: env.ima.publicKnowledgeBaseId,
        allowedProjectSlugs: env.ima.allowedProjectSlugs,
    });
    const noteService = new NoteService({
        imaClient,
        publicKnowledgeBaseId: env.ima.publicKnowledgeBaseId,
    });
    const authService = new AuthService({
        username: env.adminUsername,
        password: env.adminPassword,
        ttlHours: env.adminSessionTtlHours,
    });

    app.decorate("env", env);
    app.decorate("authService", authService);
    app.decorate("services", {
        kb: kbService,
        notes: noteService,
    });

    app.setErrorHandler((error, _request, reply) => {
        if (error instanceof ImaApiError) {
            reply.code(error.statusCode).send({
                message: error.message,
                code: error.code,
            });
            return;
        }

        if (error.validation) {
            reply.code(400).send({
                message: "请求参数不合法",
                details: error.validation,
            });
            return;
        }

        app.log.error(error);
        reply.code(500).send({
            message: error.message || "服务器内部错误",
        });
    });

    await app.register(publicRoutes);
    await app.register(notesRoutes);
    await app.register(adminRoutes);

    return app;
}

module.exports = createApp;
