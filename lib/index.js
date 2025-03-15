var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Config: () => Config,
  apply: () => apply,
  name: () => name
});
module.exports = __toCommonJS(src_exports);
var import_koishi = require("koishi");
var import_jsx_runtime = require("@satorijs/element/jsx-runtime");
var name = "loliy-novelai";
var AVAILABLE_MODELS = {
  "nai-diffusion-4-full": "NAI Diffusion V4 完整版",
  "nai-diffusion-4-curated-preview": "NAI Diffusion V4 先行版",
  "nai-diffusion-3": "NAI Diffusion Anime V3",
  "nai-diffusion-furry-3": "NAI Diffusion Furry V3"
};
var MODEL_MAP = {
  "NAI Diffusion V4 完整版": "nai-diffusion-4-full",
  "NAI Diffusion V4 先行版": "nai-diffusion-4-curated-preview",
  "NAI Diffusion Anime V3": "nai-diffusion-3",
  "NAI Diffusion Furry V3": "nai-diffusion-furry-3"
};
var SAMPLERS = {
  v4: [
    "k_euler_ancestral",
    // 默认
    "k_euler",
    "k_dpmpp_2s_ancestral",
    "k_dpmpp_2m_sde",
    "k_dpmpp_2m",
    "k_dpmpp_sde"
  ],
  v3: [
    "k_euler_ancestral",
    // 默认
    "k_euler",
    "k_dpmpp_2s_ancestral",
    "k_dpmpp_2m_sde",
    "k_dpmpp_2m",
    "k_dpmpp_sde",
    "ddim_v3"
  ]
};
var NOISE_SCHEDULES = {
  v4: [
    "karras",
    // 默认
    "exponential",
    "polyexponential"
  ],
  v3: [
    "karras",
    // 默认
    "native",
    "exponential",
    "polyexponential"
  ]
};
var CONTENT_MODES = [
  "仅图片",
  "详细模式"
];
var SIZES = {
  normal: {
    vertical: "832x1216",
    horizontal: "1216x832",
    square: "1024x1024",
    description: "标准尺寸"
  },
  large: {
    vertical: "1024x1536",
    horizontal: "1536x1024",
    square: "1472x1472",
    description: "大图尺寸"
  },
  wallpaper: {
    vertical: "1088x1920",
    horizontal: "1920x1088",
    description: "壁纸尺寸"
  },
  small: {
    vertical: "512x768",
    horizontal: "768x512",
    square: "640x640",
    description: "小图尺寸"
  }
};
var SIZE_CATEGORY_MAP = {
  "标准尺寸": "normal",
  "大图尺寸": "large",
  "壁纸尺寸": "wallpaper",
  "小图尺寸": "small"
};
var ORIENTATION_MAP = {
  "竖图": "vertical",
  "横图": "horizontal",
  "方图": "square"
};
var DEFAULT_NEGATIVE_PROMPT = "lowres, {bad}, error, fewer, extra, missing, worst quality, jpeg artifacts, bad quality, watermark, unfinished, displeasing, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]";
function isV4Model(model) {
  return model.includes("nai-diffusion-4");
}
__name(isV4Model, "isV4Model");
function hasArtistTag(prompt) {
  const artistPatterns = [
    "artist:",
    "artist ",
    "{artist",
    "[artist",
    "【artist",
    // 添加大写版本
    "ARTIST:",
    "ARTIST ",
    "{ARTIST",
    "[ARTIST",
    "【ARTIST",
    // 添加首字母大写版本
    "Artist:",
    "Artist ",
    "{Artist",
    "[Artist",
    "【Artist"
  ];
  return artistPatterns.some((pattern) => prompt.includes(pattern));
}
__name(hasArtistTag, "hasArtistTag");
function extractOrientation(text) {
  let orientation = "竖图";
  let processedText = text;
  if (processedText.match(/(?:^|\s)(横图)(?:\s|$)/)) {
    orientation = "横图";
    processedText = processedText.replace(/(?:^|\s)横图(?:\s|$)/, " ").trim();
  } else if (processedText.match(/(?:^|\s)(方图)(?:\s|$)/)) {
    orientation = "方图";
    processedText = processedText.replace(/(?:^|\s)方图(?:\s|$)/, " ").trim();
  } else if (processedText.match(/(?:^|\s)(竖图)(?:\s|$)/)) {
    orientation = "竖图";
    processedText = processedText.replace(/(?:^|\s)竖图(?:\s|$)/, " ").trim();
  } else if (processedText.match(/(?:^|\s)(横)(?:\s|$)/)) {
    orientation = "横图";
    processedText = processedText.replace(/(?:^|\s)横(?:\s|$)/, " ").trim();
  } else if (processedText.match(/(?:^|\s)(方)(?:\s|$)/)) {
    orientation = "方图";
    processedText = processedText.replace(/(?:^|\s)方(?:\s|$)/, " ").trim();
  } else if (processedText.match(/(?:^|\s)(竖)(?:\s|$)/)) {
    orientation = "竖图";
    processedText = processedText.replace(/(?:^|\s)竖(?:\s|$)/, " ").trim();
  }
  return { orientation, processedText };
}
__name(extractOrientation, "extractOrientation");
function cleanPrompt(prompt) {
  let cleanedPrompt = prompt.replace(/\\/g, "");
  cleanedPrompt = cleanedPrompt.replace(/<lora:[^:]+:[^>]+>/g, "");
  cleanedPrompt = cleanedPrompt.replace(/\s*,\s*/g, ", ");
  cleanedPrompt = cleanedPrompt.replace(/,\s*,+/g, ",");
  cleanedPrompt = cleanedPrompt.replace(/,\s*$/, "");
  cleanedPrompt = cleanedPrompt.replace(/\s+/g, " ").trim();
  if (!cleanedPrompt.endsWith(",")) {
    cleanedPrompt += ", ";
  }
  return cleanedPrompt;
}
__name(cleanPrompt, "cleanPrompt");
var Config = import_koishi.Schema.intersect([
  import_koishi.Schema.object({
    apiKeys: import_koishi.Schema.array(String).required().description("API密钥列表 (可添加多个Key同时处理多张图片)").role("table"),
    defaultSizeCategory: import_koishi.Schema.union(["标准尺寸", "大图尺寸", "壁纸尺寸", "小图尺寸"]).default("标准尺寸").description("默认尺寸类别"),
    defaultOrientation: import_koishi.Schema.union(["竖图", "横图", "方图"]).default("竖图").description("默认图片方向"),
    model: import_koishi.Schema.union(Object.keys(MODEL_MAP)).default("NAI Diffusion V4 完整版").description("默认使用的模型"),
    enableLargeSize: import_koishi.Schema.boolean().default(false).description("是否启用大图尺寸(消耗更多点数)").role("switch"),
    enableWallpaperSize: import_koishi.Schema.boolean().default(false).description("是否启用壁纸尺寸(消耗更多点数)").role("switch")
  }).description("基础设置"),
  import_koishi.Schema.object({
    artistPrompts: import_koishi.Schema.array(String).default([]).description("画师提示词列表 (随机选择其中一个添加到提示词前面)").role("table"),
    negativePrompt: import_koishi.Schema.string().default(DEFAULT_NEGATIVE_PROMPT).description("默认负面提示词").role("textarea"),
    sampler: import_koishi.Schema.union([
      ...SAMPLERS.v4,
      ...SAMPLERS.v3.filter((s) => !SAMPLERS.v4.includes(s))
    ]).default("k_euler_ancestral").description("采样器 (根据模型自动调整可用选项)"),
    cfgScale: import_koishi.Schema.number().default(5).min(1).max(10).step(0.5).description("提示词相关性 (01-10)"),
    steps: import_koishi.Schema.number().default(23).min(1).max(50).step(1).description("生成步数 (01-50)"),
    noiseSchedule: import_koishi.Schema.union([
      ...NOISE_SCHEDULES.v4,
      ...NOISE_SCHEDULES.v3.filter((n) => !NOISE_SCHEDULES.v4.includes(n))
    ]).default("karras").description("噪声调度 (根据模型自动调整可用选项)")
  }).description("高级设置"),
  import_koishi.Schema.object({
    useForwardMessage: import_koishi.Schema.boolean().default(false).description("使用合并转发发送图片").role("switch"),
    autoRecall: import_koishi.Schema.boolean().default(false).description("自动撤回生成的图片").role("switch").description("启用后可以设置自动撤回延迟时间"),
    recallDelay: import_koishi.Schema.number().default(50).min(10).max(120).step(1).description("自动撤回延迟时间(秒)").disabled(true),
    contentMode: import_koishi.Schema.union(CONTENT_MODES).default("仅图片").description("发送内容模式")
  }).description("特殊功能")
]).description(`NovelAi绘画第三方平台

→ 点击获取 API Key: https://www.loliy.top/

价格实惠`);
function apply(ctx) {
  const userModels = /* @__PURE__ */ new Map();
  const drawingQueue = [];
  let isProcessing = false;
  const usersSentProcessingMessage = /* @__PURE__ */ new Set();
  const processingKeys = /* @__PURE__ */ new Set();
  function addToQueue(session, prompt, orientation, sizeCategory, modelOverride) {
    const queueItem = {
      userId: session.userId,
      userName: session.username || session.userId,
      timestamp: Date.now(),
      prompt,
      orientation,
      sizeCategory,
      modelOverride,
      session,
      isProcessing: false
    };
    drawingQueue.push(queueItem);
    processQueue();
    return drawingQueue.length;
  }
  __name(addToQueue, "addToQueue");
  async function processQueue() {
    if (drawingQueue.length === 0) return;
    const availableKeys = ctx.config.apiKeys.filter((key) => !processingKeys.has(key));
    if (availableKeys.length === 0) return;
    const pendingItems = drawingQueue.filter((item) => !item.isProcessing);
    if (pendingItems.length === 0) return;
    const processingPromises = availableKeys.map(async (apiKey, index) => {
      if (index >= pendingItems.length) return;
      const nextItem = pendingItems[index];
      nextItem.isProcessing = true;
      processingKeys.add(apiKey);
      try {
        if (Date.now() - nextItem.timestamp > 5 * 60 * 1e3) {
          removeFromQueue(nextItem);
          processingKeys.delete(apiKey);
          return;
        }
        const currentOrientation = nextItem.orientation || ctx.config.defaultOrientation;
        const currentSizeCategory = nextItem.sizeCategory || ctx.config.defaultSizeCategory;
        const size = SIZES[SIZE_CATEGORY_MAP[currentSizeCategory]][ORIENTATION_MAP[currentOrientation]];
        let modelName = "默认模型";
        if (nextItem.modelOverride) {
          modelName = Object.entries(AVAILABLE_MODELS).find(([key, value]) => key === nextItem.modelOverride)?.[1] || "自定义模型";
        } else if (userModels.get(nextItem.userId)) {
          modelName = Object.entries(MODEL_MAP).find(([name2, key]) => key === userModels.get(nextItem.userId))?.[0] || "自定义模型";
        } else {
          modelName = ctx.config.model;
        }
        if (!usersSentProcessingMessage.has(nextItem.userId)) {
          await nextItem.session.send(`正在生成图片... (${size}, ${currentSizeCategory}, 模型: ${modelName})`);
          usersSentProcessingMessage.add(nextItem.userId);
        }
        await generateImage(nextItem, apiKey);
      } catch (error) {
        ctx.logger("loliy-novelai").error(error);
        nextItem.session.send("生成图片时发生错误");
      } finally {
        removeFromQueue(nextItem);
        processingKeys.delete(apiKey);
        if (drawingQueue.length === 0) {
          usersSentProcessingMessage.clear();
        }
      }
    });
    await Promise.all(processingPromises);
    if (drawingQueue.length > 0) {
      processQueue();
    }
  }
  __name(processQueue, "processQueue");
  function removeFromQueue(item) {
    const index = drawingQueue.findIndex((i) => i === item);
    if (index !== -1) {
      drawingQueue.splice(index, 1);
    }
  }
  __name(removeFromQueue, "removeFromQueue");
  async function generateImage(item, apiKey) {
    const { session, prompt, modelOverride } = item;
    let currentOrientation = item.orientation || ctx.config.defaultOrientation;
    let currentSizeCategory = item.sizeCategory || ctx.config.defaultSizeCategory;
    let finalPrompt = prompt;
    if (!hasArtistTag(prompt)) {
      if (ctx.config.artistPrompts && ctx.config.artistPrompts.length > 0) {
        const randomArtist = ctx.config.artistPrompts[Math.floor(Math.random() * ctx.config.artistPrompts.length)];
        if (randomArtist) {
          if (randomArtist.trim().endsWith(",")) {
            finalPrompt = `${randomArtist} ${prompt}`;
          } else {
            finalPrompt = `${randomArtist}, ${prompt}`;
          }
        }
      }
    }
    const internalOrientation = ORIENTATION_MAP[currentOrientation];
    const internalSizeCategory = SIZE_CATEGORY_MAP[currentSizeCategory];
    if (internalSizeCategory === "wallpaper" && internalOrientation === "square") {
      await session.send("壁纸尺寸不支持方图，将使用默认尺寸方图。");
      currentSizeCategory = "标准尺寸";
    } else if (internalSizeCategory === "large" && !ctx.config.enableLargeSize || internalSizeCategory === "wallpaper" && !ctx.config.enableWallpaperSize) {
      await session.send(`${currentSizeCategory}未启用，将使用默认尺寸继续生成。`);
      currentSizeCategory = "标准尺寸";
    }
    const size = SIZES[SIZE_CATEGORY_MAP[currentSizeCategory]][ORIENTATION_MAP[currentOrientation]];
    const [width, height] = size.split("x").map(Number);
    const model = modelOverride || userModels.get(item.userId) || MODEL_MAP[ctx.config.model];
    const sampler = getSamplerForModel(model, ctx.config.sampler);
    const noiseSchedule = getNoiseScheduleForModel(model, ctx.config.noiseSchedule);
    let modelName = "默认模型";
    if (modelOverride) {
      modelName = Object.entries(AVAILABLE_MODELS).find(([key, value]) => key === modelOverride)?.[1] || "自定义模型";
    } else if (userModels.get(item.userId)) {
      modelName = Object.entries(MODEL_MAP).find(([name2, key]) => key === userModels.get(item.userId))?.[0] || "自定义模型";
    } else {
      modelName = ctx.config.model;
    }
    const requestData = {
      token: apiKey,
      model,
      width,
      height,
      steps: ctx.config.steps,
      prompt: finalPrompt,
      n_prompt: ctx.config.negativePrompt,
      scale: ctx.config.cfgScale.toString(),
      auto: false,
      cfg_scale: "0",
      seed: "-1",
      sampler,
      SMEA: false,
      DYN: false,
      noise: noiseSchedule,
      img2: {
        img: "",
        noise: "0",
        strength: "0.7",
        typesetting: "1"
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
    const response = await ctx.http.post("https://apis.loliy.top/v1/images/generate", requestData, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });
    if (response?.status === "success" && response?.data?.[0]?.b64_json) {
      const imageData = response.data[0].b64_json;
      const seed = response.data[0].seed || "-1";
      let content;
      if (ctx.config.contentMode === "仅图片") {
        content = import_koishi.segment.image(imageData);
      } else {
        content = [
          import_koishi.segment.image(imageData),
          `
正面提示词: ${finalPrompt}`,
          `
负面提示词: ${ctx.config.negativePrompt}`,
          `
种子: ${seed}`,
          `
采样器: ${sampler}`,
          `
步数: ${ctx.config.steps}`,
          `
提示词相关性: ${ctx.config.cfgScale}`,
          `
噪声调度: ${noiseSchedule}`,
          `
尺寸: ${width}x${height}`
        ].join("");
      }
      let msg;
      if (ctx.config.useForwardMessage) {
        try {
          msg = await session.send(
            (0, import_jsx_runtime.jsx)("message", {
              forward: true,
              children: (0, import_jsx_runtime.jsx)("message", {
                userId: session.selfId,
                nickname: "生成的图片",
                children: content
              })
            })
          );
        } catch (error) {
          ctx.logger("loliy-novelai").warn("合并转发失败，将使用普通方式发送", error);
          msg = await session.send(content);
        }
      } else {
        msg = await session.send(import_koishi.h.quote(session.messageId) + content);
      }
      if (ctx.config.autoRecall && msg) {
        setTimeout(async () => {
          try {
            await session.bot.deleteMessage(session.channelId, msg);
          } catch (error) {
            ctx.logger("loliy-novelai").error("撤回消息失败", error);
          }
        }, ctx.config.recallDelay * 1e3);
      }
      return;
    } else {
      ctx.logger("loliy-novelai").error("生成图片失败");
      return "生成图片失败: " + (response.msg || "未知错误");
    }
  }
  __name(generateImage, "generateImage");
  function getSamplerForModel(model, configSampler) {
    if (isV4Model(model)) {
      return SAMPLERS.v4.includes(configSampler) ? configSampler : "k_euler_ancestral";
    } else {
      return configSampler;
    }
  }
  __name(getSamplerForModel, "getSamplerForModel");
  function getNoiseScheduleForModel(model, configNoiseSchedule) {
    if (isV4Model(model)) {
      return NOISE_SCHEDULES.v4.includes(configNoiseSchedule) ? configNoiseSchedule : "karras";
    } else {
      return configNoiseSchedule;
    }
  }
  __name(getNoiseScheduleForModel, "getNoiseScheduleForModel");
  function parseModelShortcut(text) {
    let modelOverride = null;
    let processedText = text;
    const modelKeywords = {
      "v4": "nai-diffusion-4-full",
      "v4c": "nai-diffusion-4-curated-preview",
      "v3": "nai-diffusion-3",
      "furry": "nai-diffusion-furry-3",
      "v3f": "nai-diffusion-furry-3"
    };
    for (const [keyword, modelId] of Object.entries(modelKeywords)) {
      const regex = new RegExp(`(?:^|\\s)(${keyword})(?:\\s|$)`);
      if (regex.test(processedText)) {
        modelOverride = modelId;
        processedText = processedText.replace(regex, " ").trim();
        break;
      }
    }
    return { modelOverride, processedText };
  }
  __name(parseModelShortcut, "parseModelShortcut");
  const cmd = ctx.command("loliy-novelai", "基于loliy API的AI画图插件").usage("获取Key请点击：https://www.loliy.top/").usage("NovelAi绘画第三方平台").usage("价格实惠").usage("").usage("支持生成各种尺寸的AI图片，包括标准尺寸、大图尺寸和壁纸尺寸");
  cmd.subcommand("画", "使用AI生成图片").alias("nai").usage("获取Key请点击：https://www.loliy.top/").usage("NovelAi绘画第三方平台").usage("价格实惠").usage("").usage("在描述文本中可以包含以下关键词来控制图片尺寸：").usage("- 横图/方图：控制图片方向").usage("- 大图/壁纸：使用特殊尺寸（需要在配置中启用）").example("画 横图 1girl, ").example("画 v4 方图 1girl,  大图").action(async ({ session }, ...args) => {
    const text = args.join(" ");
    const { modelOverride, processedText } = parseModelShortcut(text);
    let sizeCategory = "标准尺寸";
    let finalText = processedText;
    if (finalText.includes("大图")) {
      sizeCategory = "大图尺寸";
      finalText = finalText.replace("大图", "").trim();
    } else if (finalText.includes("壁纸")) {
      sizeCategory = "壁纸尺寸";
      finalText = finalText.replace("壁纸", "").trim();
    }
    const { orientation, processedText: textWithoutOrientation } = extractOrientation(finalText);
    finalText = textWithoutOrientation;
    finalText = cleanPrompt(finalText);
    const position = addToQueue(session, finalText, orientation, sizeCategory, modelOverride);
    if (position > 1) {
      return `您当前排在第 ${position} 位，请稍候。
前面还有 ${position - 1} 个请求在等待处理。`;
    }
    return processQueue();
  });
  cmd.subcommand("绘画菜单", "查询绘画功能").alias("绘画功能").action(async ({ session }) => {
    return [
      "=== AI绘画功能菜单 ===",
      "基础命令：",
      "- 画 <描述文本> - 生成AI图片",
      "- nai <描述文本> - 生成AI图片（别名）",
      "",
      "方向控制：",
      "- 横图/横：生成横向图片",
      "- 方图/方：生成方形图片",
      "- 竖图/竖：生成竖向图片（默认）",
      "",
      "可用模型：",
      "- v4：NAI Diffusion V4 完整版",
      "- v4c：NAI Diffusion V4 先行版",
      "- v3：NAI Diffusion Anime V3",
      "- furry/v3f：NAI Diffusion Furry V3",
      "",
      "特殊尺寸：",
      "- 大图：使用更大尺寸（需要在配置中启用）",
      "- 壁纸：使用壁纸尺寸（需要在配置中启用）",
      "",
      "示例：",
      "画 v4c 横 1girl, ",
      "nai 方 v3 1girl, ",
      "画 壁纸 furry 竖 1girl, ",
      "",
      "提示：所有关键词位置随意，互不影响"
    ].join("\n");
  });
}
__name(apply, "apply");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Config,
  apply,
  name
});
