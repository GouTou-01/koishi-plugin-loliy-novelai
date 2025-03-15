# koishi-plugin-loliy-novelai

[![npm](https://img.shields.io/npm/v/koishi-plugin-loliy-novelai?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-loliy-novelai)

基于 loliy API 的 AI 画图插件

## 获取 API Key

获取Key请点击：https://www.loliy.top/
NovelAi绘画第三方平台
价格实惠

## 配置项

- `apiKey`: 必填，API 密钥
- `defaultSizeCategory`: 默认尺寸类别
  - 标准尺寸 (832x1216)
  - 大图尺寸 (1024x1536)
  - 壁纸尺寸 (1088x1920)
  - 小图尺寸 (512x768)
- `defaultOrientation`: 默认图片方向
  - 竖图 (高度 > 宽度)
  - 横图 (宽度 > 高度)
  - 方图 (宽度 = 高度)
- `model`: 默认使用的模型
- `enableLargeSize`: 是否启用大图尺寸(消耗更多点数)
- `enableWallpaperSize`: 是否启用壁纸尺寸(消耗更多点数)
- `negativePrompt`: 默认负面提示词
- `sampler`: 采样器
- `cfgScale`: 提示词相关性 (1-10)
- `steps`: 生成步数 (20-50)
- `noiseSchedule`: 噪声调度

### 尺寸说明

每种尺寸类别都包含三种方向：
- 竖图：适合人物立绘
- 横图：适合风景
- 方图：适合头像、物品

可用尺寸：
- 标准尺寸：832x1216 / 1216x832 / 1024x1024
- 大图尺寸：1024x1536 / 1536x1024 / 1472x1472
- 壁纸尺寸：1088x1920 / 1920x1088
- 小图尺寸：512x768 / 768x512 / 640x640

## 使用方法

帮助命令：
- `绘画菜单`或`绘画功能` - 查看AI绘画功能菜单

基础命令：
- `画` - 生成AI图片
- `nai` - 生成AI图片（画的替代命令）

方向关键词（支持完整词和简写）：
- 横图/横：生成横向图片
- 方图/方：生成方形图片
- 竖图/竖：生成竖向图片（默认）

模型快捷选择（在画和nai命令中都可使用）：
- 支持以下模型关键词（可以放在描述文本中的任意位置）：
  - `v4` - 使用 NAI Diffusion V4 完整版
  - `v4c` - 使用 NAI Diffusion V4 先行版
  - `v3` - 使用 NAI Diffusion Anime V3
  - `furry` 或 `v3f` - 使用 NAI Diffusion Furry V3

组合使用示例：
- `nai v4c 横 1girl, ` - 使用V4先行版生成横图女孩
- `画 方 v3 1girl, ` - 使用V3模型生成方形女孩
- `nai 壁纸 furry 竖 1girl, ` - 使用Furry模型生成竖向壁纸女孩图片

注意：
1. 方向关键词（横/方/竖）和其完整形式（横图/方图/竖图）都可以使用
2. 模型关键词(v4/v4c/v3/furry/v3f)可以放在描述文本中的任意位置
3. 如果使用未启用的特殊尺寸，会自动使用普通尺寸继续生成
4. 壁纸尺寸不支持方图，如果指定方图+壁纸会自动使用普通尺寸方图

### 高级设置

在插件配置中可以设置以下高级参数：

- **画师提示词列表**：可以添加多个画师提示词，每次生成图片时会随机选择其中一个添加到提示词前面
- **负面提示词**：用于排除不想要的元素，默认值为常见的负面提示词
- **采样器**：根据模型自动调整可用选项
  - NAI Diffusion V4 模型: k_euler_ancestral(默认)、k_euler、k_dpmpp_2s_ancestral、k_dpmpp_2m_sde、k_dpmpp_2m、k_dpmpp_sde
  - NAI Diffusion V3 模型: 上述所有选项 + ddim_v3
- **提示词相关性**：控制生成图像与提示词的相关程度，范围 1-10
- **生成步数**：控制生成的精细程度，范围 20-50
- **噪声调度**：根据模型自动调整可用选项
  - NAI Diffusion V4 模型: karras(默认)、exponential、polyexponential
  - NAI Diffusion V3 模型: 上述所有选项 + native

### 特殊功能
- `useForwardMessage`: 使用合并转发发送图片（注意：目前主要支持 QQ 和 OneBot 平台，其他平台可能不支持）
- `autoRecall`: 自动撤回生成的图片和详细信息（不会撤回"正在生成图片..."的提示）
- `recallDelay`: 自动撤回延迟时间(秒)，默认50秒
- `contentMode`: 发送内容模式
  - 仅图片：只发送生成的图片
  - 详细模式：图片和详细信息一起发送，一起撤回
