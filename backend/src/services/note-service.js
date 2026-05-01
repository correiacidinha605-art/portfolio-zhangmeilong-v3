function toTimestamp(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeNoteItem(item = {}) {
    const basic = item.basic_info?.basic_info || item.basic_info || item.doc?.basic_info || item;
    const ext = basic.note_ext_info || item.note_ext_info || {};

    return {
        docId: basic.note_id || basic.doc_id || basic.docid || "",
        title: basic.title || "未命名笔记",
        summary: basic.summary || "",
        coverImage: basic.cover_image || basic.cover_url || basic.summary_style?.cover_image || "",
        createTime: toTimestamp(basic.create_time),
        modifyTime: toTimestamp(basic.modify_time),
        folderId: ext.folder_id || basic.folder_id || "",
        folderName: ext.folder_name || basic.folder_name || "",
    };
}

class NoteService {
    constructor({ imaClient, publicKnowledgeBaseId }) {
        this.imaClient = imaClient;
        this.publicKnowledgeBaseId = publicKnowledgeBaseId || "";
    }

    async listNotes({ query = "", cursor = "", limit = 10 }) {
        const data = await this.imaClient.listNotes({
            cursor,
            limit,
            folderId: "",
        });

        let items = (data.note_book_list || []).map(normalizeNoteItem);
        const normalizedQuery = String(query || "").trim().toLowerCase();

        if (normalizedQuery) {
            items = items.filter((item) => {
                const haystack = `${item.title}\n${item.summary}`.toLowerCase();
                return haystack.includes(normalizedQuery);
            });
        }

        return {
            items,
            cursor: data.next_cursor || "",
            isEnd: Boolean(data.is_end),
        };
    }

    async getNoteContent(docId) {
        try {
            const structured = await this.imaClient.getDocContent(docId, 2);

            return {
                docId,
                content: structured.content || "",
                contentFormat: "json",
            };
        } catch {
            const plain = await this.imaClient.getDocContent(docId, 0);

            return {
                docId,
                content: plain.content || "",
                contentFormat: "text",
            };
        }
    }

    async createNote({ title, content, syncToKnowledgeBase = false, knowledgeBaseId = "" }) {
        const normalizedTitle = String(title || "").trim();
        const normalizedContent = String(content || "").trim();

        if (!normalizedTitle) {
            throw new Error("标题不能为空");
        }

        if (!normalizedContent) {
            throw new Error("正文不能为空");
        }

        const markdown = `# ${normalizedTitle}\n\n${normalizedContent}`;
        const data = await this.imaClient.importDoc(markdown);
        const docId = data.doc_id;

        let syncResult = null;
        const targetKnowledgeBaseId = knowledgeBaseId || this.publicKnowledgeBaseId;

        if (syncToKnowledgeBase && targetKnowledgeBaseId) {
            const syncData = await this.imaClient.addKnowledgeNote({
                title: normalizedTitle,
                knowledgeBaseId: targetKnowledgeBaseId,
                contentId: docId,
            });

            syncResult = {
                mediaId: syncData.media_id || "",
                knowledgeBaseId: targetKnowledgeBaseId,
            };
        }

        return {
            docId,
            title: normalizedTitle,
            syncResult,
        };
    }
}

module.exports = {
    NoteService,
};
