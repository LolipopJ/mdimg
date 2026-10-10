export declare const readAsset: (name: string) => string;
export declare const readAssetTable: (prefixes: string[]) => Record<string, string>;
export declare const serializeForScript: (value: unknown) => string;
export declare const inlineScript: (source: string) => string;
