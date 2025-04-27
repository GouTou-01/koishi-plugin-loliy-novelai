import { Context, Schema, segment, h } from 'koishi'
import * as element from '@satorijs/element'
import { Buffer } from 'buffer'

const { jsx } = element

export const name = 'loliy-novelai'

export const usage = `
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
`

// 定义可用的模型
const AVAILABLE_MODELS = {
  'nai-diffusion-4-full': 'NAI Diffusion V4 完整版',
  'nai-diffusion-4-curated-preview': 'NAI Diffusion V4 先行版',
  'nai-diffusion-3': 'NAI Diffusion Anime V3',
  'nai-diffusion-furry-3': 'NAI Diffusion Furry V3'
} as const

// 添加模型映射
const MODEL_MAP = {
  'NAI Diffusion V4 完整版': 'nai-diffusion-4-full',
  'NAI Diffusion V4 先行版': 'nai-diffusion-4-curated-preview',
  'NAI Diffusion Anime V3': 'nai-diffusion-3',
  'NAI Diffusion Furry V3': 'nai-diffusion-furry-3'
} as const

// 定义采样器选项 - 按模型分组
const SAMPLERS = {
  v4: [
    'k_euler_ancestral', // 默认
    'k_euler',
    'k_dpmpp_2s_ancestral',
    'k_dpmpp_2m_sde',
    'k_dpmpp_2m',
    'k_dpmpp_sde'
  ] as const,
  v3: [
    'k_euler_ancestral', // 默认
    'k_euler',
    'k_dpmpp_2s_ancestral',
    'k_dpmpp_2m_sde',
    'k_dpmpp_2m',
    'k_dpmpp_sde',
    'ddim_v3'
  ] as const
} as const

// 定义噪声调度选项 - 按模型分组
const NOISE_SCHEDULES = {
  v4: [
    'karras', // 默认
    'exponential',
    'polyexponential'
  ] as const,
  v3: [
    'karras', // 默认
    'native',
    'exponential',
    'polyexponential'
  ] as const
} as const

// 定义发送内容模式
const CONTENT_MODES = [
  '仅图片',
  '详细模式'
] as const

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
} as const

type ModelType = keyof typeof MODEL_MAP
type SizeCategory = keyof typeof SIZES
type SizeType = typeof SIZES[keyof typeof SIZES][keyof typeof SIZES[keyof typeof SIZES]]
type SamplerTypeV4 = typeof SAMPLERS.v4[number]
type SamplerTypeV3 = typeof SAMPLERS.v3[number]
type SamplerType = SamplerTypeV4 | SamplerTypeV3
type NoiseScheduleTypeV4 = typeof NOISE_SCHEDULES.v4[number]
type NoiseScheduleTypeV3 = typeof NOISE_SCHEDULES.v3[number]
type NoiseScheduleType = NoiseScheduleTypeV4 | NoiseScheduleTypeV3
type ContentModeType = typeof CONTENT_MODES[number]

// 定义尺寸类别类型
type SizeCategoryType = '标准尺寸' | '大图尺寸' | '壁纸尺寸' | '小图尺寸'
type OrientationType = '竖图' | '横图' | '方图'

// 尺寸类别映射
const SIZE_CATEGORY_MAP = {
  '标准尺寸': 'normal',
  '大图尺寸': 'large',
  '壁纸尺寸': 'wallpaper',
  '小图尺寸': 'small'
} as const

// 方向映射
const ORIENTATION_MAP = {
  '竖图': 'vertical',
  '横图': 'horizontal',
  '方图': 'square'
} as const

// 默认负面提示词
const DEFAULT_NEGATIVE_PROMPT = 'lowres, {bad}, error, fewer, extra, missing, worst quality, jpeg artifacts, bad quality, watermark, unfinished, displeasing, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]'

// 判断模型是否为V4
function isV4Model(model: string): boolean {
  return model.includes('nai-diffusion-4')
}

// 添加检测画师标签的函数
function hasArtistTag(prompt: string): boolean {
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
  ]
  
  // 直接检查是否包含任何一种格式,不转换大小写
  return artistPatterns.some(pattern => prompt.includes(pattern))
}

