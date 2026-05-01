const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");
const navLinks = [...document.querySelectorAll(".nav a")];
const revealItems = [...document.querySelectorAll(".reveal")];
const sections = [...document.querySelectorAll("section[id]")];
const projectActionButtons = [...document.querySelectorAll(".project-action-btn")];
const projectPanel = document.getElementById("projectPanel");
const projectPanelCloseTargets = [...document.querySelectorAll("[data-project-close]")];
const projectPanelLabel = document.getElementById("projectPanelLabel");
const projectPanelTitle = document.getElementById("projectPanelTitle");
const projectPanelSubtitle = document.getElementById("projectPanelSubtitle");
const projectPanelTags = document.getElementById("projectPanelTags");
const projectPanelStatus = document.getElementById("projectPanelStatus");
const projectPanelTeaser = document.getElementById("projectPanelTeaser");
const projectPanelHighlights = document.getElementById("projectPanelHighlights");
const projectPanelResultsTitle = document.getElementById("projectPanelResultsTitle");
const projectPanelResultsMeta = document.getElementById("projectPanelResultsMeta");
const projectPanelResults = document.getElementById("projectPanelResults");
const notesSearchInput = document.getElementById("notesSearchInput");
const notesSearchBtn = document.getElementById("notesSearchBtn");
const notesRefreshBtn = document.getElementById("notesRefreshBtn");
const notesList = document.getElementById("notesList");
const notesKbMeta = document.getElementById("notesKbMeta");
const notesKbItems = document.getElementById("notesKbItems");
const notesReaderLabel = document.getElementById("notesReaderLabel");
const notesReaderTitle = document.getElementById("notesReaderTitle");
const notesReaderMeta = document.getElementById("notesReaderMeta");
const notesReaderSummary = document.getElementById("notesReaderSummary");
const notesReaderContent = document.getElementById("notesReaderContent");
const notesLoginToggle = document.getElementById("notesLoginToggle");
const notesAdminStatus = document.getElementById("notesAdminStatus");
const notesLoginForm = document.getElementById("notesLoginForm");
const notesComposeForm = document.getElementById("notesComposeForm");
const notesAdminUsername = document.getElementById("notesAdminUsername");
const notesAdminPassword = document.getElementById("notesAdminPassword");
const notesCancelLoginBtn = document.getElementById("notesCancelLoginBtn");
const notesComposeTitle = document.getElementById("notesComposeTitle");
const notesComposeContent = document.getElementById("notesComposeContent");
const notesSyncCheckbox = document.getElementById("notesSyncCheckbox");
const notesSyncBtn = document.getElementById("notesSyncBtn");
const notesLogoutBtn = document.getElementById("notesLogoutBtn");
const apiBase = window.PORTFOLIO_API_BASE || (window.location.protocol === "file:" ? "http://127.0.0.1:3218" : "");

let activeProjectButton = null;
let notesState = {
    cursor: "",
    activeDocId: "",
    activeQuery: "",
    authenticated: false,
    items: [],
};

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function safeExternalUrl(value) {
    const url = String(value || "").trim();
    return /^https?:\/\//i.test(url) ? url : "";
}

