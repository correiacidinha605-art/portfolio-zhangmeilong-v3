class ImaApiError extends Error {
    constructor(message, options = {}) {
        super(message);
        this.name = "ImaApiError";
        this.statusCode = options.statusCode || 502;
        this.code = options.code || "IMA_API_ERROR";
        this.details = options.details;
    }
}

class ImaClient {
    constructor({ clientId, apiKey, ctx = "portfolio-backend" }) {
        this.clientId = clientId;
        this.apiKey = apiKey;
        this.ctx = ctx;
        this.baseUrl = "https://ima.qq.com";
    }

    async post(apiPath, body) {
        const response = await fetch(`${this.baseUrl}/${apiPath}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "ima-openapi-clientid": this.clientId,
                "ima-openapi-apikey": this.apiKey,
                "ima-openapi-ctx": this.ctx,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new ImaApiError(`IMA 接口请求失败：${response.status}`, {
                statusCode: response.status,
                code: "IMA_HTTP_ERROR",
            });
        }

        const payload = await response.json();

        if (payload.code !== 0) {
            throw new ImaApiError(payload.msg || "IMA 接口返回错误", {
                statusCode: 502,
                code: "IMA_BUSINESS_ERROR",
                details: payload,
            });
        }

        return payload.data || {};
    }

    getKnowledgeBase(ids) {
        return this.post("openapi/wiki/v1/get_knowledge_base", { ids });
    }

    searchKnowledgeBase(query = "", cursor = "", limit = 10) {
        return this.post("openapi/wiki/v1/search_knowledge_base", {
            query,
            cursor,
            limit,
        });
    }

    searchKnowledge({ knowledgeBaseId, query, cursor = "" }) {
        return this.post("openapi/wiki/v1/search_knowledge", {
            knowledge_base_id: knowledgeBaseId,
            query,
            cursor,
        });
    }

    getKnowledgeList({ knowledgeBaseId, cursor = "", limit = 10, folderId = "" }) {
        const body = {
            knowledge_base_id: knowledgeBaseId,
            cursor,
            limit,
        };

        if (folderId) {
            body.folder_id = folderId;
        }

        return this.post("openapi/wiki/v1/get_knowledge_list", body);
    }

    listNotes({ cursor = "", limit = 10, folderId = "" }) {
        return this.post("openapi/note/v1/list_note", {
            folder_id: folderId,
            cursor,
            limit,
        });
    }

    getDocContent(docId, targetContentFormat = 0) {
        return this.post("openapi/note/v1/get_doc_content", {
            doc_id: docId,
            target_content_format: targetContentFormat,
        });
    }

    importDoc(content, folderId = "") {
        const body = {
            content_format: 1,
            content,
        };

        if (folderId) {
            body.folder_id = folderId;
        }

        return this.post("openapi/note/v1/import_doc", body);
    }

    addKnowledgeNote({ title, knowledgeBaseId, contentId, folderId = "" }) {
        const body = {
            media_type: 11,
            title,
            knowledge_base_id: knowledgeBaseId,
            note_info: {
                content_id: contentId,
            },
        };

        if (folderId) {
            body.folder_id = folderId;
        }

        return this.post("openapi/wiki/v1/add_knowledge", body);
    }
}

module.exports = {
    ImaApiError,
    ImaClient,
};
