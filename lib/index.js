"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = exports.usage = exports.name = void 0;
exports.apply = apply;
const koishi_1 = require("koishi");
const element = __importStar(require("@satorijs/element"));
const { jsx } = element;
exports.name = 'loliy-novelai';
exports.usage = `
<h1>NovelAI绘画第三方平台</h1>

<p>支持两个API平台：</p>
<ul>
<li>Loliy API: <a href="https://www.loliy.top/" target="_blank">https://www.loliy.top/</a></li>
<li>Hua API: <a href="https://hua.shigure.top/" target="_blank">https://hua.shigure.top/</a></li>
</ul>

<hr>

<div class="notice">
<h3>注意事项</h3>
<p>1. Loliy API 支持所有尺寸，包括标准尺寸、大图尺寸和壁纸尺寸</p>
<p>2. Hua API 仅支持标准尺寸</p>
<p>3. 价格说明：1点数1张图（默认尺寸）</p>
</div>
`;
// 定义可用的模型
const AVAILABLE_MODELS = {
    'nai-diffusion-4-full': 'NAI Diffusion V4 完整版',
    'nai-diffusion-4-curated-preview': 'NAI Diffusion V4 先行版',
    'nai-diffusion-4-5-curated': 'NAI Diffusion V4.5 先行版',
    'nai-diffusion-3': 'NAI Diffusion Anime V3',
    'nai-diffusion-furry-3': 'NAI Diffusion Furry V3'
};
// 添加模型映射
const MODEL_MAP = {
    'NAI Diffusion V4 完整版': 'nai-diffusion-4-full',
    'NAI Diffusion V4 先行版': 'nai-diffusion-4-curated-preview',
    'NAI Diffusion V4.5 先行版': 'nai-diffusion-4-5-curated',
    'NAI Diffusion Anime V3': 'nai-diffusion-3',
    'NAI Diffusion Furry V3': 'nai-diffusion-furry-3'
};
// 定义采样器选项 - 按模型分组
const SAMPLERS = {
    v4: [
        'k_euler_ancestral', // 默认
        'k_euler',
        'k_dpmpp_2s_ancestral',
        'k_dpmpp_2m_sde',
        'k_dpmpp_2m',
        'k_dpmpp_sde'
    ],
    v3: [
        'k_euler_ancestral', // 默认
        'k_euler',
        'k_dpmpp_2s_ancestral',
        'k_dpmpp_2m_sde',
        'k_dpmpp_2m',
        'k_dpmpp_sde',
        'ddim_v3'
    ]
};
// 定义噪声调度选项 - 按模型分组
const NOISE_SCHEDULES = {
    v4: [
        'karras', // 默认
        'exponential',
        'polyexponential'
    ],
    v3: [
        'karras', // 默认
        'native',
        'exponential',
        'polyexponential'
    ]
};
// 定义发送内容模式
const CONTENT_MODES = [
    '仅图片',
    '详细模式'
];
// 定义尺寸配置和描述
const SIZES = {
    normal: {
        vertical: '832x1216',
        horizontal: '1216x832',
        square: '1024x1024',
        description: '标准尺寸'
    },
    large: {
        vertical: '1024x1536',
        horizontal: '1536x1024',
        square: '1472x1472',
        description: '大图尺寸'
    },
    wallpaper: {
        vertical: '1088x1920',
        horizontal: '1920x1088',
        description: '壁纸尺寸'
    },
    small: {
        vertical: '512x768',
        horizontal: '768x512',
        square: '640x640',
        description: '小图尺寸'
    }
};
// 尺寸类别映射
const SIZE_CATEGORY_MAP = {
    '标准尺寸': 'normal',
    '大图尺寸': 'large',
    '壁纸尺寸': 'wallpaper',
    '小图尺寸': 'small'
};
// 方向映射
const ORIENTATION_MAP = {
    '竖图': 'vertical',
    '横图': 'horizontal',
    '方图': 'square'
};
// 默认负面提示词
const DEFAULT_NEGATIVE_PROMPT = 'lowres, {bad}, error, fewer, extra, missing, worst quality, jpeg artifacts, bad quality, watermark, unfinished, displeasing, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]';
// 判断模型是否为V4
function isV4Model(model) {
    return model.includes('nai-diffusion-4');
}
// 添加检测画师标签的函数
function hasArtistTag(prompt) {
    const artistPatterns = [
        'artist:',
        'artist ',
        '{artist',
        '[artist',
        '【artist',
        // 添加大写版本
        'ARTIST:',
        'ARTIST ',
        '{ARTIST',
        '[ARTIST',
        '【ARTIST',
        // 添加首字母大写版本
        'Artist:',
        'Artist ',
        '{Artist',
        '[Artist',
        '【Artist',
    ];
    // 直接检查是否包含任何一种格式,不转换大小写
    return artistPatterns.some(pattern => prompt.includes(pattern));
}
// 改进方向关键词检测
function extractOrientation(text) {
    let orientation = '竖图';
    let processedText = text;
    // 检查完整词 - 使用更严格的匹配
    if (processedText.match(/(?:^|\s)(横图)(?:\s|$)/)) {
        orientation = '横图';
        processedText = processedText.replace(/(?:^|\s)横图(?:\s|$)/, ' ').trim();
    }
    else if (processedText.match(/(?:^|\s)(方图)(?:\s|$)/)) {
        orientation = '方图';
        processedText = processedText.replace(/(?:^|\s)方图(?:\s|$)/, ' ').trim();
    }
    else if (processedText.match(/(?:^|\s)(竖图)(?:\s|$)/)) {
        orientation = '竖图';
        processedText = processedText.replace(/(?:^|\s)竖图(?:\s|$)/, ' ').trim();
    }
    // 检查简短形式
    else if (processedText.match(/(?:^|\s)(横)(?:\s|$)/)) {
        orientation = '横图';
        processedText = processedText.replace(/(?:^|\s)横(?:\s|$)/, ' ').trim();
    }
    else if (processedText.match(/(?:^|\s)(方)(?:\s|$)/)) {
        orientation = '方图';
        processedText = processedText.replace(/(?:^|\s)方(?:\s|$)/, ' ').trim();
    }
    else if (processedText.match(/(?:^|\s)(竖)(?:\s|$)/)) {
        orientation = '竖图';
        processedText = processedText.replace(/(?:^|\s)竖(?:\s|$)/, ' ').trim();
    }
    return { orientation, processedText };
}
// 改进提示词处理函数
function cleanPrompt(prompt) {
    // 删除反斜杠
    let cleanedPrompt = prompt.replace(/\\/g, '');
    // 删除 LoRA 标签 <lora:任何内容:任何数值>
    cleanedPrompt = cleanedPrompt.replace(/<lora:[^:]+:[^>]+>/g, '');
    // 确保逗号后面有空格，前面没有空格
    cleanedPrompt = cleanedPrompt.replace(/\s*,\s*/g, ', ');
    // 清理多余的逗号（连续的逗号或逗号后面跟空格再跟逗号）
    cleanedPrompt = cleanedPrompt.replace(/,\s*,+/g, ',');
    // 清理末尾的逗号和空格
    cleanedPrompt = cleanedPrompt.replace(/,\s*$/, '');
    // 删除多余的空格
    cleanedPrompt = cleanedPrompt.replace(/\s+/g, ' ').trim();
    // 确保最后有一个逗号和空格
    if (!cleanedPrompt.endsWith(',')) {
        cleanedPrompt += ', ';
    }
    return cleanedPrompt;
}
// 修改formatPromptEnding函数，添加调试日志
function formatPromptEnding(prompt) {
    // 先清理末尾的空白字符
    let cleaned = prompt.trim();
    // 记录原始输入
    const original = cleaned;
    // 替换中文逗号、句号、顿号等为英文逗号+空格
    if (cleaned.endsWith('，') || cleaned.endsWith('。') ||
        cleaned.endsWith('、') || cleaned.endsWith('；')) {
        cleaned = cleaned.slice(0, -1) + ', ';
    }
    // 如果已经以英文逗号+空格结尾，保持不变
    else if (cleaned.endsWith(', ')) {
        // 无需修改
    }
    // 如果以英文逗号结尾但没有空格，添加空格
    else if (cleaned.endsWith(',')) {
        cleaned = cleaned + ' ';
    }
    // 处理以其他英文标点结尾的情况 - 将它们替换为逗号+空格
    else if (cleaned.endsWith('.') || cleaned.endsWith(';') ||
        cleaned.endsWith(':') || cleaned.endsWith('!') ||
        cleaned.endsWith('?')) {
        cleaned = cleaned.slice(0, -1) + ', ';
    }
    // 如果没有标点结尾，添加逗号+空格
    else {
        cleaned = cleaned + ', ';
    }
    // 注释掉formatPromptEnding函数中的日志
    // if (original !== cleaned) {
    //   ctx.logger('loliy-novelai').debug(`formatPromptEnding | 原文: "${original}" | 处理后: "${cleaned}"`);
    // }
    return cleaned;
}
exports.Config = koishi_1.Schema.intersect([
    koishi_1.Schema.object({
        apiType: koishi_1.Schema.union(['loliy', 'hua'])
            .default('loliy')
            .description('选择使用的 API (loliy 或 hua，注意：hua仅支持标准尺寸)'),
        apiKeys: koishi_1.Schema.array(String)
            .default([])
            .description('Loliy API密钥列表 (可添加多个Key同时处理多张图片)')
            .role('table'),
        huaAuthKeys: koishi_1.Schema.array(String)
            .default([])
            .description('Hua API授权密钥列表')
            .role('table'),
        huaNaiKeys: koishi_1.Schema.array(String)
            .default([])
            .description('Hua API官方密钥列表 (可选)')
            .role('table'),
        useHuaCache: koishi_1.Schema.boolean()
            .default(false)
            .description('是否使用Hua API的服务器缓存 (默认关闭=不使用缓存，开启=使用缓存)')
            .role('switch'),
        maxConcurrentThreads: koishi_1.Schema.number()
            .default(2)
            .min(1)
            .max(5)
            .step(1)
            .description('最大并发处理数量 (仅Hua API有效，Loliy API会自动使用全部可用key)'),
        defaultSizeCategory: koishi_1.Schema.union(['标准尺寸', '大图尺寸', '壁纸尺寸', '小图尺寸'])
            .default('标准尺寸')
            .description('默认尺寸类别'),
        defaultOrientation: koishi_1.Schema.union(['竖图', '横图', '方图'])
            .default('竖图')
            .description('默认图片方向'),
        model: koishi_1.Schema.union(Object.keys(MODEL_MAP))
            .default('NAI Diffusion V4 完整版')
            .description('默认使用的模型'),
        enableLargeSize: koishi_1.Schema.boolean()
            .default(false)
            .description('是否启用大图尺寸(消耗更多点数，仅Loliy API支持)')
            .role('switch'),
        enableWallpaperSize: koishi_1.Schema.boolean()
            .default(false)
            .description('是否启用壁纸尺寸(消耗更多点数，仅Loliy API支持)')
            .role('switch'),
    }).description('基础设置'),
    koishi_1.Schema.object({
        enableArtistPrompts: koishi_1.Schema.boolean()
            .default(true)
            .description('是否启用随机画师提示词')
            .role('switch'),
        artistPrompts: koishi_1.Schema.array(String)
            .default([])
            .description('画师提示词列表 (随机选择其中一个添加到提示词前面)')
            .role('table'),
        enableDefaultPrompt: koishi_1.Schema.boolean()
            .default(false)
            .description('是否启用质量提示词')
            .role('switch'),
        defaultPrompt: koishi_1.Schema.string()
            .default('best quality, very aesthetic, absurdres')
            .description('质量提示词(会添加到用户输入的后面)')
            .role('textarea'),
        negativePrompt: koishi_1.Schema.string()
            .default(DEFAULT_NEGATIVE_PROMPT)
            .description('默认负面提示词')
            .role('textarea'),
        sampler: koishi_1.Schema.union([
            ...SAMPLERS.v4,
            ...SAMPLERS.v3.filter(s => !SAMPLERS.v4.includes(s))
        ])
            .default('k_euler_ancestral')
            .description('采样器 (根据模型自动调整可用选项)'),
        cfgScale: koishi_1.Schema.number()
            .default(5.0)
            .min(1.0)
            .max(10.0)
            .step(0.1)
            .description('提示词相关性 (1.0-10.0)'),
        steps: koishi_1.Schema.number()
            .default(23)
            .min(1)
            .max(50)
            .step(1)
            .description('生成步数 (01-50)'),
        noiseSchedule: koishi_1.Schema.union([
            ...NOISE_SCHEDULES.v4,
            ...NOISE_SCHEDULES.v3.filter(n => !NOISE_SCHEDULES.v4.includes(n))
        ])
            .default('karras')
            .description('噪声调度 (根据模型自动调整可用选项)')
    }).description('高级设置'),
    koishi_1.Schema.object({
        useForwardMessage: koishi_1.Schema.boolean()
            .default(false)
            .description('使用合并转发发送图片')
            .role('switch'),
        autoRecall: koishi_1.Schema.boolean()
            .default(false)
            .description('自动撤回生成的图片')
            .role('switch'),
        recallDelay: koishi_1.Schema.number()
            .default(50)
            .min(10)
            .max(120)
            .step(1)
            .description('自动撤回延迟时间(秒)'),
        autoRecallPrompt: koishi_1.Schema.boolean()
            .default(false)
            .description('自动撤回提示消息（生成中、翻译等提示）')
            .role('switch'),
        promptRecallDelay: koishi_1.Schema.number()
            .default(10)
            .min(5)
            .max(60)
            .step(1)
            .description('提示消息撤回延迟时间(秒)'),
        contentMode: koishi_1.Schema.union(CONTENT_MODES)
            .default('仅图片')
            .description('发送内容模式'),
        enableTranslation: koishi_1.Schema.boolean()
            .default(false)
            .description('是否启用提示词自动翻译(中文→英文)')
            .role('switch'),
        showTranslationResult: koishi_1.Schema.boolean()
            .default(true)
            .description('是否显示翻译结果')
            .role('switch'),
        maxDrawCount: koishi_1.Schema.number()
            .default(1)
            .min(1)
            .max(10)
            .step(1)
            .description('单次重画命令最大生成数量(影响"重画N张"/"再来N张"命令)'),
        jrandomMin: koishi_1.Schema.number()
            .default(2)
            .min(1)
            .max(5)
            .step(1)
            .description('"几"的随机范围最小值'),
        jrandomMax: koishi_1.Schema.number()
            .default(4)
            .min(2)
            .max(10)
            .step(1)
            .description('"几"的随机范围最大值'),
        randomArtistOnRedraw: koishi_1.Schema.boolean()
            .default(true)
            .description('重画时是否随机选择画师提示词 (开启=重画时随机选择，关闭=重画时使用上一次的画师提示词)'),
    }).description('特殊功能'),
    koishi_1.Schema.object({
        maxRetries: koishi_1.Schema.number()
            .default(3)
            .description('API请求失败时的最大重试次数'),
        retryDelay: koishi_1.Schema.number()
            .default(1000)
            .description('重试之间的延迟时间(毫秒)')
    }).description('重试设置'),
    koishi_1.Schema.object({
        enableDailyLimit: koishi_1.Schema.boolean()
            .default(false)
            .description('是否启用每日绘图次数限制')
            .role('switch'),
        dailyLimit: koishi_1.Schema.number()
            .default(30)
            .min(1)
            .max(1000)
            .step(1)
            .description('每个用户每日最大绘图次数 (仅在启用每日限制时生效)'),
        whitelistUsers: koishi_1.Schema.array(String)
            .default([])
            .description('白名单用户ID列表 (这些用户不受每日限制，仅在启用每日限制时生效)')
            .role('table'),
        groupDailyLimits: koishi_1.Schema.array(koishi_1.Schema.object({
            groupId: koishi_1.Schema.string()
                .description('群组ID'),
            limit: koishi_1.Schema.number()
                .min(1)
                .max(1000)
                .step(1)
                .description('该群每个用户的每日绘图次数限制')
        }))
            .default([])
            .description('不同群组的每日绘图次数限制配置 (优先级高于全局限制)')
            .role('table')
    }).description('用户限制'),
    koishi_1.Schema.object({
        enableGroupWhitelist: koishi_1.Schema.boolean()
            .default(false)
            .description('是否启用群组白名单 (启用后只有白名单内的群可以使用)')
            .role('switch'),
        groupWhitelist: koishi_1.Schema.array(String)
            .default([])
            .description('群组白名单列表 (仅在启用群组白名单时生效)')
            .role('table'),
        enableGroupBlacklist: koishi_1.Schema.boolean()
            .default(false)
            .description('是否启用群组黑名单 (启用后黑名单内的群无法使用)')
            .role('switch'),
        groupBlacklist: koishi_1.Schema.array(String)
            .default([])
            .description('群组黑名单列表 (仅在启用群组黑名单时生效)')
            .role('table'),
        showRestrictionMessage: koishi_1.Schema.boolean()
            .default(true)
            .description('是否显示群组限制提示消息 (关闭后将不会回复任何限制提示)')
            .role('switch')
    }).description('群组限制')
]);
function apply(ctx) {
    // 存储用户选择的模型
    const userModels = new Map();
    // 保存原始的cfgScale值
    const originalCfgScale = parseFloat(ctx.config.cfgScale.toString());
    const drawingQueue = [];
    let isProcessing = false;
    // 添加一个集合来跟踪已经发送过处理提示的用户
    const usersSentProcessingMessage = new Set();
    // 添加处理中的Key记录
    const processingKeys = new Set();
    // 添加用户每日使用次数记录
    const userDailyUsage = new Map();
    // 添加用户上一次提示词的存储
    const userLastPrompts = new Map();
    // 添加中间件来处理各种重画命令格式
    ctx.middleware(async (session, next) => {
        const content = session.content || '';
        const groupId = session.guildId || session.channelId;
        // 先检查群组权限
        if (!canGroupUse(groupId)) {
            // 如果设置了不显示限制消息，则直接放行给下一个中间件处理
            // 实际上会被命令处理器拦截，不会做任何响应
            if (!ctx.config.showRestrictionMessage)
                return next();
        }
        // 处理"重画N张"格式
        if (/^重画[\d一二两三四五六七八九十几]+张?/.test(content)) {
            const matched = content.match(/^重画([\d一二两三四五六七八九十几]+)张?/);
            if (matched) {
                return session.execute(`再来一张 ${matched[1]}`, next);
            }
        }
        // 处理"再来N张"格式
        if (/^再来[\d一二两三四五六七八九十几]+张?/.test(content)) {
            const matched = content.match(/^再来([\d一二两三四五六七八九十几]+)张?/);
            if (matched) {
                return session.execute(`再来一张 ${matched[1]}`, next);
            }
        }
        // 处理"再画N张"格式
        if (/^再画[\d一二两三四五六七八九十几]+张?/.test(content)) {
            const matched = content.match(/^再画([\d一二两三四五六七八九十几]+)张?/);
            if (matched) {
                return session.execute(`再来一张 ${matched[1]}`, next);
            }
        }
        return next();
    });
    // 获取当前日期字符串 (YYYY-MM-DD 格式)
    function getCurrentDate() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    // 检查用户是否可以使用绘图功能
    function canUserDraw(userId, groupId) {
        // 如果未启用每日限制，直接返回 true
        if (!ctx.config.enableDailyLimit) {
            return true;
        }
        // 检查是否在白名单中
        if (ctx.config.whitelistUsers.includes(userId)) {
            return true;
        }
        const currentDate = getCurrentDate();
        const userUsage = userDailyUsage.get(userId);
        // 如果没有记录或者日期不是今天，重置计数
        if (!userUsage || userUsage.date !== currentDate) {
            userDailyUsage.set(userId, { count: 0, date: currentDate });
            return true;
        }
        // 获取适用的每日限制
        const dailyLimit = getGroupDailyLimit(groupId);
        // 检查是否超过每日限制
        return userUsage.count < dailyLimit;
    }
    // 增加用户使用次数
    function incrementUserUsage(userId) {
        const currentDate = getCurrentDate();
        const userUsage = userDailyUsage.get(userId) || { count: 0, date: currentDate };
        // 如果日期不是今天，重置计数
        if (userUsage.date !== currentDate) {
            userUsage.count = 1;
            userUsage.date = currentDate;
        }
        else {
            userUsage.count++;
        }
        userDailyUsage.set(userId, userUsage);
    }
    // 获取用户剩余次数
    function getUserRemainingDraws(userId, groupId) {
        // 如果未启用每日限制，返回无限
        if (!ctx.config.enableDailyLimit) {
            return Infinity;
        }
        // 白名单用户无限制
        if (ctx.config.whitelistUsers.includes(userId)) {
            return Infinity;
        }
        const currentDate = getCurrentDate();
        const userUsage = userDailyUsage.get(userId);
        // 获取适用的每日限制
        const dailyLimit = getGroupDailyLimit(groupId);
        // 如果没有记录或者日期不是今天
        if (!userUsage || userUsage.date !== currentDate) {
            return dailyLimit;
        }
        return Math.max(0, dailyLimit - userUsage.count);
    }
    // 获取群组特定的每日限制
    function getGroupDailyLimit(groupId) {
        // 如果没有提供群组ID，返回默认限制
        if (!groupId) {
            return ctx.config.dailyLimit;
        }
        // 查找是否有该群组的特殊配置
        const groupConfig = ctx.config.groupDailyLimits.find(config => config.groupId === groupId);
        // 如果找到配置且限制大于0，返回该群组的限制值
        if (groupConfig && groupConfig.limit > 0) {
            return groupConfig.limit;
        }
        // 否则返回默认限制
        return ctx.config.dailyLimit;
    }
    // 存储用户上一次提示词的函数
    function saveUserLastPrompt(userId, prompt, orientation, sizeCategory, modelOverride, disableArtistPrompt, lastArtistPrompt // 新增：上次使用的画师提示词
    ) {
        userLastPrompts.set(userId, {
            prompt,
            orientation,
            sizeCategory,
            modelOverride,
            disableArtistPrompt,
            lastArtistPrompt
        });
    }
    // 获取用户上一次提示词的函数
    function getUserLastPrompt(userId) {
        return userLastPrompts.get(userId);
    }
    // 添加一个检测文本是否包含中文的函数
    function containsChinese(text) {
        // 使用Unicode范围检测中文字符
        // \u4e00-\u9fff 是中文汉字范围
        // \u3400-\u4dbf 是扩展A区
        // \u20000-\u2a6df 是扩展B区
        // \u2a700-\u2b73f 是扩展C区
        // \u2b740-\u2b81f 是扩展D区
        // \u2b820-\u2ceaf 是扩展E区
        // 这里使用简化版匹配最常见的中文字符
        return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text);
    }
    // 修改翻译函数
    async function translateText(text) {
        // 创建一个缓存对象，用于存储翻译结果
        // 静态对象，保持在插件生命周期内
        if (!translateText['cache']) {
            translateText['cache'] = new Map();
        }
        // 检查缓存中是否有该文本的翻译
        if (translateText['cache'].has(text)) {
            return translateText['cache'].get(text);
        }
        // 全局计数器和时间戳，限制并发翻译请求
        if (!translateText['lastCallTime']) {
            translateText['lastCallTime'] = 0;
            translateText['callCount'] = 0;
        }
        // 强制等待足够时间，确保请求间隔至少2秒
        const now = Date.now();
        const timeSinceLastCall = now - translateText['lastCallTime'];
        // 如果距离上次请求不足2秒，则等待
        if (timeSinceLastCall < 2000) {
            await new Promise(resolve => setTimeout(resolve, 2000 - timeSinceLastCall + 500)); // 额外加500ms缓冲
        }
        // 更新最后请求时间
        translateText['lastCallTime'] = Date.now();
        try {
            // 标准翻译请求
            const response = await ctx.http.get('https://translate.appworlds.cn', {
                params: {
                    text,
                    from: 'zh-CN',
                    to: 'en'
                },
                timeout: 10000
            });
            if (response && response.code === 200 && response.data) {
                // 存入缓存
                translateText['cache'].set(text, response.data);
                return response.data;
            }
            throw new Error(response?.msg || '翻译失败');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            // ctx.logger('loliy-novelai').warn(`翻译失败: ${errorMessage}`);
            return text;
        }
    }
    // 检查群组是否可以使用绘图功能
    function canGroupUse(groupId) {
        // 如果不是群聊消息，允许使用
        if (!groupId)
            return true;
        // 如果启用了白名单
        if (ctx.config.enableGroupWhitelist) {
            // 如果白名单为空，所有群都不能使用
            if (ctx.config.groupWhitelist.length === 0) {
                return false;
            }
            return ctx.config.groupWhitelist.includes(groupId);
        }
        // 如果启用了黑名单
        if (ctx.config.enableGroupBlacklist) {
            return !ctx.config.groupBlacklist.includes(groupId);
        }
        // 默认允许使用
        return true;
    }
    // 添加解析-O选项的函数
    function parseDisableArtistPrompt(text) {
        let disableArtistPrompt = false;
        let processedText = text;
        // 记录原始输入
        // ctx.logger('loliy-novelai').debug(`parseDisableArtistPrompt 输入: "${text}"`)
        // 修改正则表达式，更精确地匹配 -O 选项
        // 使用更严格的正则表达式匹配-O选项，确保只匹配-O本身而不是整个词或短语
        const regex = new RegExp(`(^|\\s)-O(\\s|$)`);
        if (regex.test(processedText)) {
            disableArtistPrompt = true;
            // 记录匹配前的文本
            // ctx.logger('loliy-novelai').debug(`匹配到-O选项，替换前: "${processedText}"`)
            // 使用替换函数，保留前后的空格中的一个，确保词之间的分隔
            processedText = processedText.replace(regex, (match, p1, p2) => {
                // 如果前后都有空格，保留一个空格；如果只有一侧有空格，保留那一侧的空格；如果两侧都没有空格，返回空字符串
                if (p1 === ' ' && p2 === ' ')
                    return ' ';
                if (p1 === ' ')
                    return ' ';
                if (p2 === ' ')
                    return ' ';
                return '';
            }).trim();
            // 记录替换后的文本
            // ctx.logger('loliy-novelai').info(`检测到-O选项，将禁用画师提示词 | 原始文本: "${text}" | 处理后文本: "${processedText}"`)
        }
        else {
            // ctx.logger('loliy-novelai').debug(`未检测到-O选项 | 文本: "${text}"`)
        }
        return { disableArtistPrompt, processedText };
    }
    // 修改添加到队列的函数
    function addToQueue(session, prompt, orientation, sizeCategory, modelOverride, disableArtistPrompt, lastArtistPrompt // 新增：传递上次的画师提示词
    ) {
        const userId = session.userId;
        const groupId = session.guildId || session.channelId;
        // 检查群组权限
        if (!canGroupUse(groupId)) {
            if (!ctx.config.showRestrictionMessage)
                return 0;
            if (ctx.config.enableGroupWhitelist) {
                if (ctx.config.groupWhitelist.length === 0) {
                    throw new Error('当前未设置任何白名单群组，所有群组均无法使用绘图功能。');
                }
                throw new Error('当前群组不在白名单中，无法使用绘图功能。');
            }
            else {
                throw new Error('当前群组在黑名单中，无法使用绘图功能。');
            }
        }
        // 检查用户是否可以使用绘图功能
        if (!canUserDraw(userId, groupId)) {
            const limit = getGroupDailyLimit(groupId);
            throw new Error(`您今日的绘图次数已用完，该群每日限制${limit}次。请明天再试。`);
        }
        // 直接使用用户输入的提示词，generateImage函数中会按照画师提示词 -> 用户输入 -> 质量提示词的顺序处理
        let finalPrompt = prompt;
        // 增加用户使用次数
        incrementUserUsage(userId);
        // 保存用户的提示词，用于"再来一张"功能
        // 使用传入的lastArtistPrompt或初始值"null"
        saveUserLastPrompt(userId, prompt, orientation, sizeCategory, modelOverride, disableArtistPrompt, lastArtistPrompt || "null");
        const queueItem = {
            userId: userId,
            userName: session.username || userId,
            timestamp: Date.now(),
            prompt: finalPrompt,
            orientation,
            sizeCategory,
            modelOverride,
            session,
            isProcessing: false,
            disableArtistPrompt
        };
        drawingQueue.push(queueItem);
        // 尝试处理队列
        processQueue();
        return drawingQueue.length;
    }
    // 修改队列处理函数，添加队列处理间隔来避免翻译API的频率限制
    async function processQueue() {
        // 如果队列为空，直接返回
        if (drawingQueue.length === 0)
            return;
        let availableKeys = [];
        let maxThreads = 1; // 默认同时处理1个请求
        // 根据API类型选择合适的密钥和最大线程数
        if (ctx.config.apiType === 'hua') {
            // 修改：对于Hua API，不再过滤掉已在处理中的key，允许同一个key处理多个请求
            availableKeys = ctx.config.huaAuthKeys;
            // 对于Hua API，使用配置的最大线程数
            maxThreads = Math.min(ctx.config.maxConcurrentThreads || 1, 5);
        }
        else {
            availableKeys = ctx.config.apiKeys.filter(key => !processingKeys.has(key));
            // 对于Loliy API，保持使用所有可用的key同时处理
            maxThreads = availableKeys.length;
        }
        if (availableKeys.length === 0)
            return; // 所有Key都在处理中
        // 获取所有未处理的请求
        const pendingItems = drawingQueue.filter(item => !item.isProcessing);
        if (pendingItems.length === 0)
            return; // 所有请求都在处理中
        // 如果是Hua API，限制最大处理线程数
        if (ctx.config.apiType === 'hua') {
            // 确保不超过配置的最大线程数和待处理请求数量
            const activeThreads = Math.min(maxThreads, pendingItems.length);
            // 为每个线程分配一个未处理的请求，Hua API可以重复使用相同的key
            for (let i = 0; i < activeThreads; i++) {
                // 如果key数量少于线程数，循环使用现有的key
                const apiKey = availableKeys[i % availableKeys.length];
                const nextItem = pendingItems[i];
                // 标记为处理中
                nextItem.isProcessing = true;
                // 对于Hua API，不将key添加到processingKeys中，因为同一个key可以处理多个请求
                // 减少随机延迟，只添加很小的随机偏移以避免完全同时请求
                const randomDelay = Math.random() * 200;
                // 使用Promise来处理单个请求
                const processRequest = async () => {
                    try {
                        // 如果请求超过5分钟，自动移除
                        if (Date.now() - nextItem.timestamp > 5 * 60 * 1000) {
                            removeFromQueue(nextItem);
                            await nextItem.session.send('请求超时，已自动取消。请重新发送绘图指令。');
                            return;
                        }
                        // 计算尺寸和模型名称
                        let currentOrientation = nextItem.orientation || ctx.config.defaultOrientation;
                        let currentSizeCategory = nextItem.sizeCategory || ctx.config.defaultSizeCategory;
                        // 如果是 Hua API，强制使用标准尺寸
                        if (ctx.config.apiType === 'hua' && currentSizeCategory !== '标准尺寸') {
                            await nextItem.session.send('Hua API 仅支持标准尺寸，将使用标准尺寸继续生成。');
                            currentSizeCategory = '标准尺寸';
                        }
                        // 转换为内部使用的值
                        const internalOrientation = ORIENTATION_MAP[currentOrientation];
                        const internalSizeCategory = SIZE_CATEGORY_MAP[currentSizeCategory];
                        // 检查壁纸模式下的方图请求
                        if (internalSizeCategory === 'wallpaper' && internalOrientation === 'square') {
                            await nextItem.session.send('壁纸尺寸不支持方图，将使用默认尺寸方图。');
                            currentSizeCategory = '标准尺寸';
                        }
                        // 验证尺寸类型是否可用
                        else if ((internalSizeCategory === 'large' && !ctx.config.enableLargeSize) ||
                            (internalSizeCategory === 'wallpaper' && !ctx.config.enableWallpaperSize)) {
                            await nextItem.session.send(`${currentSizeCategory}未启用，将使用默认尺寸继续生成。`);
                            currentSizeCategory = '标准尺寸';
                        }
                        const size = SIZES[SIZE_CATEGORY_MAP[currentSizeCategory]][ORIENTATION_MAP[currentOrientation]];
                        const [width, height] = size.split('x').map(Number);
                        // 获取模型名称
                        let modelName = '默认模型';
                        if (nextItem.modelOverride) {
                            modelName = Object.entries(AVAILABLE_MODELS).find(([key, value]) => key === nextItem.modelOverride)?.[1] || '自定义模型';
                        }
                        else if (userModels.get(nextItem.userId)) {
                            modelName = Object.entries(MODEL_MAP)
                                .find(([name, key]) => key === userModels.get(nextItem.userId))?.[0] || '自定义模型';
                        }
                        else {
                            modelName = ctx.config.model;
                        }
                        // 只有用户的第一个请求才发送处理提示
                        if (!usersSentProcessingMessage.has(nextItem.userId)) {
                            const apiTypeText = ctx.config.apiType === 'hua' ? 'Hua' : 'Loliy';
                            const processingMsg = await nextItem.session.send(`正在使用${apiTypeText} API生成图片... (${size}, ${currentSizeCategory}, 模型: ${modelName})`);
                            // 如果启用了提示消息自动撤回
                            if (ctx.config.autoRecallPrompt && processingMsg) {
                                setTimeout(async () => {
                                    try {
                                        await nextItem.session.bot.deleteMessage(nextItem.session.channelId, Array.isArray(processingMsg) ? String(processingMsg[0]) : String(processingMsg));
                                    }
                                    catch (error) {
                                        // ctx.logger('loliy-novelai').error('撤回处理中消息失败', error)
                                    }
                                }, ctx.config.promptRecallDelay * 1000);
                            }
                            usersSentProcessingMessage.add(nextItem.userId);
                        }
                        // 处理图片生成的核心逻辑
                        await generateImage(nextItem, apiKey);
                    }
                    catch (error) {
                        const errorMessage = error instanceof Error ? error.message : '未知错误';
                        // ctx.logger('loliy-novelai').error(error)
                        await nextItem.session.send(errorMessage);
                    }
                    finally {
                        // 移除已处理的请求
                        removeFromQueue(nextItem);
                        // 对于Hua API，不需要从processingKeys中移除key
                        // 如果队列中还有未处理的请求，继续处理队列
                        if (drawingQueue.length > 0) {
                            // 添加短暂延迟后继续处理队列，避免连续翻译
                            setTimeout(() => processQueue(), 300);
                        }
                        else {
                            // 队列为空，清空已发送处理提示的用户集合
                            usersSentProcessingMessage.clear();
                        }
                    }
                };
                // 使用setTimeout来延迟执行，但返回Promise
                setTimeout(() => processRequest(), randomDelay);
            }
        }
        else {
            // Loliy API处理逻辑保持不变 - 为每个可用的Key分配一个未处理的请求
            for (let i = 0; i < Math.min(availableKeys.length, pendingItems.length); i++) {
                const apiKey = availableKeys[i];
                const nextItem = pendingItems[i];
                // 标记为处理中
                nextItem.isProcessing = true;
                processingKeys.add(apiKey);
                // 添加随机延迟，避免同时翻译
                const randomDelay = i * 1500 + Math.random() * 500;
                // 使用Promise来处理单个请求
                const processRequest = async () => {
                    try {
                        // 如果请求超过5分钟，自动移除
                        if (Date.now() - nextItem.timestamp > 5 * 60 * 1000) {
                            removeFromQueue(nextItem);
                            processingKeys.delete(apiKey);
                            await nextItem.session.send('请求超时，已自动取消。请重新发送绘图指令。');
                            return;
                        }
                        // 计算尺寸和模型名称
                        let currentOrientation = nextItem.orientation || ctx.config.defaultOrientation;
                        let currentSizeCategory = nextItem.sizeCategory || ctx.config.defaultSizeCategory;
                        // 如果是 Hua API，强制使用标准尺寸
                        if (ctx.config.apiType === 'hua' && currentSizeCategory !== '标准尺寸') {
                            await nextItem.session.send('Hua API 仅支持标准尺寸，将使用标准尺寸继续生成。');
                            currentSizeCategory = '标准尺寸';
                        }
                        // 转换为内部使用的值
                        const internalOrientation = ORIENTATION_MAP[currentOrientation];
                        const internalSizeCategory = SIZE_CATEGORY_MAP[currentSizeCategory];
                        // 检查壁纸模式下的方图请求
                        if (internalSizeCategory === 'wallpaper' && internalOrientation === 'square') {
                            await nextItem.session.send('壁纸尺寸不支持方图，将使用默认尺寸方图。');
                            currentSizeCategory = '标准尺寸';
                        }
                        // 验证尺寸类型是否可用
                        else if ((internalSizeCategory === 'large' && !ctx.config.enableLargeSize) ||
                            (internalSizeCategory === 'wallpaper' && !ctx.config.enableWallpaperSize)) {
                            await nextItem.session.send(`${currentSizeCategory}未启用，将使用默认尺寸继续生成。`);
                            currentSizeCategory = '标准尺寸';
                        }
                        const size = SIZES[SIZE_CATEGORY_MAP[currentSizeCategory]][ORIENTATION_MAP[currentOrientation]];
                        const [width, height] = size.split('x').map(Number);
                        // 获取模型名称
                        let modelName = '默认模型';
                        if (nextItem.modelOverride) {
                            modelName = Object.entries(AVAILABLE_MODELS).find(([key, value]) => key === nextItem.modelOverride)?.[1] || '自定义模型';
                        }
                        else if (userModels.get(nextItem.userId)) {
                            modelName = Object.entries(MODEL_MAP)
                                .find(([name, key]) => key === userModels.get(nextItem.userId))?.[0] || '自定义模型';
                        }
                        else {
                            modelName = ctx.config.model;
                        }
                        // 只有用户的第一个请求才发送处理提示
                        if (!usersSentProcessingMessage.has(nextItem.userId)) {
                            const apiTypeText = ctx.config.apiType === 'hua' ? 'Hua' : 'Loliy';
                            const processingMsg = await nextItem.session.send(`正在使用${apiTypeText} API生成图片... (${size}, ${currentSizeCategory}, 模型: ${modelName})`);
                            // 如果启用了提示消息自动撤回
                            if (ctx.config.autoRecallPrompt && processingMsg) {
                                setTimeout(async () => {
                                    try {
                                        await nextItem.session.bot.deleteMessage(nextItem.session.channelId, Array.isArray(processingMsg) ? String(processingMsg[0]) : String(processingMsg));
                                    }
                                    catch (error) {
                                        // ctx.logger('loliy-novelai').error('撤回处理中消息失败', error)
                                    }
                                }, ctx.config.promptRecallDelay * 1000);
                            }
                            usersSentProcessingMessage.add(nextItem.userId);
                        }
                        // 处理图片生成的核心逻辑
                        await generateImage(nextItem, apiKey);
                    }
                    catch (error) {
                        const errorMessage = error instanceof Error ? error.message : '未知错误';
                        // ctx.logger('loliy-novelai').error(error)
                        await nextItem.session.send(errorMessage);
                    }
                    finally {
                        // 移除已处理的请求
                        removeFromQueue(nextItem);
                        processingKeys.delete(apiKey);
                        // 如果队列中还有未处理的请求，继续处理队列
                        if (drawingQueue.length > 0) {
                            // 添加短暂延迟后继续处理队列，避免连续翻译
                            setTimeout(() => processQueue(), 300);
                        }
                        else {
                            // 队列为空，清空已发送处理提示的用户集合
                            usersSentProcessingMessage.clear();
                        }
                    }
                };
                // 使用setTimeout来延迟执行，但返回Promise
                setTimeout(() => processRequest(), randomDelay);
            }
        }
    }
    // 从队列中移除项目
    function removeFromQueue(item) {
        const index = drawingQueue.findIndex(i => i === item);
        if (index !== -1) {
            drawingQueue.splice(index, 1);
        }
    }
    // 添加延迟函数
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    // 修改图片生成函数，接收API Key
    async function generateImage(item, apiKey) {
        let retries = 0;
        let requestData;
        let lastError = null;
        while (retries < ctx.config.maxRetries) {
            try {
                const { session, prompt, modelOverride, disableArtistPrompt } = item;
                let currentOrientation = item.orientation || ctx.config.defaultOrientation;
                let currentSizeCategory = item.sizeCategory || ctx.config.defaultSizeCategory;
                // 用户输入的提示词
                let userPrompt = prompt;
                // 记录原始提示词
                // ctx.logger('loliy-novelai').info(`处理用户提示词 | 原始提示词: "${userPrompt}" | 用户ID: ${item.userId}`)
                // 0. 如果启用了翻译，先进行翻译
                if (ctx.config.enableTranslation) {
                    if (containsChinese(userPrompt)) {
                        const translatedPrompt = await translateText(userPrompt);
                        if (translatedPrompt && translatedPrompt !== userPrompt) {
                            if (ctx.config.showTranslationResult) {
                                const translationMsg = await session.send(`已将提示词翻译为: ${translatedPrompt}`);
                                // 如果启用了提示消息自动撤回
                                if (ctx.config.autoRecallPrompt && translationMsg) {
                                    setTimeout(async () => {
                                        try {
                                            await session.bot.deleteMessage(session.channelId, Array.isArray(translationMsg) ? String(translationMsg[0]) : String(translationMsg));
                                        }
                                        catch (error) {
                                            // 保留错误处理但简化日志
                                            // ctx.logger('loliy-novelai').error('撤回翻译提示消息失败', error)
                                        }
                                    }, ctx.config.promptRecallDelay * 1000);
                                }
                            }
                            // ctx.logger('loliy-novelai').info(`翻译提示词 | 原文: "${userPrompt}" | 译文: "${translatedPrompt}" | 用户ID: ${item.userId}`)
                            userPrompt = translatedPrompt;
                        }
                    }
                    else {
                        // ctx.logger('loliy-novelai').debug(`提示词不包含中文，跳过翻译 | 用户ID: ${item.userId}`)
                    }
                }
                // 格式化用户提示词结尾
                userPrompt = formatPromptEnding(userPrompt);
                // ctx.logger('loliy-novelai').debug(`格式化后的用户提示词: "${userPrompt}" | 用户ID: ${item.userId}`)
                // 组合最终提示词的各部分
                let finalPromptParts = [];
                let artistPrompt = '';
                // 检查是否是重画请求，以及是否需要使用上次的画师提示词
                const lastPromptData = item.userId ? getUserLastPrompt(item.userId) : undefined;
                const lastArtistPrompt = lastPromptData?.lastArtistPrompt;
                // 移除调试输出
                // console.log(`[DEBUG] 用户: ${item.userId} | 重画随机: ${ctx.config.randomArtistOnRedraw} | 上次画师: ${lastArtistPrompt || '无'}`);
                // 1. 处理画师提示词 - 处理重画时的画师提示词逻辑
                if (ctx.config.enableArtistPrompts && !disableArtistPrompt && !hasArtistTag(userPrompt)) {
                    if (ctx.config.artistPrompts && ctx.config.artistPrompts.length > 0) {
                        // 如果有上次的画师提示词且配置为不随机，则使用上次的画师提示词
                        if (lastArtistPrompt && lastArtistPrompt !== 'null' && !ctx.config.randomArtistOnRedraw) {
                            artistPrompt = lastArtistPrompt;
                        }
                        else {
                            // 随机选择画师提示词
                            artistPrompt = ctx.config.artistPrompts[Math.floor(Math.random() * ctx.config.artistPrompts.length)].trim();
                        }
                        // Check if artist prompt ends with comma and log it
                        const hasEndingComma = artistPrompt.endsWith(',');
                        // ctx.logger('loliy-novelai').info(`使用画师提示词: "${artistPrompt}" | 以逗号结尾: ${hasEndingComma} | 用户ID: ${item.userId}`);
                    }
                }
                else {
                    // 记录未应用画师提示词的原因
                    if (!ctx.config.enableArtistPrompts) {
                        // ctx.logger('loliy-novelai').debug(`未应用画师提示词: 全局设置已禁用 | 用户ID: ${item.userId}`);
                    }
                    else if (disableArtistPrompt) {
                        // ctx.logger('loliy-novelai').info(`未应用画师提示词: 用户使用-O选项临时禁用 | 用户ID: ${item.userId}`);
                    }
                    else if (hasArtistTag(userPrompt)) {
                        // ctx.logger('loliy-novelai').debug(`未应用画师提示词: 用户提示词已包含画师标签 | 用户ID: ${item.userId}`);
                    }
                }
                // 2. 准备用户提示词 - 确保格式正确
                const cleanedUserPrompt = userPrompt.replace(/,\s*$/, '').trim();
                // ctx.logger('loliy-novelai').debug(`清理后的用户提示词: "${cleanedUserPrompt}" | 用户ID: ${item.userId}`);
                // 3. 处理质量提示词
                let qualityPrompt = '';
                if (ctx.config.enableDefaultPrompt && ctx.config.defaultPrompt) {
                    qualityPrompt = ctx.config.defaultPrompt.trim();
                    // ctx.logger('loliy-novelai').debug(`质量提示词: "${qualityPrompt}" | 用户ID: ${item.userId}`);
                }
                // 4. 构建最终提示词 - 完全重写这部分逻辑
                let finalPrompt = '';
                let cleanedArtistPrompt = '';
                // 处理艺术家提示词
                if (artistPrompt) {
                    // 移除结尾的逗号，我们会在拼接时手动添加
                    cleanedArtistPrompt = artistPrompt.endsWith(',') ? artistPrompt.slice(0, -1).trim() : artistPrompt.trim();
                    // ctx.logger('loliy-novelai').debug(`清理后的画师提示词: "${cleanedArtistPrompt}" | 用户ID: ${item.userId}`);
                }
                // 对于Loliy API，将画师提示词添加到最终提示词中
                if (ctx.config.apiType === 'loliy' && cleanedArtistPrompt) {
                    finalPrompt = cleanedArtistPrompt;
                    // ctx.logger('loliy-novelai').debug(`设置初始提示词(画师): "${finalPrompt}" | 用户ID: ${item.userId}`);
                }
                // 添加用户提示词
                if (finalPrompt) {
                    // 已有画师提示词，添加逗号和用户提示词
                    finalPrompt = finalPrompt + ', ' + cleanedUserPrompt;
                    // ctx.logger('loliy-novelai').debug(`添加用户提示词后: "${finalPrompt}" | 用户ID: ${item.userId}`);
                }
                else {
                    // 没有画师提示词，直接使用用户提示词
                    finalPrompt = cleanedUserPrompt;
                    // ctx.logger('loliy-novelai').debug(`直接使用用户提示词: "${finalPrompt}" | 用户ID: ${item.userId}`);
                }
                // 添加质量提示词（如果有）
                if (qualityPrompt) {
                    finalPrompt = finalPrompt + ', ' + qualityPrompt;
                    // ctx.logger('loliy-novelai').debug(`添加质量提示词后: "${finalPrompt}" | 用户ID: ${item.userId}`);
                }
                // 确保没有多余的空格
                finalPrompt = finalPrompt.trim();
                // 记录各部分内容和最终提示词
                // ctx.logger('loliy-novelai').debug(`提示词组合详情 | 画师: "${cleanedArtistPrompt}" | 用户: "${cleanedUserPrompt}" | 质量: "${qualityPrompt}" | 用户ID: ${item.userId}`);
                // ctx.logger('loliy-novelai').info(`最终提示词: "${finalPrompt}" | 用户ID: ${item.userId}`);
                // 转换为内部使用的值
                const internalOrientation = ORIENTATION_MAP[currentOrientation];
                const internalSizeCategory = SIZE_CATEGORY_MAP[currentSizeCategory];
                // 获取对应尺寸
                const size = SIZES[SIZE_CATEGORY_MAP[currentSizeCategory]][ORIENTATION_MAP[currentOrientation]];
                const [width, height] = size.split('x').map(Number);
                // 使用模型覆盖或用户选择的模型或默认模型
                const model = modelOverride || userModels.get(item.userId) || MODEL_MAP[ctx.config.model];
                // 根据模型选择适合的采样器和噪声调度
                const sampler = getSamplerForModel(model, ctx.config.sampler);
                const noiseSchedule = getNoiseScheduleForModel(model, ctx.config.noiseSchedule);
                let imageContent;
                let seed = '-1';
                // 根据选择的API类型进行不同的处理
                if (ctx.config.apiType === 'hua') {
                    // 检查是否有可用的授权密钥
                    if (!ctx.config.huaAuthKeys.length) {
                        throw new Error('未配置Hua API授权密钥');
                    }
                    // 构建Hua API的URL
                    const huaUrl = new URL('https://hua.shigure.top/generate');
                    huaUrl.searchParams.set('sq', apiKey);
                    if (ctx.config.huaNaiKeys.length > 0) {
                        const naiKey = ctx.config.huaNaiKeys[Math.floor(Math.random() * ctx.config.huaNaiKeys.length)];
                        if (naiKey)
                            huaUrl.searchParams.set('nai-key', naiKey);
                    }
                    huaUrl.searchParams.set('model', model);
                    // 对于Hua API，画师提示词单独传递，不包含在tag中
                    huaUrl.searchParams.set('artist', cleanedArtistPrompt);
                    // Hua API的tag参数应该只包含用户提示词和质量提示词，不包含画师提示词
                    let huaTagPrompt = cleanedUserPrompt;
                    if (qualityPrompt) {
                        huaTagPrompt = huaTagPrompt + ', ' + qualityPrompt;
                    }
                    huaUrl.searchParams.set('tag', huaTagPrompt);
                    // 记录发送到Hua API的参数
                    // ctx.logger('loliy-novelai').debug(`Hua API参数 | artist: "${cleanedArtistPrompt}" | tag: "${huaTagPrompt}" | 用户ID: ${item.userId}`)
                    // 设置其他参数
                    huaUrl.searchParams.set('negative', ctx.config.negativePrompt);
                    huaUrl.searchParams.set('size', currentOrientation);
                    huaUrl.searchParams.set('sampler', sampler);
                    huaUrl.searchParams.set('noise_schedule', noiseSchedule);
                    huaUrl.searchParams.set('scale', originalCfgScale.toFixed(1));
                    huaUrl.searchParams.set('steps', ctx.config.steps.toString());
                    huaUrl.searchParams.append('no_random_artist', '');
                    if (!ctx.config.useHuaCache) {
                        huaUrl.searchParams.set('nocache', '1');
                    }
                    // Hua API 直接返回图片URL，直接使用segment.image
                    imageContent = koishi_1.segment.image(huaUrl.toString());
                }
                else {
                    // Loliy API 处理逻辑
                    requestData = {
                        token: apiKey,
                        model,
                        width,
                        height,
                        steps: ctx.config.steps,
                        prompt: finalPrompt,
                        n_prompt: ctx.config.negativePrompt,
                        scale: originalCfgScale.toFixed(1),
                        auto: false,
                        cfg_scale: '0',
                        seed: '-1',
                        sampler,
                        SMEA: false,
                        DYN: false,
                        noise: noiseSchedule,
                        img2: {
                            img: '',
                            noise: '0',
                            strength: '0.7',
                            typesetting: '1'
                        },
                        reference: {
                            reference_image_multiple: [],
                            reference_information_extracted_multiple: [],
                            reference_strength_multiple: []
                        },
                        character: [],
                        skip: {
                            scas: false,
                            scbs: false
                        }
                    };
                    const response = await ctx.http.post('https://apis.loliy.top/v1/images/generate', requestData, {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 60000
                    });
                    if (!response) {
                        throw new Error('API返回为空');
                    }
                    if (response.status === 'success' && response.data?.[0]) {
                        // 使用直接URL而不是base64
                        if (response.data[0].url) {
                            imageContent = koishi_1.segment.image(response.data[0].url);
                        }
                        else if (response.data[0].b64_json) {
                            // 如果没有URL，回退到使用base64
                            imageContent = koishi_1.segment.image('data:image/png;base64,' + response.data[0].b64_json);
                        }
                        else {
                            throw new Error('API返回中没有图片数据');
                        }
                        seed = response.data[0].seed || '-1';
                    }
                    else {
                        const errorMessage = response.msg ||
                            (response.error?.message || response.error) ||
                            JSON.stringify(response) ||
                            '未知错误';
                        throw new Error(`生成图片失败: ${errorMessage}`);
                    }
                }
                // 准备发送的内容
                let content;
                // 为详细模式准备完整的正面提示词 - 统一组合逻辑，同时适用于Hua API和Loliy API
                let completePrompt = '';
                // 组合画师提示词、用户提示词和质量提示词，确保一致的格式
                if (cleanedArtistPrompt) {
                    completePrompt = `${cleanedArtistPrompt}, ${cleanedUserPrompt}`;
                    if (qualityPrompt) {
                        completePrompt += `, ${qualityPrompt}`;
                    }
                }
                else {
                    completePrompt = cleanedUserPrompt;
                    if (qualityPrompt) {
                        completePrompt += `, ${qualityPrompt}`;
                    }
                }
                // 记录用于显示的完整提示词
                // ctx.logger('loliy-novelai').debug(`详细模式显示的完整提示词: "${completePrompt}" | 用户ID: ${item.userId}`);
                if (ctx.config.contentMode === '仅图片') {
                    content = imageContent;
                }
                else {
                    content = [
                        imageContent,
                        `\n正面提示词: ${completePrompt}`,
                        `\n负面提示词: ${ctx.config.negativePrompt}`,
                        `\n种子: ${seed}`,
                        `\n采样器: ${sampler}`,
                        `\n步数: ${ctx.config.steps}`,
                        `\n提示词相关性: ${originalCfgScale.toFixed(1)}`,
                        `\n噪声调度: ${noiseSchedule}`,
                        `\n尺寸: ${width}x${height}`
                    ].join('');
                }
                // 保存当前使用的画师提示词，用于后续重画
                if (item.userId) {
                    // 获取当前用户的提示词记录
                    const lastPromptData = getUserLastPrompt(item.userId);
                    if (lastPromptData) {
                        saveUserLastPrompt(item.userId, lastPromptData.prompt, lastPromptData.orientation, lastPromptData.sizeCategory, lastPromptData.modelOverride, lastPromptData.disableArtistPrompt, cleanedArtistPrompt // 保存本次使用的画师提示词
                        );
                        // 移除调试输出
                        // ctx.logger('loliy-novelai').debug(`保存画师提示词(用于重画): "${cleanedArtistPrompt}" | 用户ID: ${item.userId}`);
                    }
                }
                // 发送内容
                let msg;
                if (ctx.config.useForwardMessage) {
                    try {
                        if (ctx.config.contentMode === '仅图片') {
                            msg = await session.send(jsx("message", {
                                forward: true,
                                children: jsx("message", {
                                    userId: session.selfId,
                                    nickname: '生成的图片',
                                    children: content
                                })
                            }));
                        }
                        else {
                            const imageMessage = jsx("message", {
                                userId: session.selfId,
                                nickname: '生成的图片',
                                children: imageContent
                            });
                            const detailsMessage = jsx("message", {
                                userId: session.selfId,
                                nickname: '图片信息',
                                children: [
                                    `正面提示词: ${completePrompt}`,
                                    `\n负面提示词: ${ctx.config.negativePrompt}`,
                                    `\n种子: ${seed}`,
                                    `\n采样器: ${sampler}`,
                                    `\n步数: ${ctx.config.steps}`,
                                    `\n提示词相关性: ${originalCfgScale.toFixed(1)}`,
                                    `\n噪声调度: ${noiseSchedule}`,
                                    `\n尺寸: ${width}x${height}`
                                ].join('')
                            });
                            msg = await session.send(jsx("message", {
                                forward: true,
                                children: [imageMessage, detailsMessage]
                            }));
                        }
                    }
                    catch (error) {
                        ctx.logger('loliy-novelai').warn('合并转发失败，将使用普通方式发送', error);
                        msg = await session.send(content);
                    }
                }
                else {
                    msg = await session.send(session.messageId ? koishi_1.h.quote(session.messageId) + content : content);
                }
                // 如果启用了自动撤回
                if (ctx.config.autoRecall && msg) {
                    setTimeout(async () => {
                        try {
                            await session.bot.deleteMessage(session.channelId, Array.isArray(msg) ? String(msg[0]) : String(msg));
                        }
                        catch (error) {
                            // ctx.logger('loliy-novelai').error('撤回消息失败', error)
                        }
                    }, ctx.config.recallDelay * 1000);
                }
                return; // 成功后返回
            }
            catch (error) {
                lastError = error;
                retries++;
                const errorMessage = error instanceof Error ? error.message : '未知错误';
                // 只在最后一次重试失败时记录详细错误
                if (retries === ctx.config.maxRetries) {
                    // 简化错误日志，不记录详细数据
                    // ctx.logger('loliy-novelai').error({
                    //   错误: errorMessage,
                    //   重试次数: retries,
                    //   请求数据: {
                    //     ...requestData,
                    //     token: '***'
                    //   }
                    // })
                    // 根据错误类型返回用户友好的错误消息
                    let userErrorMessage = '生成图片失败';
                    if (errorMessage.includes('401: Unauthorized')) {
                        userErrorMessage = 'API密钥无效或已过期，请联系管理员更新密钥。';
                    }
                    else if (errorMessage.includes('429')) {
                        userErrorMessage = 'API请求次数超限，请稍后再试。';
                    }
                    else if (errorMessage.includes('500')) {
                        userErrorMessage = 'API服务器内部错误，请稍后重试。';
                    }
                    else if (errorMessage.includes('503')) {
                        userErrorMessage = 'API服务暂时不可用，请稍后重试。';
                    }
                    else {
                        userErrorMessage = `生成图片失败: ${errorMessage}`;
                    }
                    throw new Error(userErrorMessage);
                }
                else {
                    // 记录重试次数
                    // ctx.logger('loliy-novelai').warn(`准备第${retries}次重试`)
                    await delay(ctx.config.retryDelay);
                }
            }
        }
        // 如果所有重试都失败了，抛出最后一个错误
        if (lastError) {
            throw lastError;
        }
    }
    // 根据模型获取适合的采样器
    function getSamplerForModel(model, configSampler) {
        if (isV4Model(model)) {
            // 如果是V4模型，但配置的采样器不在V4支持列表中，则使用V4默认采样器
            return SAMPLERS.v4.includes(configSampler)
                ? configSampler
                : 'k_euler_ancestral';
        }
        else {
            // V3模型支持所有采样器
            return configSampler;
        }
    }
    // 根据模型获取适合的噪声调度
    function getNoiseScheduleForModel(model, configNoiseSchedule) {
        if (isV4Model(model)) {
            // 如果是V4模型，但配置的噪声调度不在V4支持列表中，则使用V4默认噪声调度
            return NOISE_SCHEDULES.v4.includes(configNoiseSchedule)
                ? configNoiseSchedule
                : 'karras';
        }
        else {
            // V3模型支持所有噪声调度
            return configNoiseSchedule;
        }
    }
    // 修改解析模型快捷选择函数
    function parseModelShortcut(text) {
        let modelOverride = null;
        let processedText = text;
        // 定义模型关键词映射
        const modelKeywords = {
            'v4': 'nai-diffusion-4-full',
            'v4c': 'nai-diffusion-4-curated-preview',
            'v4.5c': 'nai-diffusion-4-5-curated',
            'v3': 'nai-diffusion-3',
            'furry': 'nai-diffusion-furry-3',
            'v3f': 'nai-diffusion-furry-3'
        };
        // 遍历所有可能的模型关键词
        for (const [keyword, modelId] of Object.entries(modelKeywords)) {
            // 使用正则表达式匹配关键词，支持在任意位置
            const regex = new RegExp(`(?:^|\\s)(${keyword})(?:\\s|$)`);
            if (regex.test(processedText)) {
                modelOverride = modelId;
                // 移除模型关键词
                processedText = processedText.replace(regex, ' ').trim();
                break; // 找到第一个匹配就退出
            }
        }
        return { modelOverride, processedText };
    }
    // 创建父命令
    const cmd = ctx.command('loliy-novelai', '基于loliy API的AI画图插件')
        .usage('获取Key请点击：https://www.loliy.top/')
        .usage('NovelAi绘画第三方平台')
        .usage('价格实惠')
        .usage('') // 添加一个空行作为分隔
        .usage('支持生成各种尺寸的AI图片，包括标准尺寸、大图尺寸和壁纸尺寸');
    // 注册画图命令（带别名）- 改为派生式子指令
    cmd.subcommand('.画', '使用AI生成图片')
        .alias('画')
        .alias('#nai')
        .usage('获取Key请点击：https://www.loliy.top/')
        .usage('NovelAi绘画第三方平台')
        .usage('价格实惠')
        .usage('')
        .usage('在描述文本中可以包含以下关键词来控制图片尺寸：')
        .usage('- 横图/方图：控制图片方向')
        .usage('- 大图/壁纸：使用特殊尺寸（需要在配置中启用）')
        .usage('- -O：禁用画师提示词（临时覆盖全局设置）')
        .example('画 横图 1girl, ')
        .example('画 v4 方图 1girl,  大图')
        .example('画 -O v4 横图 1girl, ')
        .action(async ({ session }, ...args) => {
        try {
            // 记录原始参数，便于调试
            // ctx.logger('loliy-novelai').info(`画图命令参数解析 | 原始参数: ${JSON.stringify(args)} | 用户ID: ${session.userId}`)
            // 获取消息内容（直接从session获取原始消息内容）
            // 注意：根据不同的平台和框架版本，原始消息的位置可能不同
            // 尝试多种可能的位置
            let originalMessage = '';
            try {
                if (session.content) {
                    originalMessage = session.content;
                }
                else if (session.elements && typeof session.elements.join === 'function') {
                    originalMessage = session.elements.join('');
                }
                else if (args.length > 0) {
                    originalMessage = args.join(' ');
                }
            }
            catch (e) {
                originalMessage = args.join(' ');
            }
            // ctx.logger('loliy-novelai').info(`原始消息内容: "${originalMessage}" | 用户ID: ${session.userId}`);
            // 解析命令前缀，移除前缀部分以获取实际参数
            let text = '';
            const prefixes = ['画', '#nai'];
            for (const prefix of prefixes) {
                if (originalMessage.startsWith(prefix)) {
                    text = originalMessage.substring(prefix.length).trim();
                    // ctx.logger('loliy-novelai').info(`检测到命令前缀: "${prefix}" | 参数部分: "${text}" | 用户ID: ${session.userId}`);
                    break;
                }
            }
            // 如果无法从原始消息中获取，尝试使用传统的args方式
            if (!text && args.length > 0) {
                text = args.join(' ');
            }
            // ctx.logger('loliy-novelai').info(`收到绘图指令 | 解析后文本: "${text}" | 用户ID: ${session.userId}`)
            // 解析-O选项
            const { disableArtistPrompt, processedText: textWithoutDisableOption } = parseDisableArtistPrompt(text);
            // ctx.logger('loliy-novelai').debug(`-O选项解析结果 | 禁用画师提示词: ${disableArtistPrompt} | 处理后文本: "${textWithoutDisableOption}" | 用户ID: ${session.userId}`)
            // 解析模型快捷选择
            const { modelOverride, processedText } = parseModelShortcut(textWithoutDisableOption);
            // ctx.logger('loliy-novelai').debug(`模型解析结果 | 模型覆盖: ${modelOverride || '无'} | 处理后文本: "${processedText}" | 用户ID: ${session.userId}`)
            if (modelOverride) {
                // ctx.logger('loliy-novelai').info(`检测到模型选择: ${modelOverride} | 用户ID: ${session.userId}`)
            }
            // 确定尺寸类型
            let sizeCategory = '标准尺寸';
            let finalText = processedText;
            // 检查是否包含大图或壁纸关键词
            if (finalText.includes('大图')) {
                sizeCategory = '大图尺寸';
                finalText = finalText.replace('大图', '').trim();
                // ctx.logger('loliy-novelai').info(`检测到大图尺寸 | 用户ID: ${session.userId}`)
            }
            else if (finalText.includes('壁纸')) {
                sizeCategory = '壁纸尺寸';
                finalText = finalText.replace('壁纸', '').trim();
                // ctx.logger('loliy-novelai').info(`检测到壁纸尺寸 | 用户ID: ${session.userId}`)
            }
            // ctx.logger('loliy-novelai').debug(`尺寸处理后文本: "${finalText}" | 用户ID: ${session.userId}`)
            // 使用新的方向提取函数
            const { orientation, processedText: textWithoutOrientation } = extractOrientation(finalText);
            finalText = textWithoutOrientation;
            // ctx.logger('loliy-novelai').info(`检测到方向: ${orientation} | 处理后文本: "${finalText}" | 用户ID: ${session.userId}`)
            // 清理提示词，删除反斜杠和 LoRA 标签
            const beforeClean = finalText;
            finalText = cleanPrompt(finalText);
            if (beforeClean !== finalText) {
                // ctx.logger('loliy-novelai').debug(`清理提示词 | 清理前: "${beforeClean}" | 清理后: "${finalText}" | 用户ID: ${session.userId}`)
            }
            // 记录最终提示词
            // ctx.logger('loliy-novelai').info(`最终处理的提示词: "${finalText}" | 用户ID: ${session.userId}`)
            // 确保提示词不为空（如果为空，添加默认提示词）
            if (!finalText.trim()) {
                // ctx.logger('loliy-novelai').warn(`提示词为空，可能是参数解析问题 | 原始文本: "${text}" | 用户ID: ${session.userId}`)
                // 如果提示词为空，可以设置一个默认值或提示用户
                return await session.send('提示词不能为空，请输入有效的描述。例如：画 1girl, blue hair');
            }
            // 添加到队列并处理，传递disableArtistPrompt参数，首次调用时第7个参数为null
            const position = addToQueue(session, finalText, orientation, sizeCategory, modelOverride, disableArtistPrompt, null);
            // 如果position为0，说明群组不在白名单中且showRestrictionMessage为false
            if (position === 0)
                return;
            // 获取用户剩余次数
            const remainingDraws = getUserRemainingDraws(session.userId, session.guildId || session.channelId);
            let remainingMsg = '';
            // 只在以下情况显示剩余次数:
            // 1. 启用了每日限制
            // 2. 用户不是白名单用户
            // 3. 剩余次数小于等于5或者刚好用了10次(剩余20次)
            if (ctx.config.enableDailyLimit && remainingDraws !== Infinity) {
                const dailyLimit = getGroupDailyLimit(session.guildId || session.channelId);
                const usedCount = dailyLimit - remainingDraws;
                if (remainingDraws <= 5 || usedCount === 10) {
                    remainingMsg = `\n今日剩余次数: ${remainingDraws}/${dailyLimit}`;
                }
            }
            if (position > 1) {
                const queueMsg = await session.send(`您当前排在第 ${position} 位，请稍候。\n前面还有 ${position - 1} 个请求在等待处理。${remainingMsg}`);
                // 如果启用了提示消息自动撤回
                if (ctx.config.autoRecallPrompt && queueMsg) {
                    setTimeout(async () => {
                        try {
                            await session.bot.deleteMessage(session.channelId, Array.isArray(queueMsg) ? String(queueMsg[0]) : String(queueMsg));
                        }
                        catch (error) {
                            // ctx.logger('loliy-novelai').error('撤回队列等待消息失败', error)
                        }
                    }, ctx.config.promptRecallDelay * 1000);
                }
                return;
            }
            // 启动队列处理
            processQueue();
            // 如果没有其他消息，只返回剩余次数信息
            if (remainingMsg) {
                const remainingMsgId = await session.send(remainingMsg.trim());
                // 如果启用了提示消息自动撤回
                if (ctx.config.autoRecallPrompt && remainingMsgId) {
                    setTimeout(async () => {
                        try {
                            await session.bot.deleteMessage(session.channelId, Array.isArray(remainingMsgId) ? String(remainingMsgId[0]) : String(remainingMsgId));
                        }
                        catch (error) {
                            // ctx.logger('loliy-novelai').error('撤回剩余次数消息失败', error)
                        }
                    }, ctx.config.promptRecallDelay * 1000);
                }
            }
        }
        catch (error) {
            const errorMsg = await session.send(error.message);
            // 如果启用了提示消息自动撤回，也撤回错误消息
            if (ctx.config.autoRecallPrompt && errorMsg) {
                setTimeout(async () => {
                    try {
                        await session.bot.deleteMessage(session.channelId, Array.isArray(errorMsg) ? String(errorMsg[0]) : String(errorMsg));
                    }
                    catch (error) {
                        // ctx.logger('loliy-novelai').error('撤回错误消息失败', error)
                    }
                }, ctx.config.promptRecallDelay * 1000);
            }
        }
    });
    // 添加查询剩余次数命令
    cmd.subcommand('.剩余次数', '查询今日剩余绘图次数')
        .alias('剩余次数')
        .alias('查询次数')
        .action(async ({ session }) => {
        const groupId = session.guildId || session.channelId;
        // 先检查群组权限
        if (!canGroupUse(groupId)) {
            if (!ctx.config.showRestrictionMessage)
                return;
            if (ctx.config.enableGroupWhitelist) {
                if (ctx.config.groupWhitelist.length === 0) {
                    return '当前未设置任何白名单群组，所有群组均无法使用绘图功能。';
                }
                return '当前群组不在白名单中，无法使用绘图功能。';
            }
            else {
                return '当前群组在黑名单中，无法使用绘图功能。';
            }
        }
        // 如果未启用每日限制
        if (!ctx.config.enableDailyLimit) {
            return '当前未启用每日绘图次数限制，可以无限使用。';
        }
        const userId = session.userId;
        const remainingDraws = getUserRemainingDraws(userId, groupId);
        if (remainingDraws === Infinity) {
            return '您是白名单用户，没有每日绘图次数限制。';
        }
        const dailyLimit = getGroupDailyLimit(groupId);
        return `您今日剩余绘图次数: ${remainingDraws}/${dailyLimit}`;
    });
    // 添加查询群组限制的命令
    cmd.subcommand('.群组限制', '查询当前群组的绘图次数限制')
        .alias('群组限制')
        .alias('查询限制')
        .action(async ({ session }) => {
        const groupId = session.guildId || session.channelId;
        // 如果不是群聊
        if (!groupId) {
            return '该命令只能在群聊中使用。';
        }
        // 先检查群组权限
        if (!canGroupUse(groupId)) {
            if (!ctx.config.showRestrictionMessage)
                return;
            if (ctx.config.enableGroupWhitelist) {
                if (ctx.config.groupWhitelist.length === 0) {
                    return '当前未设置任何白名单群组，所有群组均无法使用绘图功能。';
                }
                return '当前群组不在白名单中，无法使用绘图功能。';
            }
            else {
                return '当前群组在黑名单中，无法使用绘图功能。';
            }
        }
        // 如果未启用每日限制
        if (!ctx.config.enableDailyLimit) {
            return '当前未启用每日绘图次数限制，可以无限使用。';
        }
        const dailyLimit = getGroupDailyLimit(groupId);
        const groupConfig = ctx.config.groupDailyLimits.find(config => config.groupId === groupId);
        if (groupConfig) {
            return `当前群组(${groupId})的每日绘图次数限制为 ${dailyLimit} 次/人，该设置优先于全局限制。`;
        }
        else {
            return `当前群组使用全局限制设置，每日绘图次数限制为 ${dailyLimit} 次/人。`;
        }
    });
    // 创建绘画帮助命令（带别名）- 改为派生式子指令
    cmd.subcommand('.绘画菜单', '查询绘画功能')
        .alias('绘画菜单')
        .alias('绘画功能')
        .action(async ({ session }) => {
        const groupId = session.guildId || session.channelId;
        // 先检查群组权限
        if (!canGroupUse(groupId)) {
            if (!ctx.config.showRestrictionMessage)
                return;
            if (ctx.config.enableGroupWhitelist) {
                if (ctx.config.groupWhitelist.length === 0) {
                    return '当前未设置任何白名单群组，所有群组均无法使用绘图功能。';
                }
                return '当前群组不在白名单中，无法使用绘图功能。';
            }
            else {
                return '当前群组在黑名单中，无法使用绘图功能。';
            }
        }
        return [
            '=== AI绘画功能菜单 ===',
            '基础命令：',
            '- 画 <描述文本> - 生成AI图片',
            '- #nai <描述文本> - 生成AI图片（别名）',
            '- 再来一张/再画一张/重画 - 使用上次的提示词重新生成图片',
            '',
            '方向控制：',
            '- 横图/横：生成横向图片',
            '- 方图/方：生成方形图片',
            '- 竖图/竖：生成竖向图片（默认）',
            '',
            '特殊选项：',
            '- -O：临时禁用画师提示词',
            '',
            '可用模型：',
            '- v4：NAI Diffusion V4 完整版',
            '- v4c：NAI Diffusion V4 先行版',
            '- v4.5c：NAI Diffusion V4.5 先行版',
            '- v3：NAI Diffusion Anime V3',
            '- furry/v3f：NAI Diffusion Furry V3',
            '',
            '特殊尺寸：',
            '- 大图：使用更大尺寸（需要在配置中启用）',
            '- 壁纸：使用壁纸尺寸（需要在配置中启用）',
            '',
            '示例：',
            '画 v4c 横 1girl, ',
            '画 -O 横 1girl, ',
            '#nai 方 v3 1girl, ',
            '画 -O 壁纸 furry 竖 1girl, ',
            '再来一张（使用上次提示词重画）',
            '',
            '提示：所有关键词位置随意，互不影响'
        ].join('\n');
    });
    // 在cmd.subcommand后增加再来一张和重画命令
    cmd.subcommand('.再来一张', '使用上次的提示词重新生成图片')
        .alias('再来一张')
        .alias('再画一张')
        .alias('重画')
        .action(async ({ session }, ...args) => {
        try {
            const userId = session.userId;
            const groupId = session.guildId || session.channelId;
            // 先检查群组权限
            if (!canGroupUse(groupId)) {
                if (!ctx.config.showRestrictionMessage)
                    return;
                if (ctx.config.enableGroupWhitelist) {
                    if (ctx.config.groupWhitelist.length === 0) {
                        return await session.send('当前未设置任何白名单群组，所有群组均无法使用绘图功能。');
                    }
                    return await session.send('当前群组不在白名单中，无法使用绘图功能。');
                }
                else {
                    return await session.send('当前群组在黑名单中，无法使用绘图功能。');
                }
            }
            // 解析用户输入的数量
            let count = 1;
            let argsText = args.join(' ');
            // 支持多种格式: 重画2张，重画2, 再来两张，再来2, 再画三张 等
            // 匹配数字+可选的"张"
            // ctx.logger('loliy-novelai').info(`重画参数解析 | 参数: ${argsText} | 用户ID: ${userId}`)
            // 处理中文数字和阿拉伯数字
            if (argsText) {
                if (argsText === '一' || argsText === '1')
                    count = 1;
                else if (argsText === '二' || argsText === '两' || argsText === '俩' || argsText === '2')
                    count = 2;
                else if (argsText === '三' || argsText === '3')
                    count = 3;
                else if (argsText === '四' || argsText === '4')
                    count = 4;
                else if (argsText === '五' || argsText === '5')
                    count = 5;
                else if (argsText === '六' || argsText === '6')
                    count = 6;
                else if (argsText === '七' || argsText === '7')
                    count = 7;
                else if (argsText === '八' || argsText === '8')
                    count = 8;
                else if (argsText === '九' || argsText === '9')
                    count = 9;
                else if (argsText === '十' || argsText === '10')
                    count = 10;
                else if (argsText === '几') {
                    // 使用配置中设置的"几"的随机范围
                    const min = ctx.config.jrandomMin || 2; // 默认最小值2
                    const max = ctx.config.jrandomMax || 4; // 默认最大值4
                    // 确保min <= max
                    const actualMin = Math.min(min, max);
                    const actualMax = Math.max(min, max);
                    // 生成随机数，范围是 [min, max]
                    count = Math.floor(Math.random() * (actualMax - actualMin + 1)) + actualMin;
                }
                else {
                    try {
                        const num = parseInt(argsText);
                        if (!isNaN(num))
                            count = num;
                    }
                    catch (e) {
                        // 解析失败，使用默认值1
                    }
                }
            }
            // 如果解析出的数字超过配置的最大值，使用最大值
            if (count > ctx.config.maxDrawCount) {
                count = ctx.config.maxDrawCount;
            }
            // 确保数量至少为1
            if (count < 1)
                count = 1;
            // ctx.logger('loliy-novelai').info(`重画参数解析结果 | 数量: ${count} | 用户ID: ${userId}`)
            const lastPrompt = getUserLastPrompt(userId);
            if (!lastPrompt) {
                const noRecordMsg = await session.send('没有找到您的上一次绘图记录，请先使用"画"命令生成图片。');
                // 如果启用了提示消息自动撤回，也撤回这个提示
                if (ctx.config.autoRecallPrompt && noRecordMsg) {
                    setTimeout(async () => {
                        try {
                            await session.bot.deleteMessage(session.channelId, Array.isArray(noRecordMsg) ? String(noRecordMsg[0]) : String(noRecordMsg));
                        }
                        catch (error) {
                            // ctx.logger('loliy-novelai').error('撤回无记录提示消息失败', error)
                        }
                    }, ctx.config.promptRecallDelay * 1000);
                }
                return;
            }
            // 移除调试输出
            // console.log(`[DEBUG] 重画读取到的完整lastPrompt:`, JSON.stringify(lastPrompt));
            // 获取上一次的所有参数
            const { prompt, orientation, sizeCategory, modelOverride, disableArtistPrompt, lastArtistPrompt } = lastPrompt;
            // 获取用户剩余次数，确保有足够的次数
            const remainingDraws = getUserRemainingDraws(userId, groupId);
            // 如果剩余次数不足
            if (ctx.config.enableDailyLimit && remainingDraws !== Infinity && remainingDraws < count) {
                const dailyLimit = getGroupDailyLimit(groupId);
                const notEnoughMsg = await session.send(`您的剩余次数不足，当前剩余 ${remainingDraws}/${dailyLimit} 次，无法生成 ${count} 张图片。`);
                // 如果启用了提示消息自动撤回
                if (ctx.config.autoRecallPrompt && notEnoughMsg) {
                    setTimeout(async () => {
                        try {
                            await session.bot.deleteMessage(session.channelId, Array.isArray(notEnoughMsg) ? String(notEnoughMsg[0]) : String(notEnoughMsg));
                        }
                        catch (error) {
                            // ctx.logger('loliy-novelai').error('撤回次数不足消息失败', error)
                        }
                    }, ctx.config.promptRecallDelay * 1000);
                }
                return;
            }
            // 记录队列位置
            let queuePositions = [];
            // 循环添加到队列
            for (let i = 0; i < count; i++) {
                const position = addToQueue(session, prompt, orientation, sizeCategory, modelOverride, disableArtistPrompt, lastArtistPrompt);
                // 如果position为0，说明群组不在白名单中且showRestrictionMessage为false
                if (position === 0)
                    return;
                queuePositions.push(position);
            }
            // 获取用户剩余次数
            const remainingDrawsAfter = getUserRemainingDraws(userId, groupId);
            let remainingMsg = '';
            if (ctx.config.enableDailyLimit && remainingDrawsAfter !== Infinity) {
                const dailyLimit = getGroupDailyLimit(groupId);
                const usedCount = dailyLimit - remainingDrawsAfter;
                if (remainingDrawsAfter <= 5 || usedCount === 10) {
                    remainingMsg = `\n今日剩余次数: ${remainingDrawsAfter}/${dailyLimit}`;
                }
            }
            // 判断是否有任务需要等待
            const maxPosition = Math.max(...queuePositions);
            if (maxPosition > 1) {
                const queueMsg = await session.send(`正在使用上次的提示词生成 ${count} 张图片，队列位置: ${queuePositions.join(', ')}。\n前面还有 ${maxPosition - 1} 个请求在等待处理。${remainingMsg}`);
                // 如果启用了提示消息自动撤回
                if (ctx.config.autoRecallPrompt && queueMsg) {
                    setTimeout(async () => {
                        try {
                            await session.bot.deleteMessage(session.channelId, Array.isArray(queueMsg) ? String(queueMsg[0]) : String(queueMsg));
                        }
                        catch (error) {
                            // ctx.logger('loliy-novelai').error('撤回队列等待消息失败', error)
                        }
                    }, ctx.config.promptRecallDelay * 1000);
                }
                return;
            }
            // 启动队列处理
            processQueue();
            // 显示使用的提示词
            const infoMsg = await session.send(`正在使用上次的提示词生成 ${count} 张图片...\n提示词: ${prompt}${remainingMsg}`);
            // 如果启用了提示消息自动撤回
            if (ctx.config.autoRecallPrompt && infoMsg) {
                setTimeout(async () => {
                    try {
                        await session.bot.deleteMessage(session.channelId, Array.isArray(infoMsg) ? String(infoMsg[0]) : String(infoMsg));
                    }
                    catch (error) {
                        // ctx.logger('loliy-novelai').error('撤回信息消息失败', error)
                    }
                }, ctx.config.promptRecallDelay * 1000);
            }
        }
        catch (error) {
            const errorMsg = await session.send(error.message);
            // 如果启用了提示消息自动撤回，也撤回错误消息
            if (ctx.config.autoRecallPrompt && errorMsg) {
                setTimeout(async () => {
                    try {
                        await session.bot.deleteMessage(session.channelId, Array.isArray(errorMsg) ? String(errorMsg[0]) : String(errorMsg));
                    }
                    catch (error) {
                        // ctx.logger('loliy-novelai').error('撤回错误消息失败', error)
                    }
                }, ctx.config.promptRecallDelay * 1000);
            }
        }
    });
}
