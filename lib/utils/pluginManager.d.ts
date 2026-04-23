import type { MarkedExtension } from "marked";
import type { IConvertOptions, IConvertResponse, IExtension, IPlugin } from "../interfaces";
/**
 * Manages the extension registry and plugin lifecycle hooks.
 *
 * Extensions are stored in a `Map` keyed by name so that a plugin-contributed
 * extension with the same name as a built-in will **replace** the built-in
 * rather than duplicate it.  Built-in extensions are seeded first (lower
 * priority); plugin extensions are registered afterwards and override by name.
 */
export declare class PluginManager {
    /** Name-keyed registry – insertion order preserved for injection sequence. */
    private readonly extensionRegistry;
    private readonly plugins;
    /**
     * Plugin names whose `markedExtensions` must be excluded from parsing.
     *
     * A plugin enters this set when ANY of the following are suppressed via the
     * `extensions` config:
     *   - the plugin's own name (`extensions[pluginName] = false`), or
     *   - the name of any `IExtension` the plugin owns
     *     (`extensions[extensionName] = false`).
     *
     * Both paths guarantee that if a plugin's HTML injection is disabled, its
     * custom parsing rules (tokenizers / renderers) are also disabled — preventing
     * the half-enabled state where resources are gone but syntax still transforms.
     */
    private readonly suppressedPluginNames;
    constructor(extensions: IConvertOptions["extensions"], plugins?: IPlugin[]);
    /** Run `beforeParse` hooks in registration order. */
    beforeParse(text: string): Promise<string>;
    /** Run `afterParse` hooks in registration order. */
    afterParse(html: string): Promise<string>;
    /** Run `afterSplice` hooks in registration order. */
    afterSplice(html: string): Promise<string>;
    /** Run `afterRender` hooks in registration order. */
    afterRender(result: IConvertResponse): Promise<IConvertResponse>;
    /** Return all extensions in registry order (built-ins first, overrides in place). */
    getExtensions(): IExtension[];
    /**
     * Return all marked extensions declared by plugins, in registration order.
     * Plugins whose name appears in `suppressedPluginNames` (i.e. suppressed via
     * `extensions[pluginName] = false`) are excluded so that their tokenizers and
     * renderers do not participate in parsing when the plugin is disabled.
     */
    getMarkedExtensions(): MarkedExtension[];
}
