async function notesRoutes(app) {
    app.get("/api/public/notes", async (request, reply) => {
        const query = String(request.query?.query || "");
        const cursor = String(request.query?.cursor || "");
        const limit = Number.parseInt(request.query?.limit, 10) || 8;

        const result = await app.services.notes.listNotes({
            query,
            cursor,
            limit: Math.min(Math.max(limit, 1), 20),
        });

        reply.send(result);
    });

    app.get("/api/public/notes/:docId", async (request, reply) => {
        const docId = String(request.params?.docId || "");

        if (!docId) {
            reply.code(400).send({
                message: "缺少笔记 ID",
            });
            return;
        }

        const content = await app.services.notes.getNoteContent(docId);
        reply.send(content);
    });
}

module.exports = notesRoutes;
