const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const dotenv = require("dotenv");

const ENV_PATH = path.resolve(__dirname, "../../.env");

dotenv.config({ path: ENV_PATH });

function readOptionalFile(filePath) {
    try {
        return fs.readFileSync(filePath, "utf8").trim();
    } catch {
        return "";
    }
}

function readInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function splitCsv(value) {
    return String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function requireValue(name, value) {
    if (!value) {
        throw new Error(`缺少必要环境变量：${name}`);
    }

    return value;
}

function loadEnv() {
    const imaConfigDir = path.join(os.homedir(), ".config", "ima");
    const clientId = process.env.IMA_OPENAPI_CLIENTID || readOptionalFile(path.join(imaConfigDir, "client_id"));
    const apiKey = process.env.IMA_OPENAPI_APIKEY || readOptionalFile(path.join(imaConfigDir, "api_key"));

    return {
        port: readInteger(process.env.PORT, 3001),
        nodeEnv: process.env.NODE_ENV || "development",
        frontendOrigin: process.env.APP_FRONTEND_ORIGIN || "",
        baseUrl: process.env.APP_BASE_URL || "http://localhost:3001",
        logLevel: process.env.LOG_LEVEL || "info",
        adminUsername: process.env.ADMIN_USERNAME || "",
        adminPassword: process.env.ADMIN_PASSWORD || "",
        sessionSecret: process.env.SESSION_SECRET || "",
        adminSessionTtlHours: readInteger(process.env.ADMIN_SESSION_TTL_HOURS, 12),
        ima: {
            clientId: requireValue("IMA_OPENAPI_CLIENTID", clientId),
            apiKey: requireValue("IMA_OPENAPI_APIKEY", apiKey),
            publicKnowledgeBaseId: process.env.IMA_PUBLIC_KB_ID || "",
            allowedProjectSlugs: splitCsv(process.env.IMA_PUBLIC_ALLOWED_PROJECT_SLUGS || "jingyin-agent,ai-interview-review,finance-ocr-tool"),
        },
        rateLimits: {
            searchPerMinute: readInteger(process.env.RATE_LIMIT_SEARCH_PER_MINUTE, 10),
            projectPerMinute: readInteger(process.env.RATE_LIMIT_PROJECT_PER_MINUTE, 30),
        },
    };
}

module.exports = loadEnv();