function isImageUrl(value) {
    return /^https?:\/\/[^\s"'<>]+\.(png|jpe?g|gif|webp)(\?[^\s"'<>]*)?$/i.test(String(value || "").trim());
}

function renderImageFigure(url, alt = "笔记图片") {
    const safeUrl = safeExternalUrl(url);
    if (!safeUrl) {
        return "";
    }

    return `
        <figure class="notes-image-figure">
            <img src="${escapeHtml(safeUrl)}" alt="${escapeHtml(alt || "笔记图片")}" loading="lazy">
            ${alt ? `<figcaption>${escapeHtml(alt)}</figcaption>` : ""}
        </figure>
    `;
}

function renderInlineMarkdown(value) {
    let html = escapeHtml(value);

    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_match, text, url) => {
        const safeUrl = safeExternalUrl(url);
        if (!safeUrl) {
            return text;
        }

        return `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    });
    html = html.replace(/(^|[\s(])(https?:\/\/[^\s<>()]+)(?=$|[\s)])/g, (_match, prefix, url) => {
        const safeUrl = safeExternalUrl(url);
        if (!safeUrl || isImageUrl(safeUrl)) {
            return `${prefix}${url}`;
        }

        return `${prefix}<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(safeUrl)}</a>`;
    });

    return html;
}

function renderMarkdownContent(rawContent) {
    const content = String(rawContent || "").replace(/\r\n/g, "\n").trim();
    if (!content) {
        return `<p class="notes-muted">这篇笔记暂时没有正文内容。</p>`;
    }

    const lines = content.split("\n");
    const output = [];
    let paragraph = [];
    let listType = "";

    function flushParagraph() {
        if (!paragraph.length) {
            return;
        }

        output.push(`<p>${renderInlineMarkdown(paragraph.join(" "))}</p>`);
        paragraph = [];
    }

    function closeList() {
        if (!listType) {
            return;
        }

        output.push(`</${listType}>`);
        listType = "";
    }

    function ensureList(type) {
        flushParagraph();
        if (listType === type) {
            return;
        }

        closeList();
        output.push(`<${type}>`);
        listType = type;
    }

    lines.forEach((line) => {
        const trimmed = line.trim();

        if (!trimmed) {
            flushParagraph();
            closeList();
            return;
        }

        const imageMatch = trimmed.match(/^!\[(.*?)\]\((https?:\/\/[^)\s]+)\)$/i);
        const rawImageUrl = isImageUrl(trimmed) ? trimmed : "";

        if (imageMatch || rawImageUrl) {
            flushParagraph();
            closeList();
            output.push(renderImageFigure(rawImageUrl || imageMatch[2], imageMatch?.[1] || "笔记图片"));
            return;
        }

        const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
        if (heading) {
            flushParagraph();
            closeList();
            const level = Math.min(heading[1].length + 2, 5);
            output.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
            return;
        }

        const unordered = trimmed.match(/^[-*]\s+(.+)$/);
        if (unordered) {
            ensureList("ul");
            output.push(`<li>${renderInlineMarkdown(unordered[1])}</li>`);
            return;
        }

        const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);
        if (ordered) {
            ensureList("ol");
            output.push(`<li>${renderInlineMarkdown(ordered[1])}</li>`);
            return;
        }

        const quote = trimmed.match(/^>\s+(.+)$/);
        if (quote) {
            flushParagraph();
            closeList();
            output.push(`<blockquote>${renderInlineMarkdown(quote[1])}</blockquote>`);
            return;
        }

        paragraph.push(trimmed);
    });

    flushParagraph();
    closeList();

    return output.join("");
}

function extractStructuredImages(value, collected = new Set()) {
    if (!value) {
        return collected;
    }

    if (typeof value === "string") {
        const matches = value.match(/https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|gif|webp)(?:\?[^\s"'<>]*)?/gi) || [];
        matches.forEach((url) => collected.add(url));
        return collected;
    }

    if (Array.isArray(value)) {
        value.forEach((item) => extractStructuredImages(item, collected));
        return collected;
    }

    if (typeof value === "object") {
        Object.values(value).forEach((item) => extractStructuredImages(item, collected));
    }

    return collected;
}

function renderStructuredNode(value) {
    if (!value) {
        return "";
    }

    if (typeof value === "string") {
        return renderMarkdownContent(value);
    }

    if (Array.isArray(value)) {
        return value.map(renderStructuredNode).join("");
    }

    if (typeof value !== "object") {
        return "";
    }

    const type = String(value.type || value.block_type || value.kind || "").toLowerCase();
    const text = value.text || value.plain_text || value.markdown || value.content_text || "";
    const title = value.title || value.heading || "";
    const imageUrl = value.url || value.src || value.image_url || value.imageUrl || value.cover_url || "";
    const children = value.children || value.blocks || value.elements || value.items || value.content || value.contents || "";
    const parts = [];

    if (imageUrl && (type.includes("image") || isImageUrl(imageUrl))) {
        parts.push(renderImageFigure(imageUrl, title || value.alt || "笔记图片"));
    }

    if (title && !imageUrl) {
        parts.push(`<h3>${renderInlineMarkdown(title)}</h3>`);
    }

    if (text && typeof text === "string") {
        parts.push(renderMarkdownContent(text));
    }

    if (children && children !== text) {
        parts.push(renderStructuredNode(children));
    }

    return parts.join("");
}

function renderNoteBody(rawContent, contentFormat = "text") {
    const content = String(rawContent || "");

    if (contentFormat === "json") {
        try {
            const parsed = JSON.parse(content);
            const rendered = renderStructuredNode(parsed);
            const imageUrls = [...extractStructuredImages(parsed)]
                .filter((url) => isImageUrl(url))
                .map((url) => renderImageFigure(url));

            if (rendered || imageUrls.length) {
                return `${rendered}${imageUrls.join("")}`;
            }
        } catch {
            // IMA may still return plain text even when JSON format is requested.
        }
    }

    return renderMarkdownContent(content);
}

function splitKnowledgePoints(value) {
    const clean = String(value || "")
        .replace(/\s+/g, " ")
        .replace(/([。；;])\s*/g, "$1\n")
        .trim();

    if (!clean) {
        return [];
    }

    return clean
        .split(/\n+/)
        .map((item) => item.trim())
        .filter((item) => item.length > 2)
        .slice(0, 5);
}

function getKnowledgeType(item = {}) {
    const value = `${item.mediaId || ""} ${item.title || ""}`.toLowerCase();

    if (value.includes(".pdf") || value.startsWith("pdf_")) {
        return "PDF 文档";
    }
    if (value.includes(".doc") || value.includes(".docx") || value.startsWith("word_")) {
        return "Word 文档";
    }
    if (value.includes(".ppt") || value.includes(".pptx") || value.startsWith("ppt_")) {
        return "演示文稿";
    }
    if (value.includes(".jpg") || value.includes(".jpeg") || value.includes(".png") || value.includes(".webp") || value.startsWith("img_")) {
        return "图片资料";
    }
    if (value.startsWith("note_")) {
        return "IMA 笔记";
    }

    return "知识条目";
}

function renderKnowledgeFallback(item = {}) {
    const type = getKnowledgeType(item);
    const points = [
        `资料类型：${type}`,
        "当前来自 IMA 知识库索引，已完成标题与来源识别",
        "IMA 浏览接口暂未返回正文摘要，搜索命中后会自动展示高亮内容",
    ];

    return `
        <ul class="knowledge-points knowledge-points-muted">
            ${points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
        </ul>
    `;
}

function renderKnowledgeSnippet(snippet, emptyText = "IMA 当前只返回了标题，还没有返回可展示的摘要。", item = null) {
    const points = splitKnowledgePoints(snippet);

    if (!points.length) {
        if (item) {
            return renderKnowledgeFallback(item);
        }

        return `<p class="notes-muted">${escapeHtml(emptyText)}</p>`;
    }

    if (points.length === 1) {
        return renderMarkdownContent(points[0]);
    }

    return `
        <ul class="knowledge-points">
            ${points.map((point) => `<li>${renderInlineMarkdown(point)}</li>`).join("")}
        </ul>
    `;
}

if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
        nav.classList.toggle("open");
    });

    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            nav.classList.remove("open");
        });
    });
}

const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                revealObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.12 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const activeObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            const currentId = entry.target.id;
            navLinks.forEach((link) => {
                link.classList.toggle("active", link.getAttribute("href") === `#${currentId}`);
            });
        });
    },
    {
        rootMargin: "-30% 0px -55% 0px",
        threshold: 0.01,
    }
);

sections.forEach((section) => activeObserver.observe(section));

function getActionText(action, detail) {
    if (action === "secondary") {
        return detail?.cta?.secondaryLabel || "项目资料";
    }

    return detail?.cta?.previewLabel || "项目效果预览";
}

function setProjectButtonLoading(button, isLoading, text = "") {
    if (!button) {
        return;
    }

    if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent.trim();
    }

    button.classList.toggle("is-loading", isLoading);
    button.setAttribute("aria-disabled", String(isLoading));
    button.textContent = isLoading ? text || "加载中..." : button.dataset.originalText;
}

function openProjectPanel() {
    if (!projectPanel) {
        return;
    }

    projectPanel.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
        projectPanel.classList.add("open");
    });
}

function closeProjectPanel() {
    if (!projectPanel || projectPanel.hidden) {
        return;
    }

    projectPanel.classList.remove("open");
    document.body.style.overflow = "";
    window.setTimeout(() => {
        projectPanel.hidden = true;
    }, 220);
}

function renderProjectTags(tags = []) {
    if (!projectPanelTags) {
        return;
    }

    projectPanelTags.innerHTML = tags
        .map((tag) => `<span>${escapeHtml(tag)}</span>`)
        .join("");
}

function renderProjectHighlights(highlights = []) {
    if (!projectPanelHighlights) {
        return;
    }

    projectPanelHighlights.innerHTML = highlights
        .map((item) => `<li>${item}</li>`)
        .join("");
}

function renderProjectResults(items = [], emptyText = "知识库里还没有可展示的公开资料。") {
    if (!projectPanelResults) {
        return;
    }

    if (!items.length) {
        projectPanelResults.innerHTML = `<div class="project-panel-empty">${emptyText}</div>`;
        return;
    }

    projectPanelResults.innerHTML = items
        .map((item) => {
            const title = escapeHtml(item.title || "未命名资料");
            return `
                <article class="project-panel-result">
                    <h5>${title}</h5>
                    <div class="knowledge-card-body">
                        ${renderKnowledgeSnippet(item.snippet, "这条资料暂时还没有可展示的摘要。", item)}
                    </div>
                </article>
            `;
        })
        .join("");
}

