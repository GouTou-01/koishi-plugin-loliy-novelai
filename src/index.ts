import { Context, Schema, segment, h } from 'koishi'
import { jsx } from '@satorijs/element/jsx-runtime'

export const name = 'loliy-novelai'

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

export interface Config {
  apiKeys: string[]
  defaultSizeCategory: SizeCategoryType
  defaultOrientation: OrientationType
  model: ModelType
  enableLargeSize: boolean
  enableWallpaperSize: boolean
  artistPrompts: string[]
  negativePrompt: string
  sampler: SamplerType
  cfgScale: number
  steps: number
  noiseSchedule: NoiseScheduleType
  useForwardMessage: boolean
  autoRecall: boolean
  recallDelay: number
  contentMode: ContentModeType
}

export const Config = Schema.intersect([
  Schema.object({
    apiKeys: Schema.array(String)
      .required()
      .description('API密钥列表 (可添加多个Key同时处理多张图片)')
      .role('table'),
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
      .description('是否启用大图尺寸(消耗更多点数)')
      .role('switch'),
    enableWallpaperSize: Schema.boolean()
      .default(false)
      .description('是否启用壁纸尺寸(消耗更多点数)')
      .role('switch'),
  }).description('基础设置'),
  
  Schema.object({
    artistPrompts: Schema.array(String)
      .default([])
      .description('画师提示词列表 (随机选择其中一个添加到提示词前面)')
      .role('table'),
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
      .description('发送内容模式')
  }).description('特殊功能')
]).description(`NovelAi绘画第三方平台

→ 点击获取 API Key: https://www.loliy.top/

价格实惠`)

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

  // 修改添加到队列的函数
  function addToQueue(
    session: any, 
    prompt: string, 
    orientation?: OrientationType, 
    sizeCategory?: SizeCategoryType,
    modelOverride?: string | null
  ): number {
    const queueItem: QueueItem = {
      userId: session.userId,
      userName: session.username || session.userId,
      timestamp: Date.now(),
      prompt,
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

  // 修改处理队列的函数
  async function processQueue() {
    // 如果队列为空，直接返回
    if (drawingQueue.length === 0) return
    
    // 获取所有可用的API Key
    const availableKeys = ctx.config.apiKeys.filter(key => !processingKeys.has(key))
    if (availableKeys.length === 0) return // 所有Key都在处理中
    
    // 获取所有未处理的请求
    const pendingItems = drawingQueue.filter(item => !item.isProcessing)
    if (pendingItems.length === 0) return // 所有请求都在处理中

    // 为每个可用的Key分配一个未处理的请求
    const processingPromises = availableKeys.map(async (apiKey, index) => {
      // 确保还有未处理的请求
      if (index >= pendingItems.length) return

      // 获取对应的未处理请求
      const nextItem = pendingItems[index]
      
      // 标记为处理中
      nextItem.isProcessing = true
      processingKeys.add(apiKey)
      
      try {
        // 如果请求超过5分钟，自动移除
        if (Date.now() - nextItem.timestamp > 5 * 60 * 1000) {
          removeFromQueue(nextItem)
          processingKeys.delete(apiKey)
          return
        }

        // 计算尺寸和模型名称
        const currentOrientation = nextItem.orientation || ctx.config.defaultOrientation
        const currentSizeCategory = nextItem.sizeCategory || ctx.config.defaultSizeCategory
        const size = SIZES[SIZE_CATEGORY_MAP[currentSizeCategory]][ORIENTATION_MAP[currentOrientation]]
        
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
          await nextItem.session.send(`正在生成图片... (${size}, ${currentSizeCategory}, 模型: ${modelName})`)
          usersSentProcessingMessage.add(nextItem.userId)
        }

        // 处理图片生成的核心逻辑
        await generateImage(nextItem, apiKey)
      } catch (error) {
        ctx.logger('loliy-novelai').error(error)
        nextItem.session.send('生成图片时发生错误')
      } finally {
        // 移除已处理的请求
        removeFromQueue(nextItem)
        processingKeys.delete(apiKey)
        
        // 如果队列为空，清空已发送处理提示的用户集合
        if (drawingQueue.length === 0) {
          usersSentProcessingMessage.clear()
        }
      }
    })

    // 等待所有处理完成
    await Promise.all(processingPromises)

    // 如果队列中还有未处理的请求，继续处理
    if (drawingQueue.length > 0) {
      processQueue()
    }
  }

  // 从队列中移除项目
  function removeFromQueue(item: QueueItem) {
    const index = drawingQueue.findIndex(i => i === item)
    if (index !== -1) {
      drawingQueue.splice(index, 1)
    }
  }

  // 修改图片生成函数，接收API Key
  async function generateImage(item: QueueItem, apiKey: string) {
    const { session, prompt, modelOverride } = item
    let currentOrientation = item.orientation || ctx.config.defaultOrientation
    let currentSizeCategory = item.sizeCategory || ctx.config.defaultSizeCategory

    // 提示词已经在命令处理时清理过了，这里直接使用
    let finalPrompt = prompt
    if (!hasArtistTag(prompt)) {
      // 只有在没有画师标签时才随机添加画师提示词
      if (ctx.config.artistPrompts && ctx.config.artistPrompts.length > 0) {
        const randomArtist = ctx.config.artistPrompts[Math.floor(Math.random() * ctx.config.artistPrompts.length)]
        if (randomArtist) {
          if (randomArtist.trim().endsWith(',')) {
            finalPrompt = `${randomArtist} ${prompt}`
          } else {
            finalPrompt = `${randomArtist}, ${prompt}`
          }
        }
      }
    }

    // 转换为内部使用的值
    const internalOrientation = ORIENTATION_MAP[currentOrientation]
    const internalSizeCategory = SIZE_CATEGORY_MAP[currentSizeCategory]

    // 检查壁纸模式下的方图请求
    if (internalSizeCategory === 'wallpaper' && internalOrientation === 'square') {
      await session.send('壁纸尺寸不支持方图，将使用默认尺寸方图。')
      currentSizeCategory = '标准尺寸'
    }
    // 验证尺寸类型是否可用
    else if ((internalSizeCategory === 'large' && !ctx.config.enableLargeSize) || 
        (internalSizeCategory === 'wallpaper' && !ctx.config.enableWallpaperSize)) {
      await session.send(`${currentSizeCategory}未启用，将使用默认尺寸继续生成。`)
      currentSizeCategory = '标准尺寸'
    }

    // 获取对应尺寸
    const size = SIZES[SIZE_CATEGORY_MAP[currentSizeCategory]][ORIENTATION_MAP[currentOrientation]]
    const [width, height] = size.split('x').map(Number)

    // 使用模型覆盖或用户选择的模型或默认模型
    const model = modelOverride || userModels.get(item.userId) || MODEL_MAP[ctx.config.model]

    // 根据模型选择适合的采样器和噪声调度
    const sampler = getSamplerForModel(model, ctx.config.sampler)
    const noiseSchedule = getNoiseScheduleForModel(model, ctx.config.noiseSchedule)

    // 获取模型名称
    let modelName = '默认模型'
    if (modelOverride) {
      modelName = Object.entries(AVAILABLE_MODELS).find(([key, value]) => key === modelOverride)?.[1] || '自定义模型'
    } else if (userModels.get(item.userId)) {
      modelName = Object.entries(MODEL_MAP)
        .find(([name, key]) => key === userModels.get(item.userId))?.[0] || '自定义模型'
    } else {
      modelName = ctx.config.model
    }
    
      // 构建完整的请求数据
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

      // 发送请求
      const response = await ctx.http.post('https://apis.loliy.top/v1/images/generate', requestData, {
        headers: {
        'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      // 处理响应
      if (response?.status === 'success' && response?.data?.[0]?.b64_json) {
        const imageData = response.data[0].b64_json
        const seed = response.data[0].seed || '-1'
        
        // 准备发送的内容
        let content
        
        if (ctx.config.contentMode === '仅图片') {
          content = segment.image(imageData)
        } else {
          content = [
            segment.image(imageData),
          `\n正面提示词: ${finalPrompt}`,
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
        
        return
      } else {
      ctx.logger('loliy-novelai').error('生成图片失败')
        return '生成图片失败: ' + (response.msg || '未知错误')
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

  // 注册画图命令（带别名）
  cmd.subcommand('画', '使用AI生成图片')
    .alias('nai')  // 添加 nai 作为别名
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
      
      if (position > 1) {
        return `您当前排在第 ${position} 位，请稍候。\n前面还有 ${position - 1} 个请求在等待处理。`
      }

      // 启动队列处理
      return processQueue()
    })

  // 创建绘画帮助命令（带别名）
  cmd.subcommand('绘画菜单', '查询绘画功能')
    .alias('绘画功能')  // 添加绘画功能作为别名
    .action(async ({ session }) => {
      return [
        '=== AI绘画功能菜单 ===',
        '基础命令：',
        '- 画 <描述文本> - 生成AI图片',
        '- nai <描述文本> - 生成AI图片（别名）',
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
        'nai 方 v3 1girl, ',
        '画 壁纸 furry 竖 1girl, ',
        '',
        '提示：所有关键词位置随意，互不影响'
      ].join('\n')
    })
}
