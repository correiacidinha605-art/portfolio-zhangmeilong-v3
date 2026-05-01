function getSessionCookie(request) {
    return request.cookies?.portfolio_admin_session || "";
}

async function adminRoutes(app) {
    app.get("/api/admin/me", async (request, reply) => {
        const token = getSessionCookie(request);
        const isAuthenticated = app.authService.isSessionValid(token);

        reply.send({
            authenticated: isAuthenticated,
            username: isAuthenticated ? app.env.adminUsername : "",
        });
    });

    app.post("/api/admin/login", async (request, reply) => {
        if (!app.authService.isConfigured()) {
            reply.code(500).send({
                message: "管理员账号尚未配置",
            });
            return;
        }

        const username = String(request.body?.username || "").trim();
        const password = String(request.body?.password || "");

        if (!app.authService.validateCredentials({ username, password })) {
            reply.code(401).send({
                message: "用户名或密码不正确",
            });
            return;
        }

        const session = app.authService.createSession();

        reply.setCookie("portfolio_admin_session", session.token, {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            maxAge: app.env.adminSessionTtlHours * 60 * 60,
        });

        reply.send({
            authenticated: true,
            username,
        });
    });

    app.post("/api/admin/logout", async (request, reply) => {
        const token = getSessionCookie(request);
        app.authService.destroySession(token);
        reply.clearCookie("portfolio_admin_session", {
            path: "/",
        });
        reply.send({
            authenticated: false,
        });
    });

    app.post("/api/admin/notes/create", async (request, reply) => {
        const token = getSessionCookie(request);

        if (!app.authService.isSessionValid(token)) {
            reply.code(401).send({
                message: "请先进入管理模式再同步笔记",
            });
            return;
        }

        const title = String(request.body?.title || "").trim();
        const content = String(request.body?.content || "").trim();
        const syncToKnowledgeBase = request.body?.syncToKnowledgeBase !== false;

        const result = await app.services.notes.createNote({
            title,
            content,
            syncToKnowledgeBase,
            knowledgeBaseId: app.env.ima.publicKnowledgeBaseId,
        });

        reply.send({
            ok: true,
            ...result,
        });
    });
}

module.exports = adminRoutes;