function getMockRows(rows) {
    return rows
        .map((row) => `
            <tr>
                ${row.map((cell) => `<td>${cell}</td>`).join("")}
            </tr>
        `)
        .join("");
}

function renderJingyinTableMock(type = "record") {
    const isRecord = type === "record";
    const headers = isRecord
        ? ["话单ID", "客户ID", "录音名称", "录音等级", "录音分类", "录音类型", "备注", "创建人", "操作"]
        : ["客户池", "一级标签", "话术分类", "话术内容", "修改时间", "操作人", "校准状态", "启用状态", "操作"];
    const rows = isRecord
        ? [
            ["D9874618", "K6235725", "整通话单", "高", "优秀话单", "销售流程类", "引导至发票提额入口", "余艳", "播放&nbsp;&nbsp;编辑&nbsp;&nbsp;删除"],
            ["D9373351", "K4823077", "整通录音", "中高", "优秀话单", "销售流程类", "复贷-开场简洁明了", "汪丹", "播放&nbsp;&nbsp;编辑&nbsp;&nbsp;删除"],
            ["D9369701", "K6195228", "整通录音", "中高", "优秀话单", "销售流程类", "首贷-来电目的明确", "汪丹", "播放&nbsp;&nbsp;编辑&nbsp;&nbsp;删除"],
            ["D9377888", "K6053176", "整通录音", "中", "优秀话单", "产品类", "复贷-来电目的明确", "汪丹", "播放&nbsp;&nbsp;编辑&nbsp;&nbsp;删除"]
        ]
        : [
            ["B端-企业主贷款客户池", "异议处理", "普通话术", "您可以先看一下手机上应用的是京东还是京东金融...", "2025-12-09 21:08", "system", "待校准", "待启用", "校准&nbsp;&nbsp;通过&nbsp;&nbsp;驳回"],
            ["B端-企业主贷款客户池", "产介", "普通话术", "因为我们关注的是额度，年化话术目前还没有给您做过调整...", "2025-12-09 21:07", "system", "待校准", "待启用", "校准&nbsp;&nbsp;通过&nbsp;&nbsp;驳回"],
            ["B端-企业主贷款客户池", "开场", "普通话术", "您好，这边是京东金融企业主贷客户专员...", "2025-12-09 21:07", "system", "待校准", "待启用", "校准&nbsp;&nbsp;通过&nbsp;&nbsp;驳回"],
            ["B端-企业主贷款客户池", "促单", "普通话术", "现在平台在做活动，调整账户后可以直接查看额度...", "2025-12-09 20:48", "system", "待校准", "待启用", "校准&nbsp;&nbsp;通过&nbsp;&nbsp;驳回"]
        ];

    return `
        <div class="scrm-mock ${isRecord ? "scrm-mock-record" : "scrm-mock-script"}" aria-label="${isRecord ? "优秀话单挖掘界面示意" : "话术知识挖掘界面示意"}">
            <div class="scrm-topbar">
                <span></span>
                <strong>${isRecord ? "录音分享" : "优秀话术"}</strong>
                <em>页签选项</em>
            </div>
            <div class="scrm-tabs">
                <span>工作台</span>
                <span class="is-active">${isRecord ? "录音分享" : "优秀话术"}</span>
                ${isRecord ? "<span>优秀话术</span>" : ""}
            </div>
            <div class="scrm-filters">
                <label>客户池<input value="B端-企业主贷款客户池" readonly></label>
                <label>${isRecord ? "话单ID" : "外呼批次"}<input placeholder="请选择" readonly></label>
                <label>${isRecord ? "录音名称" : "职场信息"}<input placeholder="请选择" readonly></label>
                <label>${isRecord ? "录音分类" : "话术分类"}<input placeholder="请选择" readonly></label>
            </div>
            <div class="scrm-actions">
                <button type="button">${isRecord ? "查询" : "批量通过"}</button>
                <button type="button" class="is-ghost">重置</button>
                <button type="button">${isRecord ? "添加话单分享" : "批量设为黄金话术"}</button>
            </div>
            <div class="scrm-table-wrap">
                <table class="scrm-table">
                    <thead>
                        <tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>
                    </thead>
                    <tbody>${getMockRows(rows)}</tbody>
                </table>
            </div>
        </div>
    `;
}

function renderJingyinReviewMock() {
    const chatItems = [
        ["坐席", "您先确认一下这边的话是先生本人接听电话是吧", "pass"],
        ["客户", "你哪里", ""],
        ["坐席", "您好，我是京东金融客户专员，来电是想邀请您使用京东企业主贷。", "pass"],
        ["坐席", "待考虑到您账户中当前年化利率比较高，省起来不合适。", "pass"],
        ["坐席", "所以今天来电主要是邀请您参与额度和利息的调整活动。", "pass"]
    ];

    return `
        <div class="review-mock" aria-label="知识标注复核界面示意">
            <div class="review-titlebar">
                <strong>校准任务</strong>
                <span>话单ID：D9983239&nbsp;&nbsp;客户ID：K6261669&nbsp;&nbsp;外呼职场：B端企业主贷</span>
            </div>
            <div class="review-layout">
                <section class="review-chat">
                    <div class="review-chat-head">
                        <strong>同一话单待校准话术</strong>
                        <span>共4条 / 下一条</span>
                    </div>
                    <div class="review-bubbles">
                        ${chatItems.map(([role, text, status]) => `
                            <div class="review-bubble-row ${role === "坐席" ? "is-agent" : "is-customer"}">
                                ${status ? `<span class="review-pass">已通过</span>` : ""}
                                <p>${text}</p>
                                <em>${role}</em>
                            </div>
                        `).join("")}
                    </div>
                    <div class="audio-bar">
                        <span></span>
                        <i></i>
                        <strong>-10:14</strong>
                    </div>
                </section>
                <section class="review-form">
                    <h5>AI推荐理由</h5>
                    <p class="review-reason">基础行动号召清晰，在客户多次异议时，能通过“风险移除”和“利他性”话术降低顾虑，并沉淀为可复用标签。</p>
                    <h5>话术校准</h5>
                    <label>话术原文<textarea readonly>您可以先看一下您手机上边用的是京东还是京东金融，然后选择完成后直接点击确认借款。</textarea></label>
                    <label>优化话术<textarea readonly>您可以先看一下手机应用，然后按页面提示完成确认。页面显示审核中后，后续保持良好还款习惯即可。</textarea></label>
                    <h5>标签校准</h5>
                    <div class="review-tags">
                        <span>一级分类：促单</span>
                        <span>话术分类：普通话术</span>
                        <span>同步：JoyContext知识库</span>
                    </div>
                </section>
            </div>
        </div>
    `;
}