// 改进方向关键词检测
function extractOrientation(text: string): { orientation: OrientationType, processedText: string } {
  let orientation: OrientationType = '竖图';
  let processedText = text;
  
  // 检查完整词 - 使用更严格的匹配
  if (processedText.match(/(?:^|\s)(横图)(?:\s|$)/)) {
    orientation = '横图';
    processedText = processedText.replace(/(?:^|\s)横图(?:\s|$)/, ' ').trim();
  } else if (processedText.match(/(?:^|\s)(方图)(?:\s|$)/)) {
    orientation = '方图';
    processedText = processedText.replace(/(?:^|\s)方图(?:\s|$)/, ' ').trim();
  } else if (processedText.match(/(?:^|\s)(竖图)(?:\s|$)/)) {
    orientation = '竖图';
    processedText = processedText.replace(/(?:^|\s)竖图(?:\s|$)/, ' ').trim();
  }
  // 检查简短形式
  else if (processedText.match(/(?:^|\s)(横)(?:\s|$)/)) {
    orientation = '横图';
    processedText = processedText.replace(/(?:^|\s)横(?:\s|$)/, ' ').trim();
  } else if (processedText.match(/(?:^|\s)(方)(?:\s|$)/)) {
    orientation = '方图';
    processedText = processedText.replace(/(?:^|\s)方(?:\s|$)/, ' ').trim();
  } else if (processedText.match(/(?:^|\s)(竖)(?:\s|$)/)) {
    orientation = '竖图';
    processedText = processedText.replace(/(?:^|\s)竖(?:\s|$)/, ' ').trim();
  }
  
  return { orientation, processedText };
}

