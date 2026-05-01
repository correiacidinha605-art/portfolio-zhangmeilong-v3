const createApp = require("./app");

async function start() {
    const app = await createApp();

    try {
        await app.listen({
            host: "0.0.0.0",
            port: app.env.port,
        });
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
}

start();