function renderJingyinPreview() {
    if (!projectPanelResults) {
        return;
    }

    projectPanel.classList.remove("project-panel-interview", "project-panel-finance");
    projectPanel.classList.add("project-panel-showcase");
    projectPanelLabel.textContent = "项目效果预览";
    projectPanelTitle.textContent = "京音 SCRM Agent 应用｜微电业务营销话术挖掘";
    projectPanelSubtitle.textContent = "面向录音筛选、话术知识挖掘、话单切割、知识标注复核到 JoyContext 同步的一体化业务闭环。";
    renderProjectTags(["优秀话单", "话术知识挖掘", "智能切割", "JoyContext"]);
    setProjectPanelStatus("点击“项目效果预览”后展示本地产品样式，不依赖后端 IMA 凭证。");
    projectPanelTeaser.textContent = "该能力将优质通话从原始录音中识别出来，抽取可复用话术片段，并通过人工复核沉淀到 JoyContext 知识库，供下游电销、企微和质培 Agent 使用。";
    renderProjectHighlights([
        "优秀话单挖掘：按客户、话单、录音等级、录音类型等维度筛选，发现高质量营销通话样本。",
        "话术知识智能挖掘，话单智能切割：自动识别开场、产介、促单、异议处理等片段，形成待校准话术池。",
        "知识标注、复核：AI 给出推荐理由、优化话术和标签建议，启动后自动同步至 JoyContext 知识库。"
    ]);
    projectPanelResultsTitle.textContent = "产品效果";
    projectPanelResultsMeta.textContent = "SCRM Agent Preview";
    projectPanelResults.innerHTML = `
        <div class="jingyin-preview-doc">
            <section class="jingyin-preview-section">
                <h5>1、优秀话单挖掘</h5>
                ${renderJingyinTableMock("record")}
            </section>
            <section class="jingyin-preview-section">
                <h5>2、话术知识智能挖掘，话单智能切割</h5>
                ${renderJingyinTableMock("script")}
            </section>
            <section class="jingyin-preview-section">
                <h5>3、知识标注、复核（启动即自动同步至JoyContext知识库）</h5>
                ${renderJingyinReviewMock()}
            </section>
        </div>
    `;
}

function renderJingyinWorkflow() {
    if (!projectPanelResults) {
        return;
    }

    projectPanel.classList.remove("project-panel-interview", "project-panel-finance");
    projectPanel.classList.add("project-panel-showcase");
    projectPanelLabel.textContent = "工作流预览";
    projectPanelTitle.textContent = "京音 SCRM Agent 应用｜工作流";
    projectPanelSubtitle.textContent = "从原始录音与企微聊天数据，到话术挖掘、人工复核、知识入库和下游 Agent 应用的完整链路。";
    renderProjectTags(["Workflow", "话术挖掘", "知识入库", "JoyContext"]);
    setProjectPanelStatus("这里展示你上传的工作流截图，不依赖后端或 IMA 知识库。");
    projectPanelTeaser.textContent = "工作流覆盖优秀话单识别、话术切割与抽取、标签推荐、人工校准、Bad Case 回流，以及同步至 JoyContext 后支撑电销、企微、质培等应用。";
    renderProjectHighlights([
        "输入：通话录音、企微聊天记录和客户池业务数据。",
        "处理：多节点 Agent 完成筛选、切割、抽取、标注、复核与质量回流。",
        "输出：结构化话术知识沉淀到 JoyContext，支撑下游业务 Agent 调用。"
    ]);
    projectPanelResultsTitle.textContent = "工作流截图";
    projectPanelResultsMeta.textContent = "Uploaded Workflow";
    projectPanelResults.innerHTML = `
        <div class="jingyin-workflow-actions">
            <a href="https://www.coze.cn/work_flow?workflow_id=7626748792133795891&space_id=7610436043732779008" target="_blank" rel="noopener noreferrer">
                打开 Coze 在线预览
            </a>
        </div>
        <figure class="jingyin-workflow-figure">
            <img src="assets/jingyin-workflow-nodes.png?v=2" alt="京音 SCRM Agent 应用工作流截图" loading="lazy">
            <figcaption>京音 SCRM Agent 应用工作流全景图</figcaption>
        </figure>
    `;
}

function renderInterviewUploadMock() {
    return `
        <div class="interview-upload-mock" aria-label="面试录音上传示意">
            <div class="interview-upload-drop">
                <span>REC</span>
                <strong>上传面试录音</strong>
                <p>支持 MP3 / WAV / M4A，上传后自动进入语音转写、问题抽取和复盘分析链路。</p>
                <button type="button">选择录音文件</button>
            </div>
            <div class="interview-upload-steps">
                <span class="is-done">1 上传录音</span>
                <span>2 AI 处理</span>
                <span>3 查看复盘</span>
            </div>
        </div>
    `;
}

function renderInterviewPreviewCard(item) {
    const media = item.image
        ? `<img src="${item.image}" alt="${escapeHtml(item.title)}界面截图" loading="lazy">`
        : renderInterviewUploadMock();

    return `
        <article class="interview-preview-card" id="${escapeHtml(item.anchor)}">
            <div class="interview-preview-copy">
                <span>${escapeHtml(item.index)}</span>
                <h5>${escapeHtml(item.title)}</h5>
                <p>${escapeHtml(item.description)}</p>
            </div>
            <div class="interview-preview-media">
                ${media}
            </div>
        </article>
    `;
}

