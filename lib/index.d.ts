import { Context, Schema } from 'koishi';
export declare const name = "loliy-novelai";
declare const MODEL_MAP: {
    readonly 'NAI Diffusion V4 \u5B8C\u6574\u7248': "nai-diffusion-4-full";
    readonly 'NAI Diffusion V4 \u5148\u884C\u7248': "nai-diffusion-4-curated-preview";
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
    apiKeys: string[];
    defaultSizeCategory: SizeCategoryType;
    defaultOrientation: OrientationType;
    model: ModelType;
    enableLargeSize: boolean;
    enableWallpaperSize: boolean;
    artistPrompts: string[];
    negativePrompt: string;
    sampler: SamplerType;
    cfgScale: number;
    steps: number;
    noiseSchedule: NoiseScheduleType;
    useForwardMessage: boolean;
    autoRecall: boolean;
    recallDelay: number;
    contentMode: ContentModeType;
}
export declare const Config: Schema<Schemastery.ObjectS<{
    apiKeys: Schema<string[], string[]>;
    defaultSizeCategory: Schema<"标准尺寸" | "大图尺寸" | "壁纸尺寸" | "小图尺寸", "标准尺寸" | "大图尺寸" | "壁纸尺寸" | "小图尺寸">;
    defaultOrientation: Schema<"竖图" | "横图" | "方图", "竖图" | "横图" | "方图">;
    model: Schema<"NAI Diffusion V4 完整版" | "NAI Diffusion V4 先行版" | "NAI Diffusion Anime V3" | "NAI Diffusion Furry V3", "NAI Diffusion V4 完整版" | "NAI Diffusion V4 先行版" | "NAI Diffusion Anime V3" | "NAI Diffusion Furry V3">;
    enableLargeSize: Schema<boolean, boolean>;
    enableWallpaperSize: Schema<boolean, boolean>;
}> | Schemastery.ObjectS<{
    artistPrompts: Schema<string[], string[]>;
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
}>, {
    apiKeys: string[];
    defaultSizeCategory: "标准尺寸" | "大图尺寸" | "壁纸尺寸" | "小图尺寸";
    defaultOrientation: "竖图" | "横图" | "方图";
    model: "NAI Diffusion V4 完整版" | "NAI Diffusion V4 先行版" | "NAI Diffusion Anime V3" | "NAI Diffusion Furry V3";
    enableLargeSize: boolean;
    enableWallpaperSize: boolean;
} & import("cosmokit").Dict & {
    artistPrompts: string[];
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
}>;
export declare function apply(ctx: Context): void;
export {};