// 改进提示词处理函数
function cleanPrompt(prompt: string): string {
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

// 添加一个格式化提示词结尾的函数
function formatPromptEnding(prompt: string): string {
  // 先清理末尾的空白字符
  let cleaned = prompt.trim();
  
  // 替换中文逗号、句号、顿号等为英文逗号+空格
  if (cleaned.endsWith('，') || cleaned.endsWith('。') || 
      cleaned.endsWith('、') || cleaned.endsWith('；')) {
    return cleaned.slice(0, -1) + ', ';
  }
  
  // 如果已经以英文逗号+空格结尾，保持不变
  if (cleaned.endsWith(', ')) {
    return cleaned;
  }
  
  // 如果以英文逗号结尾但没有空格，添加空格
  if (cleaned.endsWith(',')) {
    return cleaned + ' ';
  }
  
  // 处理以其他英文标点结尾的情况 - 将它们替换为逗号+空格
  if (cleaned.endsWith('.') || cleaned.endsWith(';') || 
      cleaned.endsWith(':') || cleaned.endsWith('!') || 
      cleaned.endsWith('?')) {
    return cleaned.slice(0, -1) + ', ';
  }
  
  // 如果没有标点结尾，添加逗号+空格
  return cleaned + ', ';
}

export interface Config {
  apiType: 'loliy' | 'hua'
  apiKeys: string[]
  huaAuthKeys: string[]
  huaNaiKeys: string[]
  defaultSizeCategory: SizeCategoryType
  defaultOrientation: OrientationType
  model: ModelType
  enableLargeSize: boolean
  enableWallpaperSize: boolean
  enableArtistPrompts: boolean
  artistPrompts: string[]
  enableDefaultPrompt: boolean
  defaultPrompt: string
  negativePrompt: string
  sampler: SamplerType
  cfgScale: number
  steps: number
  noiseSchedule: NoiseScheduleType
  useForwardMessage: boolean
  autoRecall: boolean
  recallDelay: number
  contentMode: ContentModeType
  enableTranslation: boolean
  showTranslationResult: boolean
  maxRetries: number
  retryDelay: number
  enableDailyLimit: boolean
  dailyLimit: number
  whitelistUsers: string[]
  useHuaCache: boolean
}

export const Config = Schema.intersect([
  Schema.object({
    apiType: Schema.union(['loliy', 'hua'] as const)
      .default('loliy')
      .description('选择使用的 API (loliy 或 hua，注意：hua仅支持标准尺寸)'),
    apiKeys: Schema.array(String)
      .required()
      .description('Loliy API密钥列表 (可添加多个Key同时处理多张图片)')
      .role('table'),
    huaAuthKeys: Schema.array(String)
      .default([])
      .description('Hua API授权密钥列表')
      .role('table'),
    huaNaiKeys: Schema.array(String)
      .default([])
      .description('Hua API官方密钥列表 (可选)')
      .role('table'),
    useHuaCache: Schema.boolean()
      .default(false)
      .description('是否使用Hua API的服务器缓存 (默认关闭=不使用缓存，开启=使用缓存)')
      .role('switch'),
    defaultSizeCategory: Schema.union(['标准尺寸', '大图尺寸', '壁纸尺寸', '小图尺寸'] as const)
      .default('标准尺寸')
      .description('默认尺寸类别'),
    defaultOrientation: Schema.union(['竖图', '横图', '方图'] as const)
      .default('竖图')
      .description('默认图片方向'),
    model: Schema.union(Object.keys(MODEL_MAP) as ModelType[])
      .default('NAI Diffusion V4 完整版')
      .description('默认使用的模型'),
    enableLargeSize: Schema.boolean()
      .default(false)
      .description('是否启用大图尺寸(消耗更多点数，仅Loliy API支持)')
      .role('switch'),
    enableWallpaperSize: Schema.boolean()
      .default(false)
      .description('是否启用壁纸尺寸(消耗更多点数，仅Loliy API支持)')
      .role('switch'),
  }).description('基础设置'),
  
  Schema.object({
    enableArtistPrompts: Schema.boolean()
      .default(true)
      .description('是否启用随机画师提示词')
      .role('switch'),
    artistPrompts: Schema.array(String)
      .default([])
      .description('画师提示词列表 (随机选择其中一个添加到提示词前面)')
      .role('table'),
    enableDefaultPrompt: Schema.boolean()
      .default(false)
      .description('是否启用质量提示词')
      .role('switch'),
    defaultPrompt: Schema.string()
      .default('best quality, very aesthetic, absurdres')
      .description('质量提示词(会添加到用户输入的后面)')
      .role('textarea'),
    negativePrompt: Schema.string()
      .default(DEFAULT_NEGATIVE_PROMPT)
      .description('默认负面提示词')
      .role('textarea'),
    sampler: Schema.union([
      ...SAMPLERS.v4,
      ...(SAMPLERS.v3.filter(s => !SAMPLERS.v4.includes(s as any)) as any)
    ] as const)
      .default('k_euler_ancestral')
      .description('采样器 (根据模型自动调整可用选项)'),
    cfgScale: Schema.number()
      .default(5)
      .min(1)
      .max(10)
      .step(0.5)
      .description('提示词相关性 (01-10)'),
    steps: Schema.number()
      .default(23)
      .min(1)
      .max(50)
      .step(1)
      .description('生成步数 (01-50)'),
    noiseSchedule: Schema.union([
      ...NOISE_SCHEDULES.v4,
      ...(NOISE_SCHEDULES.v3.filter(n => !NOISE_SCHEDULES.v4.includes(n as any)) as any)
    ] as const)
      .default('karras')
      .description('噪声调度 (根据模型自动调整可用选项)')
  }).description('高级设置'),
  
  Schema.object({
    useForwardMessage: Schema.boolean()
      .default(false)
      .description('使用合并转发发送图片')
      .role('switch'),
    autoRecall: Schema.boolean()
      .default(false)
      .description('自动撤回生成的图片')
      .role('switch')
      .description('启用后可以设置自动撤回延迟时间'),
    recallDelay: Schema.number()
      .default(50)
      .min(10)
      .max(120)
      .step(1)
      .description('自动撤回延迟时间(秒)')
      .disabled(true),
    contentMode: Schema.union(CONTENT_MODES)
      .default('仅图片')
      .description('发送内容模式'),
    enableTranslation: Schema.boolean()
      .default(false)
      .description('是否启用提示词自动翻译(中文→英文)')
      .role('switch'),
    showTranslationResult: Schema.boolean()
      .default(true)
      .description('是否显示翻译结果')
      .role('switch'),
  }).description('特殊功能'),
  
  Schema.object({
    maxRetries: Schema.number()
      .default(3)
      .description('API请求失败时的最大重试次数'),
    retryDelay: Schema.number()
      .default(1000)
      .description('重试之间的延迟时间(毫秒)')
  }).description('重试设置'),
  
  Schema.object({
    enableDailyLimit: Schema.boolean()
      .default(false)
      .description('是否启用每日绘图次数限制')
      .role('switch'),
    dailyLimit: Schema.number()
      .default(30)
      .min(1)
      .max(1000)
      .step(1)
      .description('每个用户每日最大绘图次数 (仅在启用每日限制时生效)'),
    whitelistUsers: Schema.array(String)
      .default([])
      .description('白名单用户ID列表 (这些用户不受每日限制，仅在启用每日限制时生效)')
      .role('table')
  }).description('用户限制')
])

export function apply(ctx: Context) {
  // 存储用户选择的模型
  const userModels = new Map<string, string>()
  
  // 修改队列项接口
  interface QueueItem {
    userId: string
    userName: string
    timestamp: number
    prompt: string
    orientation?: OrientationType
    sizeCategory?: SizeCategoryType
    modelOverride?: string | null
    session: any
    isProcessing: boolean
  }
  
  const drawingQueue: QueueItem[] = []
  let isProcessing = false

  // 添加一个集合来跟踪已经发送过处理提示的用户
  const usersSentProcessingMessage = new Set<string>()

  // 添加处理中的Key记录
  const processingKeys = new Set<string>()

  // 添加用户每日使用次数记录
  const userDailyUsage = new Map<string, { count: number, date: string }>()
  
  // 获取当前日期字符串 (YYYY-MM-DD 格式)
  function getCurrentDate(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }
  
  // 检查用户是否可以使用绘图功能
  function canUserDraw(userId: string): boolean {
    // 如果未启用每日限制，直接返回 true
    if (!ctx.config.enableDailyLimit) {
      return true
    }
    
    // 检查是否在白名单中
    if (ctx.config.whitelistUsers.includes(userId)) {
      return true
    }
    
    const currentDate = getCurrentDate()
    const userUsage = userDailyUsage.get(userId)
    
    // 如果没有记录或者日期不是今天，重置计数
    if (!userUsage || userUsage.date !== currentDate) {
      userDailyUsage.set(userId, { count: 0, date: currentDate })
      return true
    }
    
    // 检查是否超过每日限制
    return userUsage.count < ctx.config.dailyLimit
  }
  
  // 增加用户使用次数
  function incrementUserUsage(userId: string): void {
    const currentDate = getCurrentDate()
    const userUsage = userDailyUsage.get(userId) || { count: 0, date: currentDate }
    
    // 如果日期不是今天，重置计数
    if (userUsage.date !== currentDate) {
      userUsage.count = 1
      userUsage.date = currentDate
    } else {
      userUsage.count++
    }
    
    userDailyUsage.set(userId, userUsage)
  }
  
  // 获取用户剩余次数
  function getUserRemainingDraws(userId: string): number {
    // 如果未启用每日限制，返回无限
    if (!ctx.config.enableDailyLimit) {
      return Infinity
    }
    
    // 白名单用户无限制
    if (ctx.config.whitelistUsers.includes(userId)) {
      return Infinity
    }
    
    const currentDate = getCurrentDate()
    const userUsage = userDailyUsage.get(userId)
    
    // 如果没有记录或者日期不是今天
    if (!userUsage || userUsage.date !== currentDate) {
      return ctx.config.dailyLimit
    }
    
    return Math.max(0, ctx.config.dailyLimit - userUsage.count)
  }

  // 添加一个检测文本是否包含中文的函数
  function containsChinese(text: string): boolean {
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
  async function translateText(text: string): Promise<string> {
    // 创建一个缓存对象，用于存储翻译结果
    // 静态对象，保持在插件生命周期内
    if (!translateText['cache']) {
      translateText['cache'] = new Map<string, string>();
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      ctx.logger('loliy-novelai').warn(`翻译失败: ${errorMessage}`);
      return text;
    }
  }

  // 修改添加到队列的函数
  function addToQueue(
    session: any, 
    prompt: string, 
    orientation?: OrientationType, 
    sizeCategory?: SizeCategoryType,
    modelOverride?: string | null
  ): number {
    const userId = session.userId
    
    // 检查用户是否可以使用绘图功能
    if (!canUserDraw(userId)) {
      throw new Error(`您今日的绘图次数已用完，每日限制${ctx.config.dailyLimit}次。请明天再试。`)
    }
    
    // 直接使用用户输入的提示词，generateImage函数中会按照画师提示词 -> 用户输入 -> 质量提示词的顺序处理
    let finalPrompt = prompt
    
    // 增加用户使用次数
    incrementUserUsage(userId)
    
    const queueItem: QueueItem = {
      userId: userId,
      userName: session.username || userId,
      timestamp: Date.now(),
      prompt: finalPrompt,
      orientation,
      sizeCategory,
      modelOverride,
      session,
      isProcessing: false
    }
    
    drawingQueue.push(queueItem)
    
    // 尝试处理队列
    processQueue()
    
    return drawingQueue.length
  }

  // 修改队列处理函数，添加队列处理间隔来避免翻译API的频率限制
  async function processQueue() {
    // 如果队列为空，直接返回
    if (drawingQueue.length === 0) return;
    
    let availableKeys: string[] = []
    
    // 根据API类型选择合适的密钥
    if (ctx.config.apiType === 'hua') {
      availableKeys = ctx.config.huaAuthKeys.filter(key => !processingKeys.has(key))
    } else {
      availableKeys = ctx.config.apiKeys.filter(key => !processingKeys.has(key))
    }
    
    if (availableKeys.length === 0) return; // 所有Key都在处理中
    
    // 获取所有未处理的请求
    const pendingItems = drawingQueue.filter(item => !item.isProcessing);
    if (pendingItems.length === 0) return; // 所有请求都在处理中

    // 为每个可用的Key分配一个未处理的请求
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
            removeFromQueue(nextItem)
            processingKeys.delete(apiKey)
            await nextItem.session.send('请求超时，已自动取消。请重新发送绘图指令。')
            return
          }

          // 计算尺寸和模型名称
          let currentOrientation = nextItem.orientation || ctx.config.defaultOrientation
          let currentSizeCategory = nextItem.sizeCategory || ctx.config.defaultSizeCategory
          
          // 如果是 Hua API，强制使用标准尺寸
          if (ctx.config.apiType === 'hua' && currentSizeCategory !== '标准尺寸') {
            await nextItem.session.send('Hua API 仅支持标准尺寸，将使用标准尺寸继续生成。')
            currentSizeCategory = '标准尺寸' as const
          }
          
          // 转换为内部使用的值
          const internalOrientation = ORIENTATION_MAP[currentOrientation]
          const internalSizeCategory = SIZE_CATEGORY_MAP[currentSizeCategory]
          
          // 检查壁纸模式下的方图请求
          if (internalSizeCategory === 'wallpaper' && internalOrientation === 'square') {
            await nextItem.session.send('壁纸尺寸不支持方图，将使用默认尺寸方图。')
            currentSizeCategory = '标准尺寸' as const
          }
          // 验证尺寸类型是否可用
          else if ((internalSizeCategory === 'large' && !ctx.config.enableLargeSize) || 
              (internalSizeCategory === 'wallpaper' && !ctx.config.enableWallpaperSize)) {
            await nextItem.session.send(`${currentSizeCategory}未启用，将使用默认尺寸继续生成。`)
            currentSizeCategory = '标准尺寸' as const
          }

          const size = SIZES[SIZE_CATEGORY_MAP[currentSizeCategory]][ORIENTATION_MAP[currentOrientation]]
          const [width, height] = size.split('x').map(Number)

          // 获取模型名称
          let modelName = '默认模型'
          if (nextItem.modelOverride) {
            modelName = Object.entries(AVAILABLE_MODELS).find(([key, value]) => key === nextItem.modelOverride)?.[1] || '自定义模型'
          } else if (userModels.get(nextItem.userId)) {
            modelName = Object.entries(MODEL_MAP)
              .find(([name, key]) => key === userModels.get(nextItem.userId))?.[0] || '自定义模型'
          } else {
            modelName = ctx.config.model
          }

          // 只有用户的第一个请求才发送处理提示
          if (!usersSentProcessingMessage.has(nextItem.userId)) {
            const apiTypeText = ctx.config.apiType === 'hua' ? 'Hua' : 'Loliy'
            await nextItem.session.send(`正在使用${apiTypeText} API生成图片... (${size}, ${currentSizeCategory}, 模型: ${modelName})`)
            usersSentProcessingMessage.add(nextItem.userId)
          }

          // 处理图片生成的核心逻辑
          await generateImage(nextItem, apiKey)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '未知错误'
          ctx.logger('loliy-novelai').error(error)
          await nextItem.session.send(errorMessage)
        } finally {
          // 移除已处理的请求
          removeFromQueue(nextItem)
          processingKeys.delete(apiKey)
          
          // 如果队列中还有未处理的请求，继续处理队列
          if (drawingQueue.length > 0) {
            // 添加短暂延迟后继续处理队列，避免连续翻译
            setTimeout(() => processQueue(), 1000)
          } else {
            // 队列为空，清空已发送处理提示的用户集合
            usersSentProcessingMessage.clear()
          }
        }
      }

      // 使用setTimeout来延迟执行，但返回Promise
      setTimeout(() => processRequest(), randomDelay)
    }
  }

  // 从队列中移除项目
  function removeFromQueue(item: QueueItem) {
    const index = drawingQueue.findIndex(i => i === item)
    if (index !== -1) {
      drawingQueue.splice(index, 1)
    }
  }

  // 添加延迟函数
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  // 修改图片生成函数，接收API Key
  async function generateImage(item: QueueItem, apiKey: string) {
    let retries = 0
    let requestData: any
    let lastError: Error | null = null
    
    while (retries < ctx.config.maxRetries) {
      try {
        const { session, prompt, modelOverride } = item
        let currentOrientation = item.orientation || ctx.config.defaultOrientation
        let currentSizeCategory = item.sizeCategory || ctx.config.defaultSizeCategory

        // 用户输入的提示词
        let userPrompt = prompt
        
        // 0. 如果启用了翻译，先进行翻译
        if (ctx.config.enableTranslation) {
          if (containsChinese(userPrompt)) {
            const translatedPrompt = await translateText(userPrompt)
            
            if (translatedPrompt && translatedPrompt !== userPrompt) {
              if (ctx.config.showTranslationResult) {
                await session.send(`已将提示词翻译为: ${translatedPrompt}`)
              }
              userPrompt = translatedPrompt
            }
          } else {
            ctx.logger('loliy-novelai').debug('提示词不包含中文，跳过翻译')
          }
        }
        
        // 格式化用户提示词结尾
        userPrompt = formatPromptEnding(userPrompt)
        
        // 组合最终提示词的各部分
        let finalPromptParts = []
        let artistPrompt = ''
        
        // 1. 处理画师提示词
        if (ctx.config.enableArtistPrompts && !hasArtistTag(userPrompt)) {
          if (ctx.config.artistPrompts && ctx.config.artistPrompts.length > 0) {
            artistPrompt = ctx.config.artistPrompts[Math.floor(Math.random() * ctx.config.artistPrompts.length)]
            if (artistPrompt) {
              finalPromptParts.push(formatPromptEnding(artistPrompt))
            }
          }
        }
        
        // 2. 添加用户提示词
        finalPromptParts.push(userPrompt)
        
        // 3. 处理质量提示词
        if (ctx.config.enableDefaultPrompt && ctx.config.defaultPrompt.trim()) {
          const qualityPrompt = ctx.config.defaultPrompt.trim()
          finalPromptParts.push(formatPromptEnding(qualityPrompt))
        }
        
        // 组合最终提示词，移除最后一个部分的结尾逗号和空格
        let finalPrompt = finalPromptParts.join('').trim()
        if (finalPrompt.endsWith(', ')) {
          finalPrompt = finalPrompt.slice(0, -2)
        }

        // 转换为内部使用的值
        const internalOrientation = ORIENTATION_MAP[currentOrientation]
        const internalSizeCategory = SIZE_CATEGORY_MAP[currentSizeCategory]

        // 获取对应尺寸
        const size = SIZES[SIZE_CATEGORY_MAP[currentSizeCategory]][ORIENTATION_MAP[currentOrientation]]
        const [width, height] = size.split('x').map(Number)

        // 使用模型覆盖或用户选择的模型或默认模型
        const model = modelOverride || userModels.get(item.userId) || MODEL_MAP[ctx.config.model]

        // 根据模型选择适合的采样器和噪声调度
        const sampler = getSamplerForModel(model, ctx.config.sampler)
        const noiseSchedule = getNoiseScheduleForModel(model, ctx.config.noiseSchedule)

        let imageContent: string | segment
        let seed: string = '-1'

        // 根据选择的API类型进行不同的处理
        if (ctx.config.apiType === 'hua') {
          // 检查是否有可用的授权密钥
          if (!ctx.config.huaAuthKeys.length) {
            throw new Error('未配置Hua API授权密钥')
          }

          // 构建Hua API的URL
          const huaUrl = new URL('https://hua.shigure.top/generate')
          huaUrl.searchParams.set('sq', apiKey)
          
          if (ctx.config.huaNaiKeys.length > 0) {
            const naiKey = ctx.config.huaNaiKeys[Math.floor(Math.random() * ctx.config.huaNaiKeys.length)]
            if (naiKey) huaUrl.searchParams.set('nai-key', naiKey)
          }

          huaUrl.searchParams.set('model', model)
          huaUrl.searchParams.set('artist', artistPrompt)
          huaUrl.searchParams.set('tag', finalPrompt)
          huaUrl.searchParams.set('negative', ctx.config.negativePrompt)
          huaUrl.searchParams.set('size', currentOrientation)
          huaUrl.searchParams.set('sampler', sampler)
          huaUrl.searchParams.set('noise_schedule', noiseSchedule)
          
          if (!ctx.config.useHuaCache) {
            huaUrl.searchParams.set('nocache', '1')
          }

          // Hua API 直接返回图片URL，直接使用segment.image
          imageContent = segment.image(huaUrl.toString())
          
        } else {
          // Loliy API 处理逻辑
          requestData = {
            token: apiKey,
            model,
            width,
            height,
            steps: ctx.config.steps,
            prompt: finalPrompt,
            n_prompt: ctx.config.negativePrompt,
            scale: ctx.config.cfgScale.toString(),
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
          }

          const response = await ctx.http.post('https://apis.loliy.top/v1/images/generate', requestData, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000
          })

          if (!response) {
            throw new Error('API返回为空')
          }

          if (response.status === 'success' && response.data?.[0]) {
            // 使用直接URL而不是base64
            if (response.data[0].url) {
              imageContent = segment.image(response.data[0].url)
            } else if (response.data[0].b64_json) {
              // 如果没有URL，回退到使用base64
              imageContent = segment.image('data:image/png;base64,' + response.data[0].b64_json)
            } else {
              throw new Error('API返回中没有图片数据')
            }
            seed = response.data[0].seed || '-1'
          } else {
            const errorMessage = response.msg || 
              (response.error?.message || response.error) || 
              JSON.stringify(response) || 
              '未知错误'
            throw new Error(`生成图片失败: ${errorMessage}`)
          }
        }
        
        // 准备发送的内容
        let content
        
        if (ctx.config.contentMode === '仅图片') {
          content = imageContent
        } else {
          content = [
            imageContent,
            `\n提示词: ${finalPrompt}`,
            `\n负面提示词: ${ctx.config.negativePrompt}`,
            `\n种子: ${seed}`,
            `\n采样器: ${sampler}`,
            `\n步数: ${ctx.config.steps}`,
            `\n提示词相关性: ${ctx.config.cfgScale}`,
            `\n噪声调度: ${noiseSchedule}`,
            `\n尺寸: ${width}x${height}`
          ].join('')
        }
        
        // 发送内容
        let msg
        if (ctx.config.useForwardMessage) {
          try {
            if (ctx.config.contentMode === '仅图片') {
              msg = await session.send(
                jsx("message", { 
                  forward: true, 
                  children: jsx("message", { 
                    userId: session.selfId, 
                    nickname: '生成的图片',
                    children: content 
                  }) 
                })
              )
            } else {
              const imageMessage = jsx("message", {
                userId: session.selfId,
                nickname: '生成的图片',
                children: imageContent
              })
              
              const detailsMessage = jsx("message", {
                userId: session.selfId,
                nickname: '图片信息',
                children: [
                  `提示词: ${finalPrompt}`,
                  `\n负面提示词: ${ctx.config.negativePrompt}`,
                  `\n种子: ${seed}`,
                  `\n采样器: ${sampler}`,
                  `\n步数: ${ctx.config.steps}`,
                  `\n提示词相关性: ${ctx.config.cfgScale}`,
                  `\n噪声调度: ${noiseSchedule}`,
                  `\n尺寸: ${width}x${height}`
                ].join('')
              })
              
              msg = await session.send(
                jsx("message", {
                  forward: true,
                  children: [imageMessage, detailsMessage]
                })
              )
            }
          } catch (error) {
            ctx.logger('loliy-novelai').warn('合并转发失败，将使用普通方式发送', error)
            msg = await session.send(content)
          }
        } else {
          msg = await session.send(h.quote(session.messageId) + content)
        }
        
        // 如果启用了自动撤回
        if (ctx.config.autoRecall && msg) {
          setTimeout(async () => {
            try {
              await session.bot.deleteMessage(session.channelId, msg)
            } catch (error) {
            ctx.logger('loliy-novelai').error('撤回消息失败', error)
            }
          }, ctx.config.recallDelay * 1000)
        }
        
        return // 成功后返回

      } catch (error) {
        lastError = error
        retries++
        
        const errorMessage = error instanceof Error ? error.message : '未知错误'
        
        // 只在最后一次重试失败时记录详细错误
        if (retries === ctx.config.maxRetries) {
          ctx.logger('loliy-novelai').error({
            错误: errorMessage,
            重试次数: retries,
            请求数据: {
              ...requestData,
              token: '***'
            }
          })

          // 根据错误类型返回用户友好的错误消息
          let userErrorMessage = '生成图片失败'
          if (errorMessage.includes('401: Unauthorized')) {
            userErrorMessage = 'API密钥无效或已过期，请联系管理员更新密钥。'
          } else if (errorMessage.includes('429')) {
            userErrorMessage = 'API请求次数超限，请稍后再试。'
          } else if (errorMessage.includes('500')) {
            userErrorMessage = 'API服务器内部错误，请稍后重试。'
          } else if (errorMessage.includes('503')) {
            userErrorMessage = 'API服务暂时不可用，请稍后重试。'
          } else {
            userErrorMessage = `生成图片失败: ${errorMessage}`
          }

          throw new Error(userErrorMessage)
        } else {
          // 记录重试次数
          ctx.logger('loliy-novelai').warn(`准备第${retries}次重试`)
          await delay(ctx.config.retryDelay)
        }
      }
    }
    
    // 如果所有重试都失败了，抛出最后一个错误
    if (lastError) {
      throw lastError
    }
  }

  // 根据模型获取适合的采样器
  function getSamplerForModel(model: string, configSampler: SamplerType): string {
    if (isV4Model(model)) {
      // 如果是V4模型，但配置的采样器不在V4支持列表中，则使用V4默认采样器
      return SAMPLERS.v4.includes(configSampler as SamplerTypeV4) 
        ? configSampler 
        : 'k_euler_ancestral'
    } else {
      // V3模型支持所有采样器
      return configSampler
    }
  }

  // 根据模型获取适合的噪声调度
  function getNoiseScheduleForModel(model: string, configNoiseSchedule: NoiseScheduleType): string {
    if (isV4Model(model)) {
      // 如果是V4模型，但配置的噪声调度不在V4支持列表中，则使用V4默认噪声调度
      return NOISE_SCHEDULES.v4.includes(configNoiseSchedule as NoiseScheduleTypeV4) 
        ? configNoiseSchedule 
        : 'karras'
    } else {
      // V3模型支持所有噪声调度
      return configNoiseSchedule
    }
  }

  // 修改解析模型快捷选择函数
  function parseModelShortcut(text: string) {
    let modelOverride: string | null = null
    let processedText = text

    // 定义模型关键词映射
    const modelKeywords = {
      'v4': 'nai-diffusion-4-full',
      'v4c': 'nai-diffusion-4-curated-preview',
      'v3': 'nai-diffusion-3',
      'furry': 'nai-diffusion-furry-3',
      'v3f': 'nai-diffusion-furry-3'
    }

    // 遍历所有可能的模型关键词
    for (const [keyword, modelId] of Object.entries(modelKeywords)) {
      // 使用正则表达式匹配关键词，支持在任意位置
      const regex = new RegExp(`(?:^|\\s)(${keyword})(?:\\s|$)`)
      if (regex.test(processedText)) {
        modelOverride = modelId
        // 移除模型关键词
        processedText = processedText.replace(regex, ' ').trim()
        break // 找到第一个匹配就退出
      }
    }

    return { modelOverride, processedText }
  }

  // 创建父命令
  const cmd = ctx.command('loliy-novelai', '基于loliy API的AI画图插件')
    .usage('获取Key请点击：https://www.loliy.top/')
    .usage('NovelAi绘画第三方平台')
    .usage('价格实惠')
    .usage('')  // 添加一个空行作为分隔
    .usage('支持生成各种尺寸的AI图片，包括标准尺寸、大图尺寸和壁纸尺寸')

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
    .example('画 横图 1girl, ')
    .example('画 v4 方图 1girl,  大图')
    .action(async ({ session }, ...args) => {
      try {
      const text = args.join(' ')
      
      // 解析模型快捷选择
      const { modelOverride, processedText } = parseModelShortcut(text)
      
      // 确定尺寸类型
      let sizeCategory: SizeCategoryType = '标准尺寸'
      let finalText = processedText

      // 检查是否包含大图或壁纸关键词
      if (finalText.includes('大图')) {
        sizeCategory = '大图尺寸'
        finalText = finalText.replace('大图', '').trim()
      } else if (finalText.includes('壁纸')) {
        sizeCategory = '壁纸尺寸'
        finalText = finalText.replace('壁纸', '').trim()
      }

      // 使用新的方向提取函数
      const { orientation, processedText: textWithoutOrientation } = extractOrientation(finalText)
      finalText = textWithoutOrientation

      // 清理提示词，删除反斜杠和 LoRA 标签
      finalText = cleanPrompt(finalText)

      // 添加到队列并处理
      const position = addToQueue(session, finalText, orientation, sizeCategory, modelOverride)
        
        // 获取用户剩余次数
        const remainingDraws = getUserRemainingDraws(session.userId)
        let remainingMsg = ''
        
        // 只在以下情况显示剩余次数:
        // 1. 启用了每日限制
        // 2. 用户不是白名单用户
        // 3. 剩余次数小于等于5或者刚好用了10次(剩余20次)
        if (ctx.config.enableDailyLimit && remainingDraws !== Infinity) {
          const usedCount = ctx.config.dailyLimit - remainingDraws;
          if (remainingDraws <= 5 || usedCount === 10) {
            remainingMsg = `\n今日剩余次数: ${remainingDraws}/${ctx.config.dailyLimit}`
          }
        }
      
      if (position > 1) {
          return `您当前排在第 ${position} 位，请稍候。\n前面还有 ${position - 1} 个请求在等待处理。${remainingMsg}`
      }

      // 启动队列处理
        processQueue()
        
        // 如果没有其他消息，只返回剩余次数信息
        if (remainingMsg) {
          return remainingMsg.trim()
        }
      } catch (error) {
        return error.message
      }
    })

  // 添加查询剩余次数命令
  cmd.subcommand('.剩余次数', '查询今日剩余绘图次数')
    .alias('剩余次数')
    .alias('查询次数')
    .action(async ({ session }) => {
      // 如果未启用每日限制
      if (!ctx.config.enableDailyLimit) {
        return '当前未启用每日绘图次数限制，可以无限使用。'
      }
      
      const userId = session.userId
      const remainingDraws = getUserRemainingDraws(userId)
      
      if (remainingDraws === Infinity) {
        return '您是白名单用户，没有每日绘图次数限制。'
      }
      
      return `您今日剩余绘图次数: ${remainingDraws}/${ctx.config.dailyLimit}`
    })

  // 创建绘画帮助命令（带别名）- 改为派生式子指令
  cmd.subcommand('.绘画菜单', '查询绘画功能')
    .alias('绘画菜单')
    .alias('绘画功能')
    .action(async ({ session }) => {
      return [
        '=== AI绘画功能菜单 ===',
        '基础命令：',
        '- 画 <描述文本> - 生成AI图片',
        '- #nai <描述文本> - 生成AI图片（别名）',
        '',
        '方向控制：',
        '- 横图/横：生成横向图片',
        '- 方图/方：生成方形图片',
        '- 竖图/竖：生成竖向图片（默认）',
        '',
        '可用模型：',
        '- v4：NAI Diffusion V4 完整版',
        '- v4c：NAI Diffusion V4 先行版',
        '- v3：NAI Diffusion Anime V3',
        '- furry/v3f：NAI Diffusion Furry V3',
        '',
        '特殊尺寸：',
        '- 大图：使用更大尺寸（需要在配置中启用）',
        '- 壁纸：使用壁纸尺寸（需要在配置中启用）',
        '',
        '示例：',
        '画 v4c 横 1girl, ',
        '#nai 方 v3 1girl, ',
        '画 壁纸 furry 竖 1girl, ',
        '',
        '提示：所有关键词位置随意，互不影响'
      ].join('\n')
    })
}