function renderInterviewPreview() {
    if (!projectPanelResults) {
        return;
    }

    const items = [
        {
            index: "01",
            anchor: "interview-jd-fill",
            title: "面试 JD 自动识别并填充",
            description: "复制招聘截图或粘贴 JD 文本后，系统自动识别公司名称、岗位名称和岗位 JD，减少手动录入成本。",
            image: "assets/interview-preview-jd-fill.png"
        },
        {
            index: "02",
            anchor: "interview-calendar",
            title: "面试日历",
            description: "自动同步每一轮面试时间、公司岗位和轮次，把本周安排与下一场面试集中展示，方便提前规划节奏。",
            image: "assets/interview-preview-calendar.png"
        },
        {
            index: "03",
            anchor: "interview-list",
            title: "全部面试条目展示",
            description: "把不同公司的面试进度集中到同一个列表，展示阶段数、复盘状态、整体进度、最终结果和下一步动作。",
            image: "assets/interview-preview-list.png"
        },
        {
            index: "04",
            anchor: "interview-stage-add",
            title: "面试阶段添加",
            description: "支持新增一面、二面、三面、HR 面等阶段，补充面试时间、阶段结果、反馈和阶段记录。",
            image: "assets/interview-preview-stage-add.png"
        },
        {
            index: "05",
            anchor: "interview-flow",
            title: "面试流程管理",
            description: "用阶段时间线管理完整面试流程，区分已通过、待面试、待录音和待添加阶段，形成清晰推进节奏。",
            image: "assets/interview-preview-flow.png"
        },
        {
            index: "06",
            anchor: "interview-motivation-stage",
            title: "面试阶段激励",
            description: "阶段通过后弹出鼓励反馈，降低复盘工具的冷冰冰感，让用户在求职压力里获得即时正反馈。",
            image: "assets/interview-preview-motivation-stage.png"
        },
        {
            index: "07",
            anchor: "interview-motivation-offer",
            title: "Offer 激励反馈",
            description: "最终通过后展示更强的庆祝反馈和陪伴式视觉元素，把流程管理和情绪价值结合起来。",
            image: "assets/interview-preview-motivation-offer.png"
        },
        {
            index: "08",
            anchor: "interview-upload",
            title: "面试录音上传",
            description: "在具体面试阶段上传录音，触发自动转写、问题梳理和复盘报告生成，为后续分析提供原始材料。",
            image: ""
        },
        {
            index: "09",
            anchor: "interview-report",
            title: "面试分析：复盘报告",
            description: "生成综合得分、状态、录音概览、岗位信息与复盘摘要，帮助用户快速判断这一轮面试表现。",
            image: "assets/interview-preview-upload.png"
        },
        {
            index: "10",
            anchor: "interview-transcript",
            title: "面试分析：录音转写",
            description: "按说话人和时间轴展示转写片段，保留完整上下文，方便回看关键问题和回答细节。",
            image: "assets/interview-preview-transcript.png"
        },
        {
            index: "11",
            anchor: "interview-question-analysis",
            title: "面试分析：问题梳理",
            description: "结合转写文本和大模型分析，提炼问题、原始问法、回答摘要和原回答片段，沉淀可练习素材。",
            image: "assets/interview-preview-question-analysis.png"
        }
    ];

    projectPanel.classList.add("project-panel-showcase", "project-panel-interview");
    projectPanelLabel.textContent = "项目效果预览";
    projectPanelTitle.textContent = "AI coding 应用｜面试管理/复盘/伴学网站";
    projectPanelSubtitle.textContent = "围绕 JD 识别、面试条目管理、阶段推进、录音上传、AI 转写分析和求职激励的完整产品体验。";
    renderProjectTags(["AI Coding", "面试管理", "语音转写", "复盘报告", "伴学激励"]);
    setProjectPanelStatus("点击预览即可快速浏览核心功能链路；在线网站按钮已接入 https://1122345349.top/。");
    projectPanelTeaser.textContent = "该项目把求职面试过程拆成可记录、可复盘、可激励的工作流，帮助用户从 JD 输入到面试复盘形成闭环。";
    renderProjectHighlights([
        "JD 自动识别：从招聘截图或 JD 文本中抽取公司、岗位和岗位描述。",
        "流程管理：集中展示全部面试条目，并支持添加阶段、跟踪进度和记录反馈。",
        "AI 复盘：上传录音后生成转写、问题梳理、综合评分与复盘建议。",
        "伴学激励：在关键节点提供通过反馈和 Offer 庆祝，补足求职过程里的情绪价值。"
    ]);
    projectPanelResultsTitle.textContent = "产品效果";
    projectPanelResultsMeta.textContent = "Interview Review Preview";
    projectPanelResults.innerHTML = `
        <div class="interview-preview-doc">
            <nav class="interview-preview-nav" aria-label="面试项目效果预览目录">
                ${items.map((item) => `<a href="#${escapeHtml(item.anchor)}">${escapeHtml(item.index)} ${escapeHtml(item.title)}</a>`).join("")}
            </nav>
            <div class="interview-preview-flowline">
                <span>JD 录入</span>
                <span>面试日历</span>
                <span>流程管理</span>
                <span>录音上传</span>
                <span>AI 复盘</span>
                <span>激励反馈</span>
            </div>
            ${items.map(renderInterviewPreviewCard).join("")}
        </div>
    `;
}

function renderFinanceOcrPreview() {
    if (!projectPanelResults) {
        return;
    }

    projectPanel.classList.remove("project-panel-interview");
    projectPanel.classList.add("project-panel-showcase", "project-panel-finance");
    projectPanelLabel.textContent = "项目效果预览";
    projectPanelTitle.textContent = "财务票据批量 OCR 识别工具｜AI 工具产品设计与开发";
    projectPanelSubtitle.textContent = "围绕票据批量上传、自定义字段、AI 识别、表格校对和 Excel 导出的完整工作台体验。";
    renderProjectTags(["OCR", "VLM", "批量识别", "字段模板", "Excel 导出"]);
    setProjectPanelStatus("点击“打开在线网站”可进入 http://ocr.1122345349.top。");
    projectPanelTeaser.textContent = "该工具面向财务票据批量录入场景，把 PDF / PNG / JPG 上传、字段配置、模型识别、结果预览和下载整合到一个轻量工作台里。";
    renderProjectHighlights([
        "上传发票文件：支持 PDF、PNG、JPG 批量上传，并展示已选文件列表。",
        "选择识别字段：支持默认字段、手动添加字段和保存为模板。",
        "预览与下载：识别结果以表格形式展示，支持校对后导出 Excel。",
        "API 状态可见：展示 qwen-vl-max-latest 就绪状态，便于确认识别链路可用。"
    ]);
    projectPanelResultsTitle.textContent = "产品效果";
    projectPanelResultsMeta.textContent = "Finance OCR Preview";
    projectPanelResults.innerHTML = `
        <div class="finance-ocr-preview">
            <header class="finance-ocr-topbar">
                <div class="finance-ocr-brand">
                    <span></span>
                    <div>
                        <h5>财务 OCR 识别助手</h5>
                        <p>批量上传发票/票据 PDF，自定义字段，导出 Excel</p>
                    </div>
                </div>
                <div class="finance-ocr-actions">
                    <em>API 已就绪 · qwen-vl-max-latest</em>
                    <button type="button">设置</button>
                </div>
            </header>

            <section class="finance-ocr-section">
                <div class="finance-ocr-section-head">
                    <span>1</span>
                    <h5>上传发票文件</h5>
                </div>
                <div class="finance-upload-zone">
                    <strong></strong>
                    <p>点击或拖拽文件到此处上传</p>
                    <small>支持批量上传 PDF / PNG / JPG，发票、收据均可</small>
                </div>
                <div class="finance-file-row">
                    <p>已选 <b>1</b> 个文件</p>
                    <button type="button">清空全部</button>
                </div>
                <div class="finance-file-item">
                    <span>PDF</span>
                    <strong>一冠县海金电器门市部825.99元.pdf</strong>
                    <em>148.3 KB</em>
                </div>
            </section>

            <section class="finance-ocr-section">
                <div class="finance-ocr-section-head">
                    <span>2</span>
                    <h5>选择识别字段</h5>
                    <small>已选 10 个</small>
                </div>
                <p class="finance-ocr-muted">已选字段（点击 × 移除，可拖入预设或自由添加）</p>
                <div class="finance-field-tags">
                    ${["发票号码", "开票日期", "购买方名称", "购买方纳税人识别号", "销售方名称", "销售方纳税人识别号", "金额", "税额", "价税合计", "货物或应税劳务名称"].map((field) => `<span>${field} ×</span>`).join("")}
                    <button type="button">+ 添加字段</button>
                </div>
                <div class="finance-ocr-cta">
                    <button type="button">开始识别（1 个文件）</button>
                </div>
            </section>

            <section class="finance-ocr-section">
                <div class="finance-ocr-section-head">
                    <span>3</span>
                    <h5>预览与下载</h5>
                    <button type="button" class="finance-download-btn">下载 Excel</button>
                </div>
                <div class="finance-result-meta">
                    <span>成功 1</span>
                    <p>提示：单元格可直接编辑，确认后下载 Excel</p>
                </div>
                <div class="finance-result-table-wrap">
                    <table class="finance-result-table">
                        <thead>
                            <tr>
                                <th>状态</th>
                                <th>文件名</th>
                                <th>发票号码</th>
                                <th>开票日期</th>
                                <th>购买方名称</th>
                                <th>购买方纳税人识别号</th>
                                <th>销售方名称</th>
                                <th>金额</th>
                                <th>价税合计</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><b>✓</b></td>
                                <td>一冠县海金电器门市部825.99元.pdf</td>
                                <td>2637200001076210086</td>
                                <td>2026-03-11</td>
                                <td>江苏佑星建设有限公司</td>
                                <td>91320913MA1Y02TXXR</td>
                                <td>冠县海金电器门市部</td>
                                <td>730.97</td>
                                <td>825.99</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    `;
}

