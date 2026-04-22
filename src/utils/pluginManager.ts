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

  constructor(
    extensions: IConvertOptions["extensions"],
    plugins: IPlugin[] = [],
  ) {
    this.plugins = plugins;
    this.extensionRegistry = new Map();

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
    // extensions config object is removed from the registry, regardless of
    // whether it is a built-in or plugin-contributed extension.
    if (extensions !== true && extensions !== false) {
      for (const [name, cfg] of Object.entries(extensions)) {
        if (cfg === false) {
          this.extensionRegistry.delete(name);
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
}
