import type { MarkedExtension } from "marked";

import { createBuiltinExtensions } from "../extensions";
import type {
  IConvertOptions,
  IConvertResponse,
  IExtension,
  IPlugin,
} from "../interfaces";

/**
 * Manages the extension registry and plugin lifecycle hooks.
 *
 * Extensions are stored in a `Map` keyed by name so that a plugin-contributed
 * extension with the same name as a built-in will **replace** the built-in
 * rather than duplicate it.  Built-in extensions are seeded first (lower
 * priority); plugin extensions are registered afterwards and override by name.
 */
export class PluginManager {
  /** Name-keyed registry – insertion order preserved for injection sequence. */
  private readonly extensionRegistry: Map<string, IExtension>;
  private readonly plugins: IPlugin[];
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
  private readonly suppressedPluginNames: Set<string>;

  constructor(
    extensions: IConvertOptions["extensions"],
    plugins: IPlugin[] = [],
  ) {
    this.plugins = plugins;
    this.extensionRegistry = new Map();
    this.suppressedPluginNames = new Set();

    // Seed with built-in extensions (lower priority)
    for (const ext of createBuiltinExtensions(extensions)) {
      this.extensionRegistry.set(ext.name, ext);
    }

    // Plugin extensions override built-ins with the same name
    for (const plugin of plugins) {
      for (const ext of plugin.extensions ?? []) {
        this.extensionRegistry.set(ext.name, ext);
      }
    }

    // Apply suppression: any extension whose name is set to `false` in the
    // extensions config object is removed from the registry.
    //
    // markedExtensions suppression: a plugin is added to suppressedPluginNames
    // when EITHER its own name OR the name of any IExtension it owns is
    // suppressed. This ensures there is no half-enabled state regardless of
    // whether the caller uses the plugin name or the extension name as the key.
    if (extensions !== true && extensions !== false) {
      // Build reverse map: IExtension name → plugin that registered it.
      // Only the last plugin to register a given name is tracked (mirrors the
      // registry's last-writer-wins dedup behaviour).
      const extNameToPlugin = new Map<string, IPlugin>();
      for (const plugin of plugins) {
        for (const ext of plugin.extensions ?? []) {
          extNameToPlugin.set(ext.name, plugin);
        }
      }

      const pluginNameSet = new Set(plugins.map((p) => p.name));
      for (const [name, cfg] of Object.entries(extensions)) {
        if (cfg === false) {
          this.extensionRegistry.delete(name);

          // Path 1: name matches a plugin name directly.
          if (pluginNameSet.has(name)) {
            this.suppressedPluginNames.add(name);
          }

          // Path 2: name matches an IExtension owned by a plugin.
          const owningPlugin = extNameToPlugin.get(name);
          if (owningPlugin) {
            this.suppressedPluginNames.add(owningPlugin.name);
          }
        }
      }
    }
  }

  /** Run `beforeParse` hooks in registration order. */
  async beforeParse(text: string): Promise<string> {
    let result = text;
    for (const plugin of this.plugins) {
      if (plugin.hooks?.beforeParse) {
        result = await plugin.hooks.beforeParse(result);
      }
    }
    return result;
  }

  /** Run `afterParse` hooks in registration order. */
  async afterParse(html: string): Promise<string> {
    let result = html;
    for (const plugin of this.plugins) {
      if (plugin.hooks?.afterParse) {
        result = await plugin.hooks.afterParse(result);
      }
    }
    return result;
  }

  /** Run `afterSplice` hooks in registration order. */
  async afterSplice(html: string): Promise<string> {
    let result = html;
    for (const plugin of this.plugins) {
      if (plugin.hooks?.afterSplice) {
        result = await plugin.hooks.afterSplice(result);
      }
    }
    return result;
  }

  /** Run `afterRender` hooks in registration order. */
  async afterRender(result: IConvertResponse): Promise<IConvertResponse> {
    let current = result;
    for (const plugin of this.plugins) {
      if (plugin.hooks?.afterRender) {
        current = await plugin.hooks.afterRender(current);
      }
    }
    return current;
  }

  /** Return all extensions in registry order (built-ins first, overrides in place). */
  getExtensions(): IExtension[] {
    return [...this.extensionRegistry.values()];
  }

  /**
   * Return all marked extensions declared by plugins, in registration order.
   * Plugins whose name appears in `suppressedPluginNames` (i.e. suppressed via
   * `extensions[pluginName] = false`) are excluded so that their tokenizers and
   * renderers do not participate in parsing when the plugin is disabled.
   */
  getMarkedExtensions(): MarkedExtension[] {
    return this.plugins
      .filter((p) => !this.suppressedPluginNames.has(p.name))
      .flatMap((p) => p.markedExtensions ?? []);
  }
}