function setProjectPanelStatus(message = "") {
    if (!projectPanelStatus) {
        return;
    }

    if (!message) {
        projectPanelStatus.hidden = true;
        projectPanelStatus.textContent = "";
        return;
    }

    projectPanelStatus.hidden = false;
    projectPanelStatus.textContent = message;
}

function renderProjectLoading(actionLabel) {
    projectPanel.classList.remove("project-panel-showcase", "project-panel-interview", "project-panel-finance");
    projectPanelLabel.textContent = actionLabel;
    projectPanelTitle.textContent = "正在读取项目资料";
    projectPanelSubtitle.textContent = "我正在从后端服务和 IMA 公共知识库拉取项目详情。";
    renderProjectTags(["Loading"]);
    setProjectPanelStatus("");
    projectPanelTeaser.textContent = "请稍等，项目摘要正在加载。";
    renderProjectHighlights(["正在整理项目关键点...", "正在请求知识库相关资料..."]);
    projectPanelResultsTitle.textContent = "资料返回中";
    projectPanelResultsMeta.textContent = "IMA Backend";
    renderProjectResults([], "正在请求公开知识库，请稍等片刻。");
}

function renderProjectError(message) {
    projectPanel.classList.remove("project-panel-showcase", "project-panel-interview", "project-panel-finance");
    projectPanelLabel.textContent = "连接异常";
    projectPanelTitle.textContent = "项目资料暂时没取到";
    projectPanelSubtitle.textContent = "按钮已经接上后端了，但当前接口没有成功返回。";
    renderProjectTags(["IMA Backend", "Need Server"]);
    setProjectPanelStatus("如果你是在本地打开网页，请先在 backend 目录运行 npm run dev；如果后端已启动，再刷新页面试一次。");
    projectPanelTeaser.textContent = message;
    renderProjectHighlights([
        "前端按钮会调用 /api/public/project/:slug 和 /api/public/search。",
        "本地 file 页面默认请求 http://127.0.0.1:3218。",
        "后端没启动、端口被占用或接口报错时，会看到这个提示。"
    ]);
    projectPanelResultsTitle.textContent = "排查建议";
    projectPanelResultsMeta.textContent = "Local Debug";
    renderProjectResults([], "建议先确认后端服务是否已经启动，再重新点击项目按钮。");
}

