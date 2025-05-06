import { Context, Schema } from 'koishi';
export declare const name = "loliy-novelai";
export declare const usage = "\n<h1>NovelAI\u7ED8\u753B\u7B2C\u4E09\u65B9\u5E73\u53F0</h1>\n\n<p>\u652F\u6301\u4E24\u4E2AAPI\u5E73\u53F0\uFF1A</p>\n<ul>\n<li>Loliy API: <a href=\"https://www.loliy.top/\" target=\"_blank\">https://www.loliy.top/</a></li>\n<li>Hua API: <a href=\"https://hua.shigure.top/\" target=\"_blank\">https://hua.shigure.top/</a></li>\n</ul>\n\n<hr>\n\n<div class=\"notice\">\n<h3>\u6CE8\u610F\u4E8B\u9879</h3>\n<p>1. Loliy API \u652F\u6301\u6240\u6709\u5C3A\u5BF8\uFF0C\u5305\u62EC\u6807\u51C6\u5C3A\u5BF8\u3001\u5927\u56FE\u5C3A\u5BF8\u548C\u58C1\u7EB8\u5C3A\u5BF8</p>\n<p>2. Hua API \u4EC5\u652F\u6301\u6807\u51C6\u5C3A\u5BF8</p>\n<p>3. \u4EF7\u683C\u8BF4\u660E\uFF1A1\u70B9\u65701\u5F20\u56FE\uFF08\u9ED8\u8BA4\u5C3A\u5BF8\uFF09</p>\n</div>\n";
declare const MODEL_MAP: {
    readonly 'NAI Diffusion V4 \u5B8C\u6574\u7248': "nai-diffusion-4-full";
    readonly 'NAI Diffusion V4 \u5148\u884C\u7248': "nai-diffusion-4-curated-preview";
    readonly 'NAI Diffusion V4.5 \u5148\u884C\u7248': "nai-diffusion-4-5-curated";
    readonly 'NAI Diffusion Anime V3': "nai-diffusion-3";
    readonly 'NAI Diffusion Furry V3': "nai-diffusion-furry-3";
};
declare const SAMPLERS: {
    readonly v4: readonly ["k_euler_ancestral", "k_euler", "k_dpmpp_2s_ancestral", "k_dpmpp_2m_sde", "k_dpmpp_2m", "k_dpmpp_sde"];
    readonly v3: readonly ["k_euler_ancestral", "k_euler", "k_dpmpp_2s_ancestral", "k_dpmpp_2m_sde", "k_dpmpp_2m", "k_dpmpp_sde", "ddim_v3"];
};
declare const NOISE_SCHEDULES: {
    readonly v4: readonly ["karras", "exponential", "polyexponential"];
    readonly v3: readonly ["karras", "native", "exponential", "polyexponential"];
};
declare const CONTENT_MODES: readonly ["仅图片", "详细模式"];
type ModelType = keyof typeof MODEL_MAP;
type SamplerTypeV4 = typeof SAMPLERS.v4[number];
type SamplerTypeV3 = typeof SAMPLERS.v3[number];
type SamplerType = SamplerTypeV4 | SamplerTypeV3;
type NoiseScheduleTypeV4 = typeof NOISE_SCHEDULES.v4[number];
type NoiseScheduleTypeV3 = typeof NOISE_SCHEDULES.v3[number];
type NoiseScheduleType = NoiseScheduleTypeV4 | NoiseScheduleTypeV3;
type ContentModeType = typeof CONTENT_MODES[number];
type SizeCategoryType = '标准尺寸' | '大图尺寸' | '壁纸尺寸' | '小图尺寸';
type OrientationType = '竖图' | '横图' | '方图';
export interface Config {
    apiType: 'loliy' | 'hua';
    apiKeys: string[];
    huaAuthKeys: string[];
    huaNaiKeys: string[];
    defaultSizeCategory: SizeCategoryType;
    defaultOrientation: OrientationType;
    model: ModelType;
    enableLargeSize: boolean;
    enableWallpaperSize: boolean;
    enableArtistPrompts: boolean;
    artistPrompts: string[];
    enableDefaultPrompt: boolean;
    defaultPrompt: string;
    negativePrompt: string;
    sampler: SamplerType;
    cfgScale: number;
    steps: number;
    noiseSchedule: NoiseScheduleType;
    useForwardMessage: boolean;
    autoRecall: boolean;
    recallDelay: number;
    contentMode: ContentModeType;
    enableTranslation: boolean;
    showTranslationResult: boolean;
    maxRetries: number;
    retryDelay: number;
    enableDailyLimit: boolean;
    dailyLimit: number;
    whitelistUsers: string[];
    useHuaCache: boolean;
    enableGroupWhitelist: boolean;
    enableGroupBlacklist: boolean;
    groupWhitelist: string[];
    groupBlacklist: string[];
}
export declare const Config: Schema<Schemastery.ObjectS<{
    apiType: Schema<"loliy" | "hua", "loliy" | "hua">;
    apiKeys: Schema<string[], string[]>;
    huaAuthKeys: Schema<string[], string[]>;
    huaNaiKeys: Schema<string[], string[]>;
    useHuaCache: Schema<boolean, boolean>;
    defaultSizeCategory: Schema<"标准尺寸" | "大图尺寸" | "壁纸尺寸" | "小图尺寸", "标准尺寸" | "大图尺寸" | "壁纸尺寸" | "小图尺寸">;
    defaultOrientation: Schema<"竖图" | "横图" | "方图", "竖图" | "横图" | "方图">;
    model: Schema<"NAI Diffusion V4 完整版" | "NAI Diffusion V4 先行版" | "NAI Diffusion V4.5 先行版" | "NAI Diffusion Anime V3" | "NAI Diffusion Furry V3", "NAI Diffusion V4 完整版" | "NAI Diffusion V4 先行版" | "NAI Diffusion V4.5 先行版" | "NAI Diffusion Anime V3" | "NAI Diffusion Furry V3">;
    enableLargeSize: Schema<boolean, boolean>;
    enableWallpaperSize: Schema<boolean, boolean>;
}> | Schemastery.ObjectS<{
    enableArtistPrompts: Schema<boolean, boolean>;
    artistPrompts: Schema<string[], string[]>;
    enableDefaultPrompt: Schema<boolean, boolean>;
    defaultPrompt: Schema<string, string>;
    negativePrompt: Schema<string, string>;
    sampler: Schema<unknown, any>;
    cfgScale: Schema<number, number>;
    steps: Schema<number, number>;
    noiseSchedule: Schema<unknown, any>;
}> | Schemastery.ObjectS<{
    useForwardMessage: Schema<boolean, boolean>;
    autoRecall: Schema<boolean, boolean>;
    recallDelay: Schema<number, number>;
    contentMode: Schema<"仅图片" | "详细模式", "仅图片" | "详细模式">;
    enableTranslation: Schema<boolean, boolean>;
    showTranslationResult: Schema<boolean, boolean>;
}> | Schemastery.ObjectS<{
    maxRetries: Schema<number, number>;
    retryDelay: Schema<number, number>;
}> | Schemastery.ObjectS<{
    enableDailyLimit: Schema<boolean, boolean>;
    dailyLimit: Schema<number, number>;
    whitelistUsers: Schema<string[], string[]>;
}> | Schemastery.ObjectS<{
    enableGroupWhitelist: Schema<boolean, boolean>;
    groupWhitelist: Schema<string[], string[]>;
    enableGroupBlacklist: Schema<boolean, boolean>;
    groupBlacklist: Schema<string[], string[]>;
}>, {
    apiType: "loliy" | "hua";
    apiKeys: string[];
    huaAuthKeys: string[];
    huaNaiKeys: string[];
    useHuaCache: boolean;
    defaultSizeCategory: "标准尺寸" | "大图尺寸" | "壁纸尺寸" | "小图尺寸";
    defaultOrientation: "竖图" | "横图" | "方图";
    model: "NAI Diffusion V4 完整版" | "NAI Diffusion V4 先行版" | "NAI Diffusion V4.5 先行版" | "NAI Diffusion Anime V3" | "NAI Diffusion Furry V3";
    enableLargeSize: boolean;
    enableWallpaperSize: boolean;
} & import("cosmokit").Dict & {
    enableArtistPrompts: boolean;
    artistPrompts: string[];
    enableDefaultPrompt: boolean;
    defaultPrompt: string;
    negativePrompt: string;
    sampler: any;
    cfgScale: number;
    steps: number;
    noiseSchedule: any;
} & {
    useForwardMessage: boolean;
    autoRecall: boolean;
    recallDelay: number;
    contentMode: "仅图片" | "详细模式";
    enableTranslation: boolean;
    showTranslationResult: boolean;
} & {
    maxRetries: number;
    retryDelay: number;
} & {
    enableDailyLimit: boolean;
    dailyLimit: number;
    whitelistUsers: string[];
} & {
    enableGroupWhitelist: boolean;
    groupWhitelist: string[];
    enableGroupBlacklist: boolean;
    groupBlacklist: string[];
}>;
export declare function apply(ctx: Context): void;
export {};
