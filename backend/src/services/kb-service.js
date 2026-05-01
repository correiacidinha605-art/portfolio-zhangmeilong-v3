const PUBLIC_PROJECTS = require("../data/public-projects");

function stripHtml(value) {
    return String(value || "").replace(/<[^>]+>/g, "").trim();
}

function pickKnowledgeBaseId(item) {
    return item?.kb_id || item?.id || "";
}

function pickKnowledgeBaseName(item) {
    return item?.kb_name || item?.name || "";
}

function normalizeKnowledgeBaseInfo(info = {}, fallbackId = "") {
    return {
        id: info.kb_id || info.id || fallbackId,
        name: info.kb_name || info.name || "",
        description: info.description || "",
        coverUrl: info.cover_url || "",
        creator: info.creator || "",
        roleType: info.role_type || "",
        baseType: info.base_type || "",
        contentCount: Number(info.content_count || 0),
        memberCount: Number(info.member_count || 0),
    };
}

function normalizeKnowledgeItem(item = {}) {
    return {
        mediaId: item.media_id || "",
        title: item.title || "",
        snippet: stripHtml(item.highlight_content || ""),
        parentFolderId: item.parent_folder_id || "",
    };
}

function normalizeKnowledgeListItem(item = {}) {
    return {
        mediaId: item.media_id || "",
        title: item.title || "",
        snippet: "",
        parentFolderId: item.parent_folder_id || "",
    };
}

class KnowledgeBaseService {
    constructor({ imaClient, publicKnowledgeBaseId, allowedProjectSlugs }) {
        this.imaClient = imaClient;
        this.publicKnowledgeBaseId = publicKnowledgeBaseId || "";
        this.allowedProjectSlugs = new Set(allowedProjectSlugs);
    }

    async resolvePublicKnowledgeBaseId() {
        if (this.publicKnowledgeBaseId) {
            return this.publicKnowledgeBaseId;
        }

        const data = await this.imaClient.searchKnowledgeBase("", "", 10);
        const infoList = data.info_list || [];

        if (infoList.length === 0) {
            throw new Error("当前账号下没有可用知识库，请先创建知识库或配置 IMA_PUBLIC_KB_ID。");
        }

        if (infoList.length > 1) {
            throw new Error("检测到多个知识库，请在 .env 中显式设置 IMA_PUBLIC_KB_ID。");
        }

        this.publicKnowledgeBaseId = pickKnowledgeBaseId(infoList[0]);
        return this.publicKnowledgeBaseId;
    }

    async getPublicKnowledgeBaseSummary() {
        const knowledgeBaseId = await this.resolvePublicKnowledgeBaseId();
        const data = await this.imaClient.getKnowledgeBase([knowledgeBaseId]);
        const infos = data.infos || {};
        const info = infos[knowledgeBaseId];
        const searchData = await this.imaClient.searchKnowledgeBase("", "", 20);
        const fallback = (searchData.info_list || []).find((item) => pickKnowledgeBaseId(item) === knowledgeBaseId);

        if (info) {
            const merged = {
                ...fallback,
                ...info,
                kb_id: info.kb_id || fallback?.kb_id || knowledgeBaseId,
                kb_name: info.kb_name || fallback?.kb_name || "",
                content_count: info.content_count || fallback?.content_count || 0,
                member_count: info.member_count || fallback?.member_count || 0,
                creator: info.creator || fallback?.creator || "",
                role_type: info.role_type || fallback?.role_type || "",
                base_type: info.base_type || fallback?.base_type || "",
            };

            return normalizeKnowledgeBaseInfo(merged, knowledgeBaseId);
        }

        if (fallback) {
            return normalizeKnowledgeBaseInfo(fallback, knowledgeBaseId);
        }

        throw new Error("已找到知识库 ID，但无法读取知识库详情。");
    }

    async searchPublicKnowledge(query, cursor = "") {
        const knowledgeBaseId = await this.resolvePublicKnowledgeBaseId();
        const normalizedQuery = String(query || "").trim();

        if (!normalizedQuery) {
            const data = await this.imaClient.getKnowledgeList({
                knowledgeBaseId,
                cursor,
                limit: 8,
            });

            const items = (data.knowledge_list || []).map(normalizeKnowledgeListItem);
            const enrichedItems = await this.enrichKnowledgeItems(knowledgeBaseId, items);

            return {
                source: "browse",
                knowledgeBaseId,
                items: enrichedItems,
                cursor: data.next_cursor || "",
                isEnd: Boolean(data.is_end),
            };
        }

        const data = await this.imaClient.searchKnowledge({
            knowledgeBaseId,
            query: normalizedQuery,
            cursor,
        });

        return {
            source: "search",
            knowledgeBaseId,
            items: (data.info_list || []).map(normalizeKnowledgeItem),
            cursor: data.next_cursor || "",
            isEnd: Boolean(data.is_end),
        };
    }

    async enrichKnowledgeItems(knowledgeBaseId, items = []) {
        return Promise.all(
            items.map(async (item) => {
                if (!item.title) {
                    return item;
                }

                try {
                    const data = await this.imaClient.searchKnowledge({
                        knowledgeBaseId,
                        query: item.title,
                        cursor: "",
                    });
                    const matched = (data.info_list || []).find((entry) => {
                        return entry.media_id === item.mediaId || entry.title === item.title;
                    }) || (data.info_list || [])[0];

                    if (!matched?.highlight_content) {
                        return item;
                    }

                    return {
                        ...item,
                        snippet: stripHtml(matched.highlight_content),
                    };
                } catch {
                    return item;
                }
            })
        );
    }

    async getPublicProjectDetail(slug) {
        if (!this.allowedProjectSlugs.has(slug)) {
            return null;
        }

        const project = PUBLIC_PROJECTS[slug];

        if (!project) {
            return null;
        }

        const knowledgeBaseId = await this.resolvePublicKnowledgeBaseId();
        let knowledgePreview = [];

        try {
            const data = await this.searchPublicKnowledge(project.searchQuery, "");
            knowledgePreview = data.items.slice(0, 3);
        } catch {
            knowledgePreview = [];
        }

        return {
            ...project,
            knowledgeBaseId,
            knowledgePreview,
        };
    }
}

module.exports = {
    KnowledgeBaseService,
};