async function apiRequest(path, options = {}) {
    const response = await fetch(`${apiBase}${path}`, {
        credentials: "include",
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    let payload = {};

    try {
        payload = await response.json();
    } catch {
        payload = {};
    }

    if (!response.ok) {
        throw new Error(payload.message || "后端接口调用失败");
    }

    return payload;
}

function formatDate(timestamp) {
    if (!timestamp) {
        return "未知时间";
    }

    return new Date(timestamp).toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function setNotesAdminStatus(message) {
    if (notesAdminStatus) {
        notesAdminStatus.textContent = message;
    }
}

function renderNotesList(items = []) {
    if (!notesList) {
        return;
    }

    if (!items.length) {
        notesList.innerHTML = `<div class="notes-empty">没有找到匹配的笔记。你可以换个关键词，或者登录后新建一篇。</div>`;
        return;
    }

    notesList.innerHTML = items
        .map((item) => {
            const activeClass = item.docId === notesState.activeDocId ? " is-active" : "";
            const cover = safeExternalUrl(item.coverImage);
            return `
                <button class="notes-item${activeClass}" type="button" data-note-id="${escapeHtml(item.docId)}">
                    ${cover ? `<img class="notes-item-cover" src="${escapeHtml(cover)}" alt="${escapeHtml(item.title)} 封面" loading="lazy">` : ""}
                    <strong>${escapeHtml(item.title)}</strong>
                    <span>${escapeHtml(item.summary || "这篇笔记暂时还没有摘要。")}</span>
                    <em>${escapeHtml(formatDate(item.modifyTime))}</em>
                </button>
            `;
        })
        .join("");

    [...notesList.querySelectorAll("[data-note-id]")].forEach((button) => {
        button.addEventListener("click", () => {
            const docId = button.dataset.noteId;
            loadNoteContent(docId);
        });
    });
}

function renderNoteLoading() {
    if (notesReaderTitle) {
        notesReaderTitle.textContent = "正在读取笔记正文";
    }
    if (notesReaderSummary) {
        notesReaderSummary.textContent = "我正在从 IMA 拉取这篇笔记的正文内容。";
    }
    if (notesReaderContent) {
        notesReaderContent.innerHTML = `<p class="notes-muted">加载中...</p>`;
    }
}

function renderNoteContent(note, content, contentFormat = "text") {
    notesState.activeDocId = note.docId;
    if (notesReaderLabel) {
        notesReaderLabel.textContent = contentFormat === "json" ? "IMA Rich Note" : "IMA Note";
    }
    if (notesReaderTitle) {
        notesReaderTitle.textContent = note.title;
    }
    if (notesReaderMeta) {
        notesReaderMeta.textContent = `最后更新 ${formatDate(note.modifyTime)}`;
    }
    if (notesReaderSummary) {
        notesReaderSummary.textContent = note.summary || "这篇笔记暂无摘要。";
    }
    if (notesReaderContent) {
        notesReaderContent.innerHTML = renderNoteBody(content, contentFormat);
    }
}

function renderNoteError(message) {
    if (notesReaderLabel) {
        notesReaderLabel.textContent = "读取失败";
    }
    if (notesReaderTitle) {
        notesReaderTitle.textContent = "暂时没拿到这篇笔记";
    }
    if (notesReaderMeta) {
        notesReaderMeta.textContent = "IMA Notes";
    }
    if (notesReaderSummary) {
        notesReaderSummary.textContent = message;
    }
    if (notesReaderContent) {
        notesReaderContent.innerHTML = `<p class="notes-muted">请确认后端是否运行，或稍后重新点击这篇笔记。</p>`;
    }
}

function renderKnowledgeBaseItems(items = []) {
    if (!notesKbItems) {
        return;
    }

    if (!items.length) {
        notesKbItems.innerHTML = `<div class="notes-empty">知识库里暂时没有可展示的公开资料。</div>`;
        return;
    }

    notesKbItems.innerHTML = items
        .map((item) => {
            const type = getKnowledgeType(item);

            return `
                <article class="notes-kb-item">
                    <div class="knowledge-card-meta">
                        <span>${escapeHtml(type)}</span>
                        ${item.mediaId ? `<small>${escapeHtml(item.mediaId.slice(0, 8))}</small>` : ""}
                    </div>
                    <h4>${escapeHtml(item.title || "未命名资料")}</h4>
                    <div class="knowledge-card-body">
                        ${renderKnowledgeSnippet(item.snippet, "IMA 浏览接口只返回了标题；我会在搜索命中后展示更完整的摘要。", item)}
                    </div>
                </article>
            `;
        })
        .join("");
}

function updateAdminUi() {
    if (!notesLoginToggle || !notesLoginForm || !notesComposeForm) {
        return;
    }

    if (notesState.authenticated) {
        notesLoginToggle.textContent = "管理模式已开启";
        notesLoginForm.hidden = true;
        notesComposeForm.hidden = false;
        setNotesAdminStatus("你已经进入管理模式。现在可以在这里写内容，并同步成 IMA 笔记；勾选后也会一起加入公开知识库。");
    } else {
        notesLoginToggle.textContent = "进入管理模式";
        notesComposeForm.hidden = true;
        if (notesLoginForm.hidden) {
            setNotesAdminStatus("当前是公开阅读模式。只有我自己登录后，才能在这里新建并同步 IMA 笔记。");
        }
    }
}

async function fetchNotes(query = "") {
    const search = new URLSearchParams();
    if (query) {
        search.set("query", query);
    }
    search.set("limit", "8");

    const result = await apiRequest(`/api/public/notes?${search.toString()}`);
    return result;
}

async function loadNotes(query = "", preferredDocId = "") {
    notesState.activeQuery = query;
    if (notesList) {
        notesList.innerHTML = `<div class="notes-empty">正在加载笔记列表...</div>`;
    }

    try {
        const result = await fetchNotes(query);
        const items = result.items || [];
        notesState.items = items;
        notesState.cursor = result.cursor || "";
        const firstDocId = preferredDocId || notesState.activeDocId || items[0]?.docId || "";
        renderNotesList(items);

        if (firstDocId) {
            const firstNote = items.find((item) => item.docId === firstDocId) || items[0];
            if (firstNote) {
                await loadNoteContent(firstNote.docId, firstNote);
            }
        } else {
            renderNoteError("还没有可展示的笔记内容。");
        }
    } catch (error) {
        if (notesList) {
            notesList.innerHTML = `<div class="notes-empty">笔记列表加载失败：${escapeHtml(error.message || "请确认后端服务是否已启动")}</div>`;
        }
        renderNoteError("笔记列表加载失败，请确认本地后端服务正在运行。");
    }
}

async function loadNoteContent(docId, noteMeta = null) {
    if (!docId) {
        return;
    }

    notesState.activeDocId = docId;
    const currentMeta = noteMeta || notesState.items.find((item) => item.docId === docId) || {
        docId,
        title: "正在加载",
        summary: "",
        modifyTime: Date.now(),
    };
    renderNotesList(notesState.items);
    renderNoteLoading();

    try {
        const detail = await apiRequest(`/api/public/notes/${docId}`);
        renderNoteContent(currentMeta, detail.content || "", detail.contentFormat || "text");
        renderNotesList(notesState.items);
    } catch (error) {
        renderNoteError(error.message || "读取笔记正文失败");
    }
}

async function loadKnowledgeBasePreview() {
    if (notesKbMeta) {
        notesKbMeta.textContent = "加载中...";
    }

    try {
        const kb = await apiRequest("/api/public/kb");
        const browse = await fetchProjectSearch("");
        if (notesKbMeta) {
            notesKbMeta.textContent = `${kb.name} · ${kb.contentCount} 条内容`;
        }
        renderKnowledgeBaseItems((browse.items || []).slice(0, 4));
    } catch (error) {
        if (notesKbMeta) {
            notesKbMeta.textContent = "读取失败";
        }
        renderKnowledgeBaseItems([]);
    }
}

async function checkAdminSession() {
    try {
        const result = await apiRequest("/api/admin/me");
        notesState.authenticated = Boolean(result.authenticated);
    } catch {
        notesState.authenticated = false;
    }

    updateAdminUi();
}

async function handleAdminLogin(event) {
    event.preventDefault();

    const username = notesAdminUsername?.value?.trim() || "";
    const password = notesAdminPassword?.value || "";

    if (!username || !password) {
        setNotesAdminStatus("请输入管理员用户名和密码。");
        return;
    }

    setNotesAdminStatus("正在验证管理员身份...");

    try {
        await apiRequest("/api/admin/login", {
            method: "POST",
            body: JSON.stringify({ username, password }),
        });
        notesState.authenticated = true;
        notesAdminPassword.value = "";
        updateAdminUi();
    } catch (error) {
        notesState.authenticated = false;
        updateAdminUi();
        notesLoginForm.hidden = false;
        setNotesAdminStatus(error.message || "登录失败，请检查用户名和密码。");
    }
}

async function handleAdminLogout() {
    try {
        await apiRequest("/api/admin/logout", {
            method: "POST",
            body: JSON.stringify({}),
        });
    } catch {
        // Ignore logout errors and reset UI anyway.
    }

    notesState.authenticated = false;
    if (notesComposeForm) {
        notesComposeForm.hidden = true;
    }
    if (notesLoginForm) {
        notesLoginForm.hidden = true;
    }
    updateAdminUi();
}

async function handleNoteCreate(event) {
    event.preventDefault();

    const title = notesComposeTitle?.value?.trim() || "";
    const content = notesComposeContent?.value?.trim() || "";
    const syncToKnowledgeBase = Boolean(notesSyncCheckbox?.checked);

    if (!title || !content) {
        setNotesAdminStatus("标题和正文都不能为空。");
        return;
    }

    if (notesSyncBtn) {
        notesSyncBtn.disabled = true;
        notesSyncBtn.textContent = "同步中...";
    }

    setNotesAdminStatus("正在把这篇内容同步到 IMA...");

    try {
        const result = await apiRequest("/api/admin/notes/create", {
            method: "POST",
            body: JSON.stringify({
                title,
                content,
                syncToKnowledgeBase,
            }),
        });

        notesComposeTitle.value = "";
        notesComposeContent.value = "";
        setNotesAdminStatus(result.syncResult ? "同步成功：已经创建 IMA 笔记，并加入公开知识库。" : "同步成功：已经创建 IMA 笔记。");
        await loadNotes("", result.docId);
        await loadKnowledgeBasePreview();
    } catch (error) {
        setNotesAdminStatus(error.message || "同步失败，请稍后再试。");
    } finally {
        if (notesSyncBtn) {
            notesSyncBtn.disabled = false;
            notesSyncBtn.textContent = "同步到 IMA";
        }
    }
}

async function fetchProjectDetail(slug) {
    return apiRequest(`/api/public/project/${slug}`);
}

async function fetchProjectSearch(query) {
    return apiRequest("/api/public/search", {
        method: "POST",
        body: JSON.stringify({ query }),
    });
}

async function handleProjectAction(button) {
    const slug = button.dataset.projectSlug;
    const action = button.dataset.projectAction;
    const externalUrl = safeExternalUrl(button.dataset.externalUrl || button.getAttribute("href"));

    if (!slug || !action) {
        return;
    }

    if (action === "secondary" && externalUrl) {
        window.location.href = externalUrl;
        return;
    }

    activeProjectButton = button;
    openProjectPanel();

    if (slug === "jingyin-agent" && action === "preview") {
        renderJingyinPreview();
        return;
    }

    if (slug === "jingyin-agent" && action === "secondary") {
        renderJingyinWorkflow();
        return;
    }

    if (slug === "ai-interview-review" && action === "preview") {
        renderInterviewPreview();
        return;
    }

    if (slug === "finance-ocr-tool" && action === "preview") {
        renderFinanceOcrPreview();
        return;
    }

    renderProjectLoading(button.textContent.trim());
    setProjectButtonLoading(button, true, "读取中...");

    try {
        const detail = await fetchProjectDetail(slug);
        const label = getActionText(action, detail);
        let statusMessage = "";
        let resultItems = detail.knowledgePreview || [];
        let resultMeta = detail.knowledgeBaseId ? "IMA Public KB" : "Project Data";
        let resultsTitle = "相关资料";
        let emptyText = "当前公开知识库里还没有搜到和这个项目相关的资料。";

        if (action === "secondary") {
            if (detail.cta?.secondaryMode === "search") {
                const searchResult = await fetchProjectSearch(detail.searchQuery || detail.title || "");
                resultItems = searchResult.items || [];
                resultsTitle = "工作流相关资料";
                resultMeta = "Workflow Search";
                statusMessage = detail.secondaryHint || "这里优先展示和项目工作流有关的知识库资料。";
                emptyText = "知识库里暂时还没有命中工作流资料，后续你把文档补进 IMA 后这里会自动接上。";
            } else if (detail.cta?.secondaryMode === "website") {
                if (detail.externalUrl) {
                    window.open(detail.externalUrl, "_blank", "noopener,noreferrer");
                    statusMessage = "已为你打开在线网站，同时这里保留项目资料面板，方便继续查看结构化信息。";
                } else {
                    const searchResult = await fetchProjectSearch(detail.searchQuery || detail.title || "");
                    resultItems = searchResult.items || [];
                    statusMessage = detail.secondaryHint || "在线网站链接后续补充；当前先展示项目详情和知识库资料。";
                    resultsTitle = "在线网站相关资料";
                    resultMeta = "Website Pending";
                    emptyText = "在线网站链接还没补上，当前先展示这个项目在知识库里的公开资料。";
                }
            }
        } else if (!resultItems.length && detail.searchQuery) {
            const searchResult = await fetchProjectSearch(detail.searchQuery);
            resultItems = searchResult.items || [];
            resultMeta = "Project Search";
        }

        projectPanelLabel.textContent = label;
        projectPanelTitle.textContent = `${detail.title}｜${detail.subtitle}`;
        projectPanelSubtitle.textContent = `${detail.period} · 来自后端聚合的项目结构化信息`;
        renderProjectTags(detail.tags || []);
        setProjectPanelStatus(statusMessage);
        projectPanelTeaser.textContent = detail.teaser || "暂无项目摘要。";
        renderProjectHighlights(detail.highlights || []);
        projectPanelResultsTitle.textContent = resultsTitle;
        projectPanelResultsMeta.textContent = resultMeta;
        renderProjectResults(resultItems, emptyText);
    } catch (error) {
        renderProjectError(error.message || "读取项目资料失败");
    } finally {
        setProjectButtonLoading(button, false);
    }
}

projectActionButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
        event.preventDefault();
        handleProjectAction(button);
    });
});

