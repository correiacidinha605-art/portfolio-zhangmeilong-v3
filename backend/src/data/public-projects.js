module.exports = {
    "jingyin-agent": {
        slug: "jingyin-agent",
        title: "京音 SCRM Agent 应用",
        subtitle: "微电业务营销话术挖掘",
        period: "2026.03 - 2026.04",
        teaser: "把优秀营销话术从录音和企微聊天里挖出来，沉淀成可复用的知识资产与下游 Agent 能力。",
        tags: ["Agent", "知识挖掘", "话术标注", "JoyContext"],
        cta: {
            previewLabel: "项目效果预览",
            secondaryLabel: "查看工作流",
            secondaryMode: "search"
        },
        externalUrl: "",
        secondaryHint: "当前会优先展示知识库里和工作流相关的公开资料。",
        searchQuery: "京音 SCRM Agent 话术 知识库",
        highlights: [
            "面向通话录音与企微聊天记录，解决优质话术长期未结构化沉淀的问题。",
            "打通知识挖掘、阶段识别、高光抽取、标签推荐与综合评分链路。",
            "结果沉淀进 JoyContext 知识库，服务电销、企微、质培等多个 Agent 场景。"
        ]
    },
    "ai-interview-review": {
        slug: "ai-interview-review",
        title: "AI coding 应用",
        subtitle: "面试管理/复盘/伴学网站",
        period: "2026.04 - 至今",
        teaser: "围绕面试季流程难管理、录音复盘低效和求职过程缺少正反馈的问题，搭建集面试流程管控、语音转写 AI 分析与萌宠治愈伴学于一体的一站式面试辅助平台。",
        tags: ["AI Coding", "面试管理", "语音转写", "猫咪伴学"],
        cta: {
            previewLabel: "项目效果预览",
            secondaryLabel: "打开在线网站",
            secondaryMode: "website"
        },
        externalUrl: "https://1122345349.top/",
        secondaryHint: "已接入在线网站，点击按钮可直接打开部署后的项目页面。",
        searchQuery: "AI 面试管理 复盘 伴学 Paraformer DeepSeek Next.js",
        highlights: [
            "将用户链路拆解为 JD 智能识别、岗位管理、面试阶段跟踪、录音上传、语音转写、AI 分析、复盘报告输出与历史记录归档。",
            "接入阿里云 Paraformer-V2 和 DeepSeek-V3.2，自动完成问题提取、回答分析、追问整理与复盘报告生成。",
            "设计 8 维评分、风险识别、关键问题复盘、回答优化建议等模块，并通过结构化 Prompt 与 JSON Schema 校验提升输出稳定性。",
            "加入猫咪伴学元素，设计面试通过庆祝、面试失利鼓励等页面，为求职者提供情绪价值和持续陪伴。"
        ]
    },
    "finance-ocr-tool": {
        slug: "finance-ocr-tool",
        title: "财务票据批量 OCR 识别工具",
        subtitle: "AI 工具产品设计与开发",
        period: "2026.04 - 2026.04",
        teaser: "面向财务票据批量录入场景，把多格式上传、自定义字段、批量识别、行内校对和 Excel 导出整合成一款可本地部署的桌面工具。",
        tags: ["AI 工具", "OCR", "桌面应用", "多模态大模型"],
        cta: {
            previewLabel: "项目效果预览",
            secondaryLabel: "打开在线网站",
            secondaryMode: "website"
        },
        externalUrl: "http://ocr.1122345349.top",
        secondaryHint: "已接入在线网站，点击按钮可直接打开财务 OCR 识别助手。",
        searchQuery: "财务票据 OCR React FastAPI Qwen-VL-Max PyInstaller",
        highlights: [
            "针对发票、收据、报销凭证录入效率低和字段需求差异大的问题，独立完成从 0 到 1 设计与开发。",
            "设计拖拽上传、自定义字段、批量识别、行内校对与 Excel 导出的完整产品流程。",
            "接入 Qwen-VL-Max 多模态大模型，并通过异步并发、流式进度、限流重试和超时处理提升批量识别稳定性。",
            "通过 PyInstaller 打包为 Windows 单文件 EXE，实现零依赖部署；实测 10 份票据约 30-60 秒完成识别。"
        ]
    }
};
