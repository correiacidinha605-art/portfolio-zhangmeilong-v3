const crypto = require("node:crypto");

class AuthService {
    constructor({ username, password, ttlHours = 12 }) {
        this.username = username;
        this.password = password;
        this.ttlMs = ttlHours * 60 * 60 * 1000;
        this.sessions = new Map();
    }

    isConfigured() {
        return Boolean(this.username && this.password);
    }

    validateCredentials({ username, password }) {
        return username === this.username && password === this.password;
    }

    createSession() {
        const token = crypto.randomBytes(24).toString("hex");
        const expiresAt = Date.now() + this.ttlMs;
        this.sessions.set(token, expiresAt);
        return {
            token,
            expiresAt,
        };
    }

    isSessionValid(token) {
        if (!token) {
            return false;
        }

        const expiresAt = this.sessions.get(token);

        if (!expiresAt) {
            return false;
        }

        if (expiresAt < Date.now()) {
            this.sessions.delete(token);
            return false;
        }

        return true;
    }

    destroySession(token) {
        if (token) {
            this.sessions.delete(token);
        }
    }
}

module.exports = {
    AuthService,
};