projectPanelCloseTargets.forEach((target) => {
    target.addEventListener("click", closeProjectPanel);
});

if (notesSearchBtn) {
    notesSearchBtn.addEventListener("click", () => {
        loadNotes(notesSearchInput?.value?.trim() || "");
    });
}

if (notesSearchInput) {
    notesSearchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            loadNotes(notesSearchInput.value.trim());
        }
    });
}

if (notesRefreshBtn) {
    notesRefreshBtn.addEventListener("click", () => {
        if (notesSearchInput) {
            notesSearchInput.value = "";
        }
        loadNotes("");
        loadKnowledgeBasePreview();
    });
}

if (notesLoginToggle) {
    notesLoginToggle.addEventListener("click", () => {
        if (notesState.authenticated) {
            notesComposeForm.hidden = false;
            setNotesAdminStatus("管理模式已开启，你可以直接写内容并同步。");
            return;
        }

        notesLoginForm.hidden = !notesLoginForm.hidden;
        setNotesAdminStatus(notesLoginForm.hidden ? "当前是公开阅读模式。只有我自己登录后，才能在这里新建并同步 IMA 笔记。" : "请输入管理员账号，进入可写模式。");
    });
}

if (notesCancelLoginBtn) {
    notesCancelLoginBtn.addEventListener("click", () => {
        notesLoginForm.hidden = true;
        setNotesAdminStatus("已取消登录。当前仍是公开阅读模式。");
    });
}

if (notesLoginForm) {
    notesLoginForm.addEventListener("submit", handleAdminLogin);
}

if (notesComposeForm) {
    notesComposeForm.addEventListener("submit", handleNoteCreate);
}

if (notesLogoutBtn) {
    notesLogoutBtn.addEventListener("click", handleAdminLogout);
}

if (notesList) {
    loadNotes("");
    loadKnowledgeBasePreview();
    checkAdminSession();
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeProjectPanel();
        if (activeProjectButton) {
            activeProjectButton.focus();
        }
    }
});
