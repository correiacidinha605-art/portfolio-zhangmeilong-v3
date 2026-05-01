async function publicRoutes(app) {
    app.get("/api/health", async () => ({
        ok: true,
        service: "portfolio-ima-api",
        now: new Date().toISOString(),
    }));

    app.get("/api/public/kb", async (_request, reply) => {
        const summary = await app.services.kb.getPublicKnowledgeBaseSummary();
        reply.send(summary);
    });

    app.post(
        "/api/public/search",
        {
            config: {
                rateLimit: {
                    max: app.env.rateLimits.searchPerMinute,
                    timeWindow: "1 minute",
                },
            },
        },
        async (request, reply) => {
            const query = typeof request.body?.query === "string" ? request.body.query : "";
            const cursor = typeof request.body?.cursor === "string" ? request.body.cursor : "";

            const result = await app.services.kb.searchPublicKnowledge(query, cursor);

            reply.send({
                query,
                ...result,
            });
        }
    );

    app.get(
        "/api/public/project/:slug",
        {
            config: {
                rateLimit: {
                    max: app.env.rateLimits.projectPerMinute,
                    timeWindow: "1 minute",
                },
            },
        },
        async (request, reply) => {
            const detail = await app.services.kb.getPublicProjectDetail(request.params.slug);

            if (!detail) {
                reply.code(404).send({
                    message: "未找到该项目，或该项目不在公开白名单里。",
                });
                return;
            }

            reply.send(detail);
        }
    );
}

module.exports = publicRoutes;
