interface EmitterConstructor {
	new (opts: any): Emitter;
}
interface HLJSOptions {
	noHighlightRe: RegExp;
	languageDetectRe: RegExp;
	classPrefix: string;
	cssSelector: string;
	languages?: string[];
	__emitter: EmitterConstructor;
	ignoreUnescapedHTML?: boolean;
	throwUnescapedHTML?: boolean;
}
interface Emitter {
	startScope(name: string): void;
	endScope(): void;
	addText(text: string): void;
	toHTML(): string;
	finalize(): void;
	__addSublanguage(emitter: Emitter, subLanguageName: string): void;
}
type FnNames = keyof TrustedTypePolicyOptions;
type Args<Options extends TrustedTypePolicyOptions, K extends FnNames> = Parameters<NonNullable<Options[K]>>;
declare class TrustedHTML {
	private constructor(); // To prevent instantiting with 'new'.
	private brand: true; // To prevent structural typing.
}
declare class TrustedScript {
	private constructor(); // To prevent instantiting with 'new'.
	private brand: true; // To prevent structural typing.
}
declare class TrustedScriptURL {
	private constructor(); // To prevent instantiting with 'new'.
	private brand: true; // To prevent structural typing.
}
declare abstract class TrustedTypePolicy<Options extends TrustedTypePolicyOptions = TrustedTypePolicyOptions> {
	readonly name: string;
	createHTML(...args: Args<Options, "createHTML">): TrustedHTML;
	createScript(...args: Args<Options, "createScript">): TrustedScript;
	createScriptURL(...args: Args<Options, "createScriptURL">): TrustedScriptURL;
}
interface TrustedTypePolicyOptions {
	createHTML?: ((input: string, ...arguments: any[]) => string) | undefined;
	createScript?: ((input: string, ...arguments: any[]) => string) | undefined;
	createScriptURL?: ((input: string, ...arguments: any[]) => string) | undefined;
}
interface Config {
	/**
	 * Extend the existing array of allowed attributes.
	 * Can be an array of attribute names, or a function that receives
	 * the attribute name and tag name to determine if the attribute is allowed.
	 */
	ADD_ATTR?: string[] | ((attributeName: string, tagName: string) => boolean) | undefined;
	/**
	 * Extend the existing array of elements that can use Data URIs.
	 */
	ADD_DATA_URI_TAGS?: string[] | undefined;
	/**
	 * Extend the existing array of allowed tags.
	 * Can be an array of tag names, or a function that receives
	 * the tag name to determine if the tag is allowed.
	 */
	ADD_TAGS?: string[] | ((tagName: string) => boolean) | undefined;
	/**
	 * Extend the existing array of elements that are safe for URI-like values (be careful, XSS risk).
	 */
	ADD_URI_SAFE_ATTR?: string[] | undefined;
	/**
	 * Allow ARIA attributes, leave other safe HTML as is (default is true).
	 */
	ALLOW_ARIA_ATTR?: boolean | undefined;
	/**
	 * Allow HTML5 data attributes, leave other safe HTML as is (default is true).
	 */
	ALLOW_DATA_ATTR?: boolean | undefined;
	/**
	 * Allow external protocol handlers in URL attributes (default is false, be careful, XSS risk).
	 * By default only `http`, `https`, `ftp`, `ftps`, `tel`, `mailto`, `callto`, `sms`, `cid` and `xmpp` are allowed.
	 */
	ALLOW_UNKNOWN_PROTOCOLS?: boolean | undefined;
	/**
	 * Decide if self-closing tags in attributes are allowed.
	 * Usually removed due to a mXSS issue in jQuery 3.0.
	 */
	ALLOW_SELF_CLOSE_IN_ATTR?: boolean | undefined;
	/**
	 * Allow only specific attributes.
	 */
	ALLOWED_ATTR?: string[] | undefined;
	/**
	 * Allow only specific elements.
	 */
	ALLOWED_TAGS?: string[] | undefined;
	/**
	 * Allow only specific namespaces. Defaults to:
	 *  - `http://www.w3.org/1999/xhtml`
	 *  - `http://www.w3.org/2000/svg`
	 *  - `http://www.w3.org/1998/Math/MathML`
	 */
	ALLOWED_NAMESPACES?: string[] | undefined;
	/**
	 * Allow specific protocols handlers in URL attributes via regex (be careful, XSS risk).
	 * Default RegExp:
	 * ```
	 * /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;
	 * ```
	 */
	ALLOWED_URI_REGEXP?: RegExp | undefined;
	/**
	 * Define how custom elements are handled.
	 */
	CUSTOM_ELEMENT_HANDLING?: {
		/**
		 * Regular expression or function to match to allowed elements.
		 * Default is null (disallow any custom elements).
		 */
		tagNameCheck?: RegExp | ((tagName: string) => boolean) | null | undefined;
		/**
		 * Regular expression or function to match to allowed attributes.
		 * Default is null (disallow any attributes not on the allow list).
		 */
		attributeNameCheck?: RegExp | ((attributeName: string, tagName?: string) => boolean) | null | undefined;
		/**
		 * Allow custom elements derived from built-ins if they pass `tagNameCheck`. Default is false.
		 */
		allowCustomizedBuiltInElements?: boolean | undefined;
	};
	/**
	 * Add attributes to block-list.
	 */
	FORBID_ATTR?: string[] | undefined;
	/**
	 * Add child elements to be removed when their parent is removed.
	 */
	FORBID_CONTENTS?: string[] | undefined;
	/**
	 * Extend the existing or default array of forbidden content elements.
	 */
	ADD_FORBID_CONTENTS?: string[] | undefined;
	/**
	 * Add elements to block-list.
	 */
	FORBID_TAGS?: string[] | undefined;
	/**
	 * Glue elements like style, script or others to `document.body` and prevent unintuitive browser behavior in several edge-cases (default is false).
	 */
	FORCE_BODY?: boolean | undefined;
	/**
	 * Map of non-standard HTML element names to support. Map to true to enable support. For example:
	 *
	 * ```
	 * HTML_INTEGRATION_POINTS: { foreignobject: true }
	 * ```
	 */
	HTML_INTEGRATION_POINTS?: Record<string, boolean> | undefined;
	/**
	 * Sanitize a node "in place", which is much faster depending on how you use DOMPurify.
	 */
	IN_PLACE?: boolean | undefined;
	/**
	 * Keep an element's content when the element is removed (default is true).
	 */
	KEEP_CONTENT?: boolean | undefined;
	/**
	 * Map of MathML element names to support. Map to true to enable support. For example:
	 *
	 * ```
	 * MATHML_TEXT_INTEGRATION_POINTS: { mtext: true }
	 * ```
	 */
	MATHML_TEXT_INTEGRATION_POINTS?: Record<string, boolean> | undefined;
	/**
	 * Change the default namespace from HTML to something different.
	 */
	NAMESPACE?: string | undefined;
	/**
	 * Change the parser type so sanitized data is treated as XML and not as HTML, which is the default.
	 */
	PARSER_MEDIA_TYPE?: DOMParserSupportedType | undefined;
	/**
	 * Return a DOM `DocumentFragment` instead of an HTML string (default is false).
	 */
	RETURN_DOM_FRAGMENT?: boolean | undefined;
	/**
	 * Return a DOM `HTMLBodyElement` instead of an HTML string (default is false).
	 */
	RETURN_DOM?: boolean | undefined;
	/**
	 * Return a TrustedHTML object instead of a string if possible.
	 */
	RETURN_TRUSTED_TYPE?: boolean | undefined;
	/**
	 * Strip `{{ ... }}`, `${ ... }` and `<% ... %>` to make output safe for template systems.
	 * Be careful please, this mode is not recommended for production usage.
	 * Allowing template parsing in user-controlled HTML is not advised at all.
	 * Only use this mode if there is really no alternative.
	 */
	SAFE_FOR_TEMPLATES?: boolean | undefined;
	/**
	 * Change how e.g. comments containing risky HTML characters are treated.
	 * Be very careful, this setting should only be set to `false` if you really only handle
	 * HTML and nothing else, no SVG, MathML or the like.
	 * Otherwise, changing from `true` to `false` will lead to XSS in this or some other way.
	 */
	SAFE_FOR_XML?: boolean | undefined;
	/**
	 * Use DOM Clobbering protection on output (default is true, handle with care, minor XSS risks here).
	 */
	SANITIZE_DOM?: boolean | undefined;
	/**
	 * Enforce strict DOM Clobbering protection via namespace isolation (default is false).
	 * When enabled, isolates the namespace of named properties (i.e., `id` and `name` attributes)
	 * from JS variables by prefixing them with the string `user-content-`
	 */
	SANITIZE_NAMED_PROPS?: boolean | undefined;
	/**
	 * Supplied policy must define `createHTML` and `createScriptURL`.
	 */
	TRUSTED_TYPES_POLICY?: TrustedTypePolicy | null | undefined;
	/**
	 * Controls categories of allowed elements.
	 *
	 * Note that the `USE_PROFILES` setting will override the `ALLOWED_TAGS` setting
	 * so don't use them together.
	 */
	USE_PROFILES?: false | UseProfilesConfig | undefined;
	/**
	 * Return entire document including <html> tags (default is false).
	 */
	WHOLE_DOCUMENT?: boolean | undefined;
}
interface UseProfilesConfig {
	/**
	 * Allow all safe MathML elements.
	 */
	mathMl?: boolean | undefined;
	/**
	 * Allow all safe SVG elements.
	 */
	svg?: boolean | undefined;
	/**
	 * Allow all safe SVG Filters.
	 */
	svgFilters?: boolean | undefined;
	/**
	 * Allow all safe HTML elements.
	 */
	html?: boolean | undefined;
}
type FontCalculator = () => Partial<FontConfig>;
type SankeyLinkColor = "source" | "target" | "gradient";
type SankeyNodeAlignment = "left" | "right" | "center" | "justify";
type DOMPurifyConfiguration = Config;
type CSSFontSize = string | number;
interface MermaidConfig {
	/**
	 * Theme, the CSS style sheet.
	 * You may also use `themeCSS` to override this value.
	 *
	 */
	theme?: "default" | "base" | "dark" | "forest" | "neutral" | "neo" | "neo-dark" | "redux" | "redux-dark" | "redux-color" | "redux-dark-color" | "null";
	themeVariables?: any;
	themeCSS?: string;
	/**
	 * Defines which main look to use for the diagram.
	 *
	 */
	look?: "classic" | "handDrawn" | "neo";
	/**
	 * Defines the seed to be used when using handDrawn look. This is important for the automated tests as they will always find differences without the seed. The default value is 0 which gives a random seed.
	 *
	 */
	handDrawnSeed?: number;
	/**
	 * Defines which layout algorithm to use for rendering the diagram.
	 *
	 * Defaults to `elk`, which is bundled with mermaid. The `tiny` build omits
	 * ELK to stay small and falls back to `dagre`.
	 *
	 */
	layout?: string;
	/**
	 * The maximum allowed size of the users text diagram
	 */
	maxTextSize?: number;
	/**
	 * Defines the maximum number of edges that can be drawn in a graph.
	 *
	 */
	maxEdges?: number;
	elk?: {
		/**
		 * Elk specific option that allows edges to share path where it convenient. It can make for pretty diagrams but can also make it harder to read the diagram.
		 *
		 */
		mergeEdges?: boolean;
		/**
		 * Elk specific option affecting how nodes are placed.
		 *
		 */
		nodePlacementStrategy?: "SIMPLE" | "NETWORK_SIMPLEX" | "LINEAR_SEGMENTS" | "BRANDES_KOEPF";
		/**
		 * Elk specific option affecting Brandes-Koepf node placement alignment.
		 * BALANCED combines the four directional alignments; NONE picks the
		 * smallest result. Defaults to BALANCED for the default preset and NONE
		 * for named non-default presets.
		 *
		 */
		nodePlacementAlignment?: "NONE" | "LEFTUP" | "LEFTDOWN" | "RIGHTUP" | "RIGHTDOWN" | "BALANCED";
		/**
		 * Named combination of layering, node placement, placement alignment
		 * and cycle breaking options. Explicit options override the preset for
		 * that option; the remaining preset values still apply.
		 *
		 * `default` — network simplex layering, balanced Brandes-Koepf placement
		 * at the top level and inside subgraphs, and depth-first cycle breaking.
		 * Balanced placement favors centered branches and composite-state entries,
		 * sometimes at the cost of a wider or taller drawing. It does not
		 * guarantee that every edge attaches to the center of its target.
		 *
		 * `legacy` — Brandes-Koepf placement with NONE alignment and ELK's own
		 * greedy cycle breaking. Reproduces the rendering before presets existed.
		 *
		 * `modelOrder` — network simplex layering and top-level placement,
		 * Brandes-Koepf placement inside subgraphs, NONE alignment, and greedy
		 * model-order cycle breaking, which favors declaration order.
		 *
		 * `depthFirst` — the previous default: network simplex layering and
		 * top-level placement, Brandes-Koepf placement inside subgraphs, NONE
		 * alignment, and depth-first cycle breaking.
		 *
		 * Setting `layeringStrategy`, `nodePlacementStrategy`,
		 * `nodePlacementAlignment` or `cycleBreakingStrategy` explicitly overrides
		 * the preset for that option, including an explicit NONE alignment.
		 *
		 */
		preset?: "default" | "legacy" | "modelOrder" | "depthFirst";
		/**
		 * Straightens an edge that leaves or enters a node with a tiny step.
		 *
		 * ELK spreads an edge's port evenly along a node's side but routes the
		 * edge down a channel whose row rarely lines up with that port exactly,
		 * leaving a staircase of a few pixels right at the border. With rounded
		 * corners the two micro-bends land on top of each other and read as a
		 * kink. Enabling this moves the channel onto the port's row and drops
		 * the step, so the edge draws as one straight line and both ports stay
		 * exactly where the layout put them.
		 *
		 * Only the step next to a node is touched, and only when the edge
		 * continues the same way afterwards, so a real turn is never collapsed.
		 * An edge is left alone entirely when moving its run would drag the far
		 * port, or would introduce a crossing.
		 *
		 */
		straightenEdges?: boolean;
		/**
		 * Renders edge crossings as small arcs ("hops") or visible gaps, so that
		 * it is clear which line passes over which where two edges meet.
		 *
		 * The edge that gives way loses its corner rounding for the segment
		 * carrying the hop, which is the trade for a readable crossing. Curved
		 * edges are skipped rather than rewritten, to avoid corrupting their
		 * geometry. Set to `false` to draw plain crossings.
		 *
		 */
		lineHops?: boolean | ("arc" | "gap");
		/**
		 * Elk specific option deciding which layer each node is assigned to — the
		 * column in a left-to-right diagram, the row in a top-down one. This is
		 * the coarsest of the three placement decisions, so changing it moves
		 * nodes further than anything else short of altering spacing.
		 *
		 * NETWORK_SIMPLEX aims for the fewest long edges. LONGEST_PATH pushes
		 * every node as late as it can go. COFFMAN_GRAHAM bounds how many nodes
		 * share a layer, giving a more even, block-like shape on wide graphs.
		 * MIN_WIDTH and STRETCH_WIDTH trade edge length for a narrower or wider
		 * drawing. INTERACTIVE honours positions already on the nodes.
		 *
		 */
		layeringStrategy?: "NETWORK_SIMPLEX" | "LONGEST_PATH" | "LONGEST_PATH_SOURCE" | "COFFMAN_GRAHAM" | "MIN_WIDTH" | "STRETCH_WIDTH" | "INTERACTIVE";
		/**
		 * Elk specific option capping how many nodes COFFMAN_GRAHAM will put in
		 * one layer. Ignored by every other layering strategy. Lower values give
		 * a taller, narrower drawing.
		 *
		 */
		layeringLayerBound?: number;
		/**
		 * This strategy decides how to find cycles in the graph and deciding which edges need adjustment to break loops.
		 *
		 */
		cycleBreakingStrategy?: "GREEDY" | "DEPTH_FIRST" | "INTERACTIVE" | "MODEL_ORDER" | "GREEDY_MODEL_ORDER";
		/**
		 * The node order given by the model does not change to produce a better layout. E.g. if node A is before node B in the model this is not changed during crossing minimization. This assumes that the node model order is already respected before crossing minimization. This can be achieved by setting considerModelOrder.strategy to NODES_AND_EDGES.
		 *
		 */
		forceNodeModelOrder?: boolean;
		/**
		 * Preserves the order of nodes and edges in the model file if this does not lead to additional edge crossings. Depending on the strategy this is not always possible since the node and edge order might be conflicting.
		 *
		 */
		considerModelOrder?: "NONE" | "NODES_AND_EDGES" | "PREFER_EDGES" | "PREFER_NODES";
		/**
		 * Elk specific option that keeps the entry node of a recursive flow at the top of the layout.
		 *
		 * When a flow loops back on itself (a back-edge to an earlier node), ELK's degree-based cycle-breaking has no notion of an "entry point" and may rank the first-declared node in the middle, scrambling the reading order. When enabled, the entry node of each cyclic component is pinned to the first layer so the diagram still reads from its entry. Acyclic flows always have a natural source, so this has no effect on them.
		 *
		 * Only applies when the cyclic flow has no node without incoming edges: if the loop is fed from outside (e.g. a start node pointing into it), that component already has a natural source and nothing is pinned. Detection is also scoped per container, so cycles that cross a subgraph boundary are not detected.
		 *
		 */
		keepEntryNodeOnTop?: boolean;
		/**
		 * Routes an edge that re-enters a subgraph downstream instead of around the subgraph.
		 *
		 * ELK lays out a subgraph as one node of its parent graph. A node outside a subgraph that both receives an edge from it and sends one back into it therefore closes a cycle there, even when the nodes inside do not. ELK breaks that cycle by reversing one of the edges and routes it into the subgraph's input side, around the outside of the subgraph.
		 *
		 * When enabled, such edges are found before layout, on the graph with each subgraph collapsed, and handed to ELK in the other direction. The edge is drawn with its arrowhead at its real target. Cycles between plain nodes are left to `cycleBreakingStrategy`.
		 *
		 */
		orientFeedbackEdges?: boolean;
	};
	darkMode?: boolean;
	/**
	 * Flag for setting whether or not a html tag should be used for rendering labels on nodes and edges.
	 * **Note:** Diagram-specific `htmlLabels` settings (e.g., `flowchart.htmlLabels`) are deprecated.
	 * Use this root-level `htmlLabels` setting instead. The root-level `htmlLabels` takes precedence
	 * over any diagram-specific settings.
	 *
	 */
	htmlLabels?: boolean;
	/**
	 * Specifies the font to be used in the rendered diagrams.
	 * Can be any possible CSS `font-family`.
	 * See https://developer.mozilla.org/en-US/docs/Web/CSS/font-family
	 *
	 */
	fontFamily?: string;
	altFontFamily?: string;
	/**
	 * This option decides the amount of logging to be used by mermaid.
	 *
	 */
	logLevel?: "trace" | 0 | "debug" | 1 | "info" | 2 | "warn" | 3 | "error" | 4 | "fatal" | 5;
	/**
	 * Level of trust for parsed diagram
	 */
	securityLevel?: "strict" | "loose" | "antiscript" | "sandbox";
	/**
	 * Dictates whether mermaid starts on Page load
	 */
	startOnLoad?: boolean;
	/**
	 * Controls whether or arrow markers in html code are absolute paths or anchors.
	 * This matters if you are using base tag settings.
	 *
	 */
	arrowMarkerAbsolute?: boolean;
	/**
	 * This option controls which `currentConfig` keys are considered secure and
	 * can only be changed via call to `mermaid.initialize`.
	 * This prevents malicious graph directives from overriding a site's default security.
	 *
	 */
	secure?: string[];
	/**
	 * This option specifies if Mermaid can expect the dependent to include KaTeX stylesheets for browsers
	 * without their own MathML implementation. If this option is disabled and MathML is not supported, the math
	 * equations are replaced with a warning. If this option is enabled and MathML is not supported, Mermaid will
	 * fall back to legacy rendering for KaTeX.
	 *
	 */
	legacyMathML?: boolean;
	/**
	 * This option forces Mermaid to rely on KaTeX's own stylesheet for rendering MathML. Due to differences between OS
	 * fonts and browser's MathML implementation, this option is recommended if consistent rendering is important.
	 * If set to true, ignores legacyMathML.
	 *
	 */
	forceLegacyMathML?: boolean;
	/**
	 * This option controls if the generated ids of nodes in the SVG are
	 * generated randomly or based on a seed.
	 * If set to `false`, the IDs are generated based on the current date and
	 * thus are not deterministic. This is the default behavior.
	 *
	 * This matters if your files are checked into source control e.g. git and
	 * should not change unless content is changed.
	 *
	 */
	deterministicIds?: boolean;
	/**
	 * This option is the optional seed for deterministic ids.
	 * If set to `undefined` but deterministicIds is `true`, a simple number iterator is used.
	 * You can set this attribute to base the seed on a static string.
	 *
	 */
	deterministicIDSeed?: string;
	flowchart?: FlowchartDiagramConfig;
	swimlane?: SwimlaneDiagramConfig;
	agentflow?: AgentflowDiagramConfig;
	sequence?: SequenceDiagramConfig;
	gantt?: GanttDiagramConfig;
	journey?: JourneyDiagramConfig;
	timeline?: TimelineDiagramConfig;
	class?: ClassDiagramConfig;
	state?: StateDiagramConfig;
	er?: ErDiagramConfig;
	pie?: PieDiagramConfig;
	quadrantChart?: QuadrantChartConfig;
	xyChart?: XYChartConfig;
	requirement?: RequirementDiagramConfig;
	architecture?: ArchitectureDiagramConfig;
	mindmap?: MindmapDiagramConfig;
	ishikawa?: IshikawaDiagramConfig;
	kanban?: KanbanDiagramConfig;
	gitGraph?: GitGraphDiagramConfig;
	c4?: C4DiagramConfig;
	sankey?: SankeyDiagramConfig;
	packet?: PacketDiagramConfig;
	block?: BlockDiagramConfig;
	eventmodeling?: EventModelingDiagramConfig;
	treeView?: TreeViewDiagramConfig;
	radar?: RadarDiagramConfig;
	usecase?: UsecaseDiagramConfig;
	venn?: VennDiagramConfig;
	"wardley-beta"?: WardleyDiagramConfig;
	cynefin?: CynefinDiagramConfig;
	railroad?: RailroadDiagramConfig;
	dompurifyConfig?: DOMPurifyConfiguration;
	wrap?: boolean;
	fontSize?: number;
	markdownAutoWrap?: boolean;
	/**
	 * Suppresses inserting 'Syntax error' diagram in the DOM.
	 * This is useful when you want to control how to handle syntax errors in your application.
	 *
	 */
	suppressErrorRendering?: boolean;
}
interface FlowchartDiagramConfig extends BaseDiagramConfig {
	/**
	 * Theme, the CSS style sheet.
	 * You may also use `themeCSS` to override this value.
	 *
	 */
	theme?: "default" | "base" | "dark" | "forest" | "neutral" | "neo" | "neo-dark" | "redux" | "redux-dark" | "redux-color" | "redux-dark-color" | "null";
	/**
	 * Defines which main look to use for the diagram.
	 *
	 */
	look?: "classic" | "handDrawn" | "neo";
	/**
	 * Margin top for the text over the diagram
	 */
	titleTopMargin?: number;
	/**
	 * Defines a top/bottom margin for subgraph titles
	 *
	 */
	subGraphTitleMargin?: {
		top?: number;
		bottom?: number;
	};
	arrowMarkerAbsolute?: boolean;
	/**
	 * The amount of padding around the diagram as a whole so that embedded
	 * diagrams have margins, expressed in pixels.
	 *
	 */
	diagramPadding?: number;
	/**
	 * @deprecated
	 * **DEPRECATED: Use global `htmlLabels` instead.**
	 *
	 * Flag for setting whether or not a html tag should be used for rendering labels on nodes and edges.
	 * This property is deprecated.
	 * Please use the global `htmlLabels` configuration instead.
	 *
	 */
	htmlLabels?: boolean | null;
	/**
	 * Defines the spacing between nodes on the same level
	 *
	 * Pertains to horizontal spacing for TB (top to bottom) or BT (bottom to top) graphs,
	 * and the vertical spacing for LR as well as RL graphs.
	 *
	 */
	nodeSpacing?: number;
	/**
	 * Defines the spacing between nodes on different levels
	 *
	 * Pertains to horizontal spacing for TB (top to bottom) or BT (bottom to top) graphs,
	 * and the vertical spacing for LR as well as RL graphs.
	 *
	 */
	rankSpacing?: number;
	/**
	 * Defines how mermaid renders curves for flowcharts.
	 *
	 */
	curve?: "basis" | "bumpX" | "bumpY" | "cardinal" | "catmullRom" | "linear" | "monotoneX" | "monotoneY" | "natural" | "step" | "stepAfter" | "stepBefore" | "rounded";
	/**
	 * Represents the padding between the labels and the shape
	 *
	 * **Only used in new experimental rendering.**
	 *
	 */
	padding?: number;
	/**
	 * Width of nodes where text is wrapped.
	 *
	 * When using markdown strings the text is wrapped automatically, this
	 * value sets the max width of a text before it continues on a new line.
	 *
	 */
	wrappingWidth?: number;
	/**
	 * Minimum width of the label area of a node.
	 *
	 * Labels narrower than this are widened to it, so nodes with short text
	 * get a uniform width; the node's own padding is added on top, the same
	 * way it is for `wrappingWidth`. Nodes with an explicit width are not
	 * affected.
	 *
	 */
	minNodeWidth?: number;
	/**
	 * If true, subgraphs without explicit direction will inherit the global graph direction
	 * (e.g., LR, TB, RL, BT). Defaults to false to preserve legacy layout behavior.
	 *
	 */
	inheritDir?: boolean;
}
interface BaseDiagramConfig {
	useWidth?: number;
	/**
	 * When this flag is set to `true`, the height and width is set to 100%
	 * and is then scaled with the available space.
	 * If set to `false`, the absolute space required is used.
	 *
	 */
	useMaxWidth?: boolean;
	/**
	 * Theme, the CSS style sheet.
	 * You may also use `themeCSS` to override this value.
	 *
	 */
	theme?: "default" | "base" | "dark" | "forest" | "neutral" | "neo" | "neo-dark" | "redux" | "redux-dark" | "redux-color" | "redux-dark-color" | "null";
	/**
	 * Defines which main look to use for the diagram.
	 *
	 */
	look?: "classic" | "handDrawn" | "neo";
	/**
	 * Defines which layout algorithm to use for rendering the diagram.
	 *
	 */
	layout?: string;
}
interface SwimlaneDiagramConfig extends BaseDiagramConfig {
	/**
	 * Theme, the CSS style sheet.
	 * You may also use `themeCSS` to override this value.
	 *
	 */
	theme?: "default" | "base" | "dark" | "forest" | "neutral" | "neo" | "neo-dark" | "redux" | "redux-dark" | "redux-color" | "redux-dark-color" | "null";
	/**
	 * Defines which main look to use for the diagram.
	 *
	 */
	look?: "classic" | "handDrawn" | "neo";
	/**
	 * Defines which layout algorithm to use for rendering the diagram.
	 *
	 */
	layout?: string;
	/**
	 * Renders edge crossings as small arcs ("hops") or visible gaps so that
	 * overlapping edges are easier to read. Set to `false` to disable. Edges
	 * rendered as curves are skipped to avoid corrupting the geometry.
	 *
	 */
	lineHops?: boolean | ("arc" | "gap");
	/**
	 * Ignores edges that cross swimlane boundaries during swimlane layer
	 * assignment. This can improve rank quality for diagrams with many
	 * cross-lane links.
	 *
	 */
	ignoreCrossLaneEdges?: boolean;
	/**
	 * Enables a crossing-aware rank optimization pass for swimlane layouts.
	 *
	 */
	optimizeRanksByCrossings?: boolean;
	/**
	 * Automatically reorders top-level swimlanes with a deterministic
	 * weighted-linear-arrangement heuristic. Disabled by default because
	 * source swimlane order can carry semantic meaning.
	 *
	 */
	automaticLaneOrdering?: boolean;
}
interface AgentflowDiagramConfig extends BaseDiagramConfig {
	/**
	 * Theme, the CSS style sheet.
	 * You may also use `themeCSS` to override this value.
	 *
	 */
	theme?: "default" | "base" | "dark" | "forest" | "neutral" | "neo" | "neo-dark" | "redux" | "redux-dark" | "redux-color" | "redux-dark-color" | "null";
	/**
	 * Defines which main look to use for the diagram.
	 *
	 */
	look?: "classic" | "handDrawn" | "neo";
	/**
	 * Margin top for the text over the diagram
	 */
	titleTopMargin?: number;
	/**
	 * The amount of padding around the diagram as a whole so that embedded
	 * diagrams have margins, expressed in pixels.
	 *
	 */
	diagramPadding?: number;
	/**
	 * Defines the spacing between nodes on the same level.
	 *
	 * Pertains to horizontal spacing for TB (top to bottom) or BT (bottom to top) graphs,
	 * and the vertical spacing for LR as well as RL graphs.
	 *
	 */
	nodeSpacing?: number;
	/**
	 * Defines the spacing between nodes on different levels.
	 *
	 * Pertains to vertical spacing for TB (top to bottom) or BT (bottom to top), and the
	 * horizontal spacing for LR as well as RL graphs.
	 *
	 */
	rankSpacing?: number;
	/**
	 * Width of nodes where text is wrapped.
	 *
	 * When using markdown strings the text is wrapped automatically, this
	 * value sets the max width of a text before it continues on a new line.
	 *
	 */
	wrappingWidth?: number;
	/**
	 * Minimum width of the label area of a node.
	 *
	 * Labels narrower than this are widened to it, so nodes with short text
	 * get a uniform width; the node's own padding is added on top, the same
	 * way it is for `wrappingWidth`. Nodes with an explicit width are not
	 * affected.
	 *
	 */
	minNodeWidth?: number;
}
interface SequenceDiagramConfig extends BaseDiagramConfig {
	/**
	 * Theme, the CSS style sheet.
	 * You may also use `themeCSS` to override this value.
	 *
	 */
	theme?: "default" | "base" | "dark" | "forest" | "neutral" | "neo" | "neo-dark" | "redux" | "redux-dark" | "redux-color" | "redux-dark-color" | "null";
	/**
	 * Defines which main look to use for the diagram.
	 *
	 */
	look?: "classic" | "handDrawn" | "neo";
	arrowMarkerAbsolute?: boolean;
	hideUnusedParticipants?: boolean;
	/**
	 * Width of the activation rect
	 */
	activationWidth?: number;
	/**
	 * Margin to the right and left of the sequence diagram
	 */
	diagramMarginX?: number;
	/**
	 * Margin to the over and under the sequence diagram
	 */
	diagramMarginY?: number;
	/**
	 * Margin between actors
	 */
	actorMargin?: number;
	/**
	 * Width of actor boxes
	 */
	width?: number;
	/**
	 * Height of actor boxes
	 */
	height?: number;
	/**
	 * Margin around loop boxes
	 */
	boxMargin?: number;
	/**
	 * Margin around the text in loop/alt/opt boxes
	 */
	boxTextMargin?: number;
	/**
	 * Margin around notes
	 */
	noteMargin?: number;
	/**
	 * Space between messages.
	 */
	messageMargin?: number;
	/**
	 * Multiline message alignment
	 */
	messageAlign?: "left" | "center" | "right";
	/**
	 * Mirror actors under diagram
	 *
	 */
	mirrorActors?: boolean;
	/**
	 * forces actor popup menus to always be visible (to support E2E testing).
	 *
	 */
	forceMenus?: boolean;
	/**
	 * Prolongs the edge of the diagram downwards.
	 *
	 * Depending on css styling this might need adjustment.
	 *
	 */
	bottomMarginAdj?: number;
	/**
	 * Curved Arrows become Right Angles
	 *
	 * This will display arrows that start and begin at the same node as
	 * right angles, rather than as curves.
	 *
	 */
	rightAngles?: boolean;
	/**
	 * This will show the node numbers
	 */
	showSequenceNumbers?: boolean;
	/**
	 * This sets the font size of the actor's description
	 */
	actorFontSize?: string | number;
	/**
	 * This sets the font family of the actor's description
	 */
	actorFontFamily?: string;
	/**
	 * This sets the font weight of the actor's description
	 */
	actorFontWeight?: string | number;
	/**
	 * This sets the font size of actor-attached notes
	 */
	noteFontSize?: string | number;
	/**
	 * This sets the font family of actor-attached notes
	 */
	noteFontFamily?: string;
	/**
	 * This sets the font weight of actor-attached notes
	 */
	noteFontWeight?: string | number;
	/**
	 * This sets the text alignment of actor-attached notes
	 */
	noteAlign?: "left" | "center" | "right";
	/**
	 * This sets the font size of actor messages
	 */
	messageFontSize?: string | number;
	/**
	 * This sets the font family of actor messages
	 */
	messageFontFamily?: string;
	/**
	 * This sets the font weight of actor messages
	 */
	messageFontWeight?: string | number;
	/**
	 * This sets the auto-wrap state for the diagram
	 */
	wrap?: boolean;
	/**
	 * This sets the auto-wrap padding for the diagram (sides only)
	 */
	wrapPadding?: number;
	/**
	 * This sets the width of the loop-box (loop, alt, opt, par)
	 */
	labelBoxWidth?: number;
	/**
	 * This sets the height of the loop-box (loop, alt, opt, par)
	 */
	labelBoxHeight?: number;
	messageFont?: FontCalculator;
	noteFont?: FontCalculator;
	actorFont?: FontCalculator;
}
interface GanttDiagramConfig extends BaseDiagramConfig {
	/**
	 * Margin top for the text over the diagram
	 */
	titleTopMargin?: number;
	/**
	 * The height of the bars in the graph
	 */
	barHeight?: number;
	/**
	 * The margin between the different activities in the gantt diagram
	 */
	barGap?: number;
	/**
	 * Margin between title and gantt diagram and between axis and gantt diagram.
	 *
	 */
	topPadding?: number;
	/**
	 * The space allocated for the section name to the right of the activities
	 *
	 */
	rightPadding?: number;
	/**
	 * The space allocated for the section name to the left of the activities
	 *
	 */
	leftPadding?: number;
	/**
	 * Vertical starting position of the grid lines
	 */
	gridLineStartPadding?: number;
	/**
	 * Font size
	 */
	fontSize?: number;
	/**
	 * Font size for sections
	 */
	sectionFontSize?: string | number;
	/**
	 * The number of alternating section styles
	 */
	numberSectionStyles?: number;
	/**
	 * Date/time format of the axis
	 *
	 * This might need adjustment to match your locale and preferences.
	 *
	 */
	axisFormat?: string;
	/**
	 * axis ticks
	 *
	 * Pattern is:
	 *
	 * ```javascript
	 * /^([1-9][0-9]*)(millisecond|second|minute|hour|day|week|month)$/
	 * ```
	 *
	 */
	tickInterval?: string;
	/**
	 * When this flag is set, date labels will be added to the top of the chart
	 *
	 */
	topAxis?: boolean;
	/**
	 * Controls the display mode.
	 *
	 */
	displayMode?: "" | "compact";
	/**
	 * On which day a week-based interval should start
	 *
	 */
	weekday?: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
}
interface JourneyDiagramConfig extends BaseDiagramConfig {
	/**
	 * Margin to the right and left of the c4 diagram, must be a positive value.
	 *
	 */
	diagramMarginX?: number;
	/**
	 * Margin to the over and under the c4 diagram, must be a positive value.
	 *
	 */
	diagramMarginY?: number;
	/**
	 * Margin between actors
	 */
	leftMargin?: number;
	/**
	 * Maximum width of actor labels
	 */
	maxLabelWidth?: number;
	/**
	 * Width of actor boxes
	 */
	width?: number;
	/**
	 * Height of actor boxes
	 */
	height?: number;
	/**
	 * Margin around loop boxes
	 */
	boxMargin?: number;
	/**
	 * Margin around the text in loop/alt/opt boxes
	 */
	boxTextMargin?: number;
	/**
	 * Margin around notes
	 */
	noteMargin?: number;
	/**
	 * Space between messages.
	 */
	messageMargin?: number;
	/**
	 * Multiline message alignment
	 */
	messageAlign?: "left" | "center" | "right";
	/**
	 * Prolongs the edge of the diagram downwards.
	 *
	 * Depending on css styling this might need adjustment.
	 *
	 */
	bottomMarginAdj?: number;
	/**
	 * Curved Arrows become Right Angles
	 *
	 * This will display arrows that start and begin at the same node as
	 * right angles, rather than as curves.
	 *
	 */
	rightAngles?: boolean;
	taskFontSize?: string | number;
	taskFontFamily?: string;
	taskMargin?: number;
	/**
	 * Width of activation box
	 */
	activationWidth?: number;
	/**
	 * text placement as: tspan | fo | old only text as before
	 *
	 */
	textPlacement?: string;
	actorColours?: string[];
	sectionFills?: string[];
	sectionColours?: string[];
	/**
	 * Color of the title text in Journey Diagrams
	 */
	titleColor?: string;
	/**
	 * Font family to be used for the title text in Journey Diagrams
	 */
	titleFontFamily?: string;
	/**
	 * Font size to be used for the title text in Journey Diagrams
	 */
	titleFontSize?: string;
}
interface TimelineDiagramConfig extends BaseDiagramConfig {
	/**
	 * Margin to the right and left of the c4 diagram, must be a positive value.
	 *
	 */
	diagramMarginX?: number;
	/**
	 * Margin to the over and under the c4 diagram, must be a positive value.
	 *
	 */
	diagramMarginY?: number;
	/**
	 * Margin between actors
	 */
	leftMargin?: number;
	/**
	 * Width of actor boxes
	 */
	width?: number;
	/**
	 * Height of actor boxes
	 */
	height?: number;
	padding?: number;
	/**
	 * Margin around loop boxes
	 */
	boxMargin?: number;
	/**
	 * Margin around the text in loop/alt/opt boxes
	 */
	boxTextMargin?: number;
	/**
	 * Margin around notes
	 */
	noteMargin?: number;
	/**
	 * Space between messages.
	 */
	messageMargin?: number;
	/**
	 * Multiline message alignment
	 */
	messageAlign?: "left" | "center" | "right";
	/**
	 * Prolongs the edge of the diagram downwards.
	 *
	 * Depending on css styling this might need adjustment.
	 *
	 */
	bottomMarginAdj?: number;
	/**
	 * Curved Arrows become Right Angles
	 *
	 * This will display arrows that start and begin at the same node as
	 * right angles, rather than as curves.
	 *
	 */
	rightAngles?: boolean;
	taskFontSize?: string | number;
	taskFontFamily?: string;
	taskMargin?: number;
	/**
	 * Width of activation box
	 */
	activationWidth?: number;
	/**
	 * text placement as: tspan | fo | old only text as before
	 *
	 */
	textPlacement?: string;
	actorColours?: string[];
	sectionFills?: string[];
	sectionColours?: string[];
	disableMulticolor?: boolean;
}
interface ClassDiagramConfig extends BaseDiagramConfig {
	/**
	 * Theme, the CSS style sheet.
	 * You may also use `themeCSS` to override this value.
	 *
	 */
	theme?: "default" | "base" | "dark" | "forest" | "neutral" | "neo" | "neo-dark" | "redux" | "redux-dark" | "redux-color" | "redux-dark-color" | "null";
	/**
	 * Defines which main look to use for the diagram.
	 *
	 */
	look?: "classic" | "handDrawn" | "neo";
	/**
	 * Margin top for the text over the diagram
	 */
	titleTopMargin?: number;
	/**
	 * Controls whether or arrow markers in html code are absolute paths or anchors.
	 * This matters if you are using base tag settings.
	 *
	 */
	arrowMarkerAbsolute?: boolean;
	dividerMargin?: number;
	padding?: number;
	textHeight?: number;
	nodeSpacing?: number;
	rankSpacing?: number;
	/**
	 * The amount of padding around the diagram as a whole so that embedded
	 * diagrams have margins, expressed in pixels.
	 *
	 */
	diagramPadding?: number;
	htmlLabels?: boolean;
	hideEmptyMembersBox?: boolean;
	/**
	 * When true (default), nested namespaces render as hierarchical clusters,
	 * with each segment of a dotted name (e.g. `A.B.C`) becoming its own nested
	 * box. When false, namespaces render in compact mode: only explicitly
	 * declared namespaces are emitted and their full qualified name is used as
	 * a single flat label.
	 *
	 */
	hierarchicalNamespaces?: boolean;
}
interface StateDiagramConfig extends BaseDiagramConfig {
	/**
	 * Theme, the CSS style sheet.
	 * You may also use `themeCSS` to override this value.
	 *
	 */
	theme?: "default" | "base" | "dark" | "forest" | "neutral" | "neo" | "neo-dark" | "redux" | "redux-dark" | "redux-color" | "redux-dark-color" | "null";
	/**
	 * Defines which main look to use for the diagram.
	 *
	 */
	look?: "classic" | "handDrawn" | "neo";
	/**
	 * Defines which layout algorithm to use for rendering the diagram.
	 *
	 */
	layout?: string;
	/**
	 * Width of nodes where text is wrapped.
	 *
	 * When using markdown strings the text is wrapped automatically, this
	 * value sets the max width of a text before it continues on a new line.
	 *
	 */
	wrappingWidth?: number;
	/**
	 * Minimum width of the label area of a node.
	 *
	 * Labels narrower than this are widened to it, so nodes with short text
	 * get a uniform width; the node's own padding is added on top, the same
	 * way it is for `wrappingWidth`. Nodes with an explicit width are not
	 * affected.
	 *
	 */
	minNodeWidth?: number;
	/**
	 * Margin top for the text over the diagram
	 */
	titleTopMargin?: number;
	arrowMarkerAbsolute?: boolean;
	dividerMargin?: number;
	sizeUnit?: number;
	padding?: number;
	textHeight?: number;
	titleShift?: number;
	noteMargin?: number;
	nodeSpacing?: number;
	rankSpacing?: number;
	forkWidth?: number;
	forkHeight?: number;
	miniPadding?: number;
	/**
	 * Font size factor, this is used to guess the width of the edges labels
	 * before rendering by dagre layout.
	 * This might need updating if/when switching font
	 *
	 */
	fontSizeFactor?: number;
	fontSize?: number;
	labelHeight?: number;
	edgeLengthFactor?: string;
	compositTitleSize?: number;
	radius?: number;
}
interface ErDiagramConfig extends BaseDiagramConfig {
	/**
	 * Theme, the CSS style sheet.
	 * You may also use `themeCSS` to override this value.
	 *
	 */
	theme?: "default" | "base" | "dark" | "forest" | "neutral" | "neo" | "neo-dark" | "redux" | "redux-dark" | "redux-color" | "redux-dark-color" | "null";
	/**
	 * Defines which main look to use for the diagram.
	 *
	 */
	look?: "classic" | "handDrawn" | "neo";
	/**
	 * Margin top for the text over the diagram
	 */
	titleTopMargin?: number;
	/**
	 * The amount of padding around the diagram as a whole so that embedded
	 * diagrams have margins, expressed in pixels.
	 *
	 */
	diagramPadding?: number;
	/**
	 * Directional bias for layout of entities
	 */
	layoutDirection?: "TB" | "BT" | "LR" | "RL";
	/**
	 * The minimum width of an entity box. Expressed in pixels.
	 */
	minEntityWidth?: number;
	/**
	 * The minimum height of an entity box. Expressed in pixels.
	 */
	minEntityHeight?: number;
	/**
	 * The minimum internal padding between text in an entity box and the enclosing box borders.
	 * Expressed in pixels.
	 *
	 */
	entityPadding?: number;
	nodeSpacing?: number;
	rankSpacing?: number;
	/**
	 * Stroke color of box edges and lines.
	 */
	stroke?: string;
	/**
	 * Fill color of entity boxes
	 */
	fill?: string;
	/**
	 * Font size (expressed as an integer representing a number of pixels)
	 */
	fontSize?: number;
}
interface PieDiagramConfig extends BaseDiagramConfig {
	/**
	 * Axial position of slice's label from zero at the center to 1 at the outside edges.
	 *
	 */
	textPosition?: number;
	/**
	 * Donut hole ratio. Valid value are from 0 to 0.9. Default to 0.
	 *
	 */
	donutHole?: number;
	/**
	 * Legend's position relative to the chart. Default to right.
	 *
	 */
	legendPosition?: "top" | "bottom" | "left" | "right" | "center";
	/**
	 * Highlight specific slice with matching label. Set to 'hover' to highlight hovered slice.
	 *
	 */
	highlightSlice?: string;
}
interface QuadrantChartConfig extends BaseDiagramConfig {
	/**
	 * Width of the chart
	 */
	chartWidth?: number;
	/**
	 * Height of the chart
	 */
	chartHeight?: number;
	/**
	 * Chart title top and bottom padding
	 */
	titleFontSize?: number;
	/**
	 * Padding around the quadrant square
	 */
	titlePadding?: number;
	/**
	 * quadrant title padding from top if the quadrant is rendered on top
	 */
	quadrantPadding?: number;
	/**
	 * Padding around x-axis labels
	 */
	xAxisLabelPadding?: number;
	/**
	 * Padding around y-axis labels
	 */
	yAxisLabelPadding?: number;
	/**
	 * x-axis label font size
	 */
	xAxisLabelFontSize?: number;
	/**
	 * y-axis label font size
	 */
	yAxisLabelFontSize?: number;
	/**
	 * quadrant title font size
	 */
	quadrantLabelFontSize?: number;
	/**
	 * quadrant title padding from top if the quadrant is rendered on top
	 */
	quadrantTextTopPadding?: number;
	/**
	 * padding between point and point label
	 */
	pointTextPadding?: number;
	/**
	 * point title font size
	 */
	pointLabelFontSize?: number;
	/**
	 * radius of the point to be drawn
	 */
	pointRadius?: number;
	/**
	 * position of x-axis labels
	 */
	xAxisPosition?: "top" | "bottom";
	/**
	 * position of y-axis labels
	 */
	yAxisPosition?: "left" | "right";
	/**
	 * stroke width of edges of the box that are inside the quadrant
	 */
	quadrantInternalBorderStrokeWidth?: number;
	/**
	 * stroke width of edges of the box that are outside the quadrant
	 */
	quadrantExternalBorderStrokeWidth?: number;
}
interface XYChartConfig extends BaseDiagramConfig {
	/**
	 * width of the chart
	 */
	width?: number;
	/**
	 * height of the chart
	 */
	height?: number;
	/**
	 * Font size of the chart title
	 */
	titleFontSize?: number;
	/**
	 * Top and bottom space from the chart title
	 */
	titlePadding?: number;
	/**
	 * Should show the value corresponding to the bar within the bar
	 */
	showDataLabel?: boolean;
	/**
	 * If showing data label then show it outside the bar
	 */
	showDataLabelOutsideBar?: boolean;
	/**
	 * Should show the chart title
	 */
	showTitle?: boolean;
	/**
	 * Should show a legend for named plots
	 */
	showLegend?: boolean;
	/**
	 * Font size of the legend text
	 */
	legendFontSize?: number;
	/**
	 * Padding around the legend
	 */
	legendPadding?: number;
	xAxis?: XYChartAxisConfig;
	yAxis?: XYChartAxisConfig;
	/**
	 * How to plot will be drawn horizontal or vertical
	 */
	chartOrientation?: "vertical" | "horizontal";
	/**
	 * Minimum percent of space plots of the chart will take
	 */
	plotReservedSpacePercent?: number;
}
interface XYChartAxisConfig {
	/**
	 * Should show the axis labels (tick text)
	 */
	showLabel?: boolean;
	/**
	 * font size of the axis labels (tick text)
	 */
	labelFontSize?: number;
	/**
	 * top and bottom space from axis label (tick text)
	 */
	labelPadding?: number;
	/**
	 * Should show the axis title
	 */
	showTitle?: boolean;
	/**
	 * font size of the axis title
	 */
	titleFontSize?: number;
	/**
	 * top and bottom space from axis title
	 */
	titlePadding?: number;
	/**
	 * Should show the axis tick lines
	 */
	showTick?: boolean;
	/**
	 * length of the axis tick lines
	 */
	tickLength?: number;
	/**
	 * width of the axis tick lines
	 */
	tickWidth?: number;
	/**
	 * Show line across the axis
	 */
	showAxisLine?: boolean;
	/**
	 * Width of the axis line
	 */
	axisLineWidth?: number;
	/**
	 * Label rotation in degrees
	 */
	labelRotation?: number;
}
interface RequirementDiagramConfig extends BaseDiagramConfig {
	/**
	 * Theme, the CSS style sheet.
	 * You may also use `themeCSS` to override this value.
	 *
	 */
	theme?: "default" | "base" | "dark" | "forest" | "neutral" | "neo" | "neo-dark" | "redux" | "redux-dark" | "redux-color" | "redux-dark-color" | "null";
	/**
	 * Defines which main look to use for the diagram.
	 *
	 */
	look?: "classic" | "handDrawn" | "neo";
	rect_fill?: string;
	text_color?: string;
	rect_border_size?: string;
	rect_border_color?: string;
	rect_min_width?: number;
	rect_min_height?: number;
	fontSize?: number;
	rect_padding?: number;
	line_height?: number;
}
interface ArchitectureDiagramConfig extends BaseDiagramConfig {
	padding?: number;
	iconSize?: number;
	fontSize?: number;
	/**
	 * Whether to randomize initial node positions before running the layout algorithm.
	 * When false (default), nodes start at deterministic seed positions. When true, nodes
	 * start at random positions, which may produce varied but potentially better-spaced
	 * layouts. Note: `randomize: false` alone does NOT guarantee identical renders, because
	 * the underlying fcose layout still uses `Math.random()` internally during its
	 * constraint solver — use the `seed` option for full determinism.
	 *
	 */
	randomize?: boolean;
	/**
	 * Minimum separation (in pixels) between sibling nodes in the same group, passed through to the
	 * underlying fcose layout. Increase to spread overlapping siblings apart when many edges share the
	 * same port direction.
	 *
	 */
	nodeSeparation?: number;
	/**
	 * Multiplier applied to `iconSize` to compute the ideal length of edges between nodes within the
	 * same group. Increase to add breathing room; decrease to pack the diagram tighter. Edges crossing
	 * group boundaries are unaffected and use a fixed shorter length.
	 *
	 */
	idealEdgeLengthMultiplier?: number;
	/**
	 * Spring elasticity (0–1) applied to edges between nodes within the same group, passed through to
	 * fcose. Higher values pull connected nodes closer together; lower values let the layout spread them
	 * out. Edges crossing group boundaries are unaffected.
	 *
	 */
	edgeElasticity?: number;
	/**
	 * Maximum number of iterations the fcose layout algorithm runs before stopping. Increase for higher
	 * quality on large or densely-connected diagrams at the cost of render time.
	 *
	 */
	numIter?: number;
	/**
	 * Deterministic seed for the fcose layout. Defaults to 1, which makes every render of the
	 * same diagram produce the same layout — required for visual regression tests to be stable.
	 * Set to 0 to opt out and use the unstubbed Math.random (the layout will still differ
	 * slightly between renders, matching pre-fix behavior). Any other number selects a
	 * different reproducible layout variant.
	 *
	 */
	seed?: number;
}
interface MindmapDiagramConfig extends BaseDiagramConfig {
	padding?: number;
	maxNodeWidth?: number;
	/**
	 * Layout algorithm to use for positioning mindmap nodes
	 */
	layoutAlgorithm?: string;
}
interface IshikawaDiagramConfig extends BaseDiagramConfig {
	/**
	 * The amount of padding around the diagram as a whole so that embedded
	 * diagrams have margins, expressed in pixels.
	 *
	 */
	diagramPadding?: number;
	useMaxWidth?: boolean;
}
interface KanbanDiagramConfig extends BaseDiagramConfig {
	padding?: number;
	sectionWidth?: number;
	ticketBaseUrl?: string;
}
interface GitGraphDiagramConfig extends BaseDiagramConfig {
	/**
	 * Margin top for the text over the diagram
	 */
	titleTopMargin?: number;
	diagramPadding?: number;
	nodeLabel?: NodeLabel;
	mainBranchName?: string;
	mainBranchOrder?: number;
	showCommitLabel?: boolean;
	showBranches?: boolean;
	rotateCommitLabel?: boolean;
	parallelCommits?: boolean;
	/**
	 * Controls whether or arrow markers in html code are absolute paths or anchors.
	 * This matters if you are using base tag settings.
	 *
	 */
	arrowMarkerAbsolute?: boolean;
}
interface NodeLabel {
	width?: number;
	height?: number;
	x?: number;
	y?: number;
}
interface C4DiagramConfig extends BaseDiagramConfig {
	/**
	 * Margin to the right and left of the c4 diagram, must be a positive value.
	 *
	 */
	diagramMarginX?: number;
	/**
	 * Margin to the over and under the c4 diagram, must be a positive value.
	 *
	 */
	diagramMarginY?: number;
	/**
	 * Margin between shapes
	 */
	c4ShapeMargin?: number;
	/**
	 * Padding between shapes
	 */
	c4ShapePadding?: number;
	/**
	 * Width of person boxes
	 */
	width?: number;
	/**
	 * Height of person boxes
	 */
	height?: number;
	/**
	 * Margin around boxes
	 */
	boxMargin?: number;
	/**
	 * How many shapes to place in each row.
	 */
	c4ShapeInRow?: number;
	nextLinePaddingX?: number;
	/**
	 * How many boundaries to place in each row.
	 */
	c4BoundaryInRow?: number;
	/**
	 * This sets the font size of Person shape for the diagram
	 */
	personFontSize?: string | number;
	/**
	 * This sets the font weight of Person shape for the diagram
	 */
	personFontFamily?: string;
	/**
	 * This sets the font weight of Person shape for the diagram
	 */
	personFontWeight?: string | number;
	/**
	 * This sets the font size of External Person shape for the diagram
	 */
	external_personFontSize?: string | number;
	/**
	 * This sets the font family of External Person shape for the diagram
	 */
	external_personFontFamily?: string;
	/**
	 * This sets the font weight of External Person shape for the diagram
	 */
	external_personFontWeight?: string | number;
	/**
	 * This sets the font size of System shape for the diagram
	 */
	systemFontSize?: string | number;
	/**
	 * This sets the font family of System shape for the diagram
	 */
	systemFontFamily?: string;
	/**
	 * This sets the font weight of System shape for the diagram
	 */
	systemFontWeight?: string | number;
	/**
	 * This sets the font size of External System shape for the diagram
	 */
	external_systemFontSize?: string | number;
	/**
	 * This sets the font family of External System shape for the diagram
	 */
	external_systemFontFamily?: string;
	/**
	 * This sets the font weight of External System shape for the diagram
	 */
	external_systemFontWeight?: string | number;
	/**
	 * This sets the font size of System DB shape for the diagram
	 */
	system_dbFontSize?: string | number;
	/**
	 * This sets the font family of System DB shape for the diagram
	 */
	system_dbFontFamily?: string;
	/**
	 * This sets the font weight of System DB shape for the diagram
	 */
	system_dbFontWeight?: string | number;
	/**
	 * This sets the font size of External System DB shape for the diagram
	 */
	external_system_dbFontSize?: string | number;
	/**
	 * This sets the font family of External System DB shape for the diagram
	 */
	external_system_dbFontFamily?: string;
	/**
	 * This sets the font weight of External System DB shape for the diagram
	 */
	external_system_dbFontWeight?: string | number;
	/**
	 * This sets the font size of System Queue shape for the diagram
	 */
	system_queueFontSize?: string | number;
	/**
	 * This sets the font family of System Queue shape for the diagram
	 */
	system_queueFontFamily?: string;
	/**
	 * This sets the font weight of System Queue shape for the diagram
	 */
	system_queueFontWeight?: string | number;
	/**
	 * This sets the font size of External System Queue shape for the diagram
	 */
	external_system_queueFontSize?: string | number;
	/**
	 * This sets the font family of External System Queue shape for the diagram
	 */
	external_system_queueFontFamily?: string;
	/**
	 * This sets the font weight of External System Queue shape for the diagram
	 */
	external_system_queueFontWeight?: string | number;
	/**
	 * This sets the font size of Boundary shape for the diagram
	 */
	boundaryFontSize?: string | number;
	/**
	 * This sets the font family of Boundary shape for the diagram
	 */
	boundaryFontFamily?: string;
	/**
	 * This sets the font weight of Boundary shape for the diagram
	 */
	boundaryFontWeight?: string | number;
	/**
	 * This sets the font size of Message shape for the diagram
	 */
	messageFontSize?: string | number;
	/**
	 * This sets the font family of Message shape for the diagram
	 */
	messageFontFamily?: string;
	/**
	 * This sets the font weight of Message shape for the diagram
	 */
	messageFontWeight?: string | number;
	/**
	 * This sets the font size of Container shape for the diagram
	 */
	containerFontSize?: string | number;
	/**
	 * This sets the font family of Container shape for the diagram
	 */
	containerFontFamily?: string;
	/**
	 * This sets the font weight of Container shape for the diagram
	 */
	containerFontWeight?: string | number;
	/**
	 * This sets the font size of External Container shape for the diagram
	 */
	external_containerFontSize?: string | number;
	/**
	 * This sets the font family of External Container shape for the diagram
	 */
	external_containerFontFamily?: string;
	/**
	 * This sets the font weight of External Container shape for the diagram
	 */
	external_containerFontWeight?: string | number;
	/**
	 * This sets the font size of Container DB shape for the diagram
	 */
	container_dbFontSize?: string | number;
	/**
	 * This sets the font family of Container DB shape for the diagram
	 */
	container_dbFontFamily?: string;
	/**
	 * This sets the font weight of Container DB shape for the diagram
	 */
	container_dbFontWeight?: string | number;
	/**
	 * This sets the font size of External Container DB shape for the diagram
	 */
	external_container_dbFontSize?: string | number;
	/**
	 * This sets the font family of External Container DB shape for the diagram
	 */
	external_container_dbFontFamily?: string;
	/**
	 * This sets the font weight of External Container DB shape for the diagram
	 */
	external_container_dbFontWeight?: string | number;
	/**
	 * This sets the font size of Container Queue shape for the diagram
	 */
	container_queueFontSize?: string | number;
	/**
	 * This sets the font family of Container Queue shape for the diagram
	 */
	container_queueFontFamily?: string;
	/**
	 * This sets the font weight of Container Queue shape for the diagram
	 */
	container_queueFontWeight?: string | number;
	/**
	 * This sets the font size of External Container Queue shape for the diagram
	 */
	external_container_queueFontSize?: string | number;
	/**
	 * This sets the font family of External Container Queue shape for the diagram
	 */
	external_container_queueFontFamily?: string;
	/**
	 * This sets the font weight of External Container Queue shape for the diagram
	 */
	external_container_queueFontWeight?: string | number;
	/**
	 * This sets the font size of Component shape for the diagram
	 */
	componentFontSize?: string | number;
	/**
	 * This sets the font family of Component shape for the diagram
	 */
	componentFontFamily?: string;
	/**
	 * This sets the font weight of Component shape for the diagram
	 */
	componentFontWeight?: string | number;
	/**
	 * This sets the font size of External Component shape for the diagram
	 */
	external_componentFontSize?: string | number;
	/**
	 * This sets the font family of External Component shape for the diagram
	 */
	external_componentFontFamily?: string;
	/**
	 * This sets the font weight of External Component shape for the diagram
	 */
	external_componentFontWeight?: string | number;
	/**
	 * This sets the font size of Component DB shape for the diagram
	 */
	component_dbFontSize?: string | number;
	/**
	 * This sets the font family of Component DB shape for the diagram
	 */
	component_dbFontFamily?: string;
	/**
	 * This sets the font weight of Component DB shape for the diagram
	 */
	component_dbFontWeight?: string | number;
	/**
	 * This sets the font size of External Component DB shape for the diagram
	 */
	external_component_dbFontSize?: string | number;
	/**
	 * This sets the font family of External Component DB shape for the diagram
	 */
	external_component_dbFontFamily?: string;
	/**
	 * This sets the font weight of External Component DB shape for the diagram
	 */
	external_component_dbFontWeight?: string | number;
	/**
	 * This sets the font size of Component Queue shape for the diagram
	 */
	component_queueFontSize?: string | number;
	/**
	 * This sets the font family of Component Queue shape for the diagram
	 */
	component_queueFontFamily?: string;
	/**
	 * This sets the font weight of Component Queue shape for the diagram
	 */
	component_queueFontWeight?: string | number;
	/**
	 * This sets the font size of External Component Queue shape for the diagram
	 */
	external_component_queueFontSize?: string | number;
	/**
	 * This sets the font family of External Component Queue shape for the diagram
	 */
	external_component_queueFontFamily?: string;
	/**
	 * This sets the font weight of External Component Queue shape for the diagram
	 */
	external_component_queueFontWeight?: string | number;
	/**
	 * This sets the auto-wrap state for the diagram
	 */
	wrap?: boolean;
	/**
	 * This sets the auto-wrap padding for the diagram (sides only)
	 */
	wrapPadding?: number;
	person_bg_color?: string;
	person_border_color?: string;
	external_person_bg_color?: string;
	external_person_border_color?: string;
	system_bg_color?: string;
	system_border_color?: string;
	system_db_bg_color?: string;
	system_db_border_color?: string;
	system_queue_bg_color?: string;
	system_queue_border_color?: string;
	external_system_bg_color?: string;
	external_system_border_color?: string;
	external_system_db_bg_color?: string;
	external_system_db_border_color?: string;
	external_system_queue_bg_color?: string;
	external_system_queue_border_color?: string;
	container_bg_color?: string;
	container_border_color?: string;
	container_db_bg_color?: string;
	container_db_border_color?: string;
	container_queue_bg_color?: string;
	container_queue_border_color?: string;
	external_container_bg_color?: string;
	external_container_border_color?: string;
	external_container_db_bg_color?: string;
	external_container_db_border_color?: string;
	external_container_queue_bg_color?: string;
	external_container_queue_border_color?: string;
	component_bg_color?: string;
	component_border_color?: string;
	component_db_bg_color?: string;
	component_db_border_color?: string;
	component_queue_bg_color?: string;
	component_queue_border_color?: string;
	external_component_bg_color?: string;
	external_component_border_color?: string;
	external_component_db_bg_color?: string;
	external_component_db_border_color?: string;
	external_component_queue_bg_color?: string;
	external_component_queue_border_color?: string;
	personFont?: FontCalculator;
	external_personFont?: FontCalculator;
	systemFont?: FontCalculator;
	external_systemFont?: FontCalculator;
	system_dbFont?: FontCalculator;
	external_system_dbFont?: FontCalculator;
	system_queueFont?: FontCalculator;
	external_system_queueFont?: FontCalculator;
	containerFont?: FontCalculator;
	external_containerFont?: FontCalculator;
	container_dbFont?: FontCalculator;
	external_container_dbFont?: FontCalculator;
	container_queueFont?: FontCalculator;
	external_container_queueFont?: FontCalculator;
	componentFont?: FontCalculator;
	external_componentFont?: FontCalculator;
	component_dbFont?: FontCalculator;
	external_component_dbFont?: FontCalculator;
	component_queueFont?: FontCalculator;
	external_component_queueFont?: FontCalculator;
	boundaryFont?: FontCalculator;
	messageFont?: FontCalculator;
}
interface SankeyDiagramConfig extends BaseDiagramConfig {
	width?: number;
	height?: number;
	/**
	 * The color of the links in the sankey diagram.
	 *
	 */
	linkColor?: SankeyLinkColor | string;
	nodeAlignment?: SankeyNodeAlignment;
	useMaxWidth?: boolean;
	/**
	 * Toggle to display or hide values along with title.
	 *
	 */
	showValues?: boolean;
	/**
	 * The prefix to use for values
	 *
	 */
	prefix?: string;
	/**
	 * The suffix to use for values
	 *
	 */
	suffix?: string;
	/**
	 * The width of the nodes in the sankey diagram.
	 *
	 */
	nodeWidth?: number;
	/**
	 * The padding between nodes in the sankey diagram.
	 *
	 */
	nodePadding?: number;
	/**
	 * The style of labels in the sankey diagram. 'outlined' provides better readability with a white stroke behind the text.
	 *
	 */
	labelStyle?: "legacy" | "outlined";
	/**
	 * A mapping of node IDs to their colors. Nodes not specified will use the default color scheme.
	 *
	 */
	nodeColors?: {
		[k: string]: string;
	};
}
interface PacketDiagramConfig extends BaseDiagramConfig {
	/**
	 * The height of each row in the packet diagram.
	 */
	rowHeight?: number;
	/**
	 * The width of each bit in the packet diagram.
	 */
	bitWidth?: number;
	/**
	 * The number of bits to display per row.
	 */
	bitsPerRow?: number;
	/**
	 * Toggle to display or hide bit numbers.
	 */
	showBits?: boolean;
	/**
	 * The direction each row is numbered in. `descending` mirrors every row so it reads from
	 * that row's highest bit on the left down to its lowest bit on the right, the convention
	 * used for hardware registers. Fields are still declared lowest bit first, and keep their
	 * width.
	 *
	 */
	bitOrder?: "ascending" | "descending";
	/**
	 * The horizontal padding between the blocks in a row.
	 */
	paddingX?: number;
	/**
	 * The vertical padding between the rows.
	 */
	paddingY?: number;
}
interface BlockDiagramConfig extends BaseDiagramConfig {
	padding?: number;
}
interface EventModelingDiagramConfig extends BaseDiagramConfig {
	/**
	 * The padding around the Event Modeling diagram.
	 */
	padding?: number;
	/**
	 * The height of each row in the Event Modeling diagram.
	 */
	rowHeight?: number;
}
interface TreeViewDiagramConfig extends BaseDiagramConfig {
	/**
	 * Horizontal distance between rows differing by one level
	 */
	rowIndent?: number;
	/**
	 * Horizontal padding of label
	 */
	paddingX?: number;
	/**
	 * Vertical padding of label
	 */
	paddingY?: number;
	/**
	 * Thickness of the line
	 */
	lineThickness?: number;
	/**
	 * Whether to show the default file/folder icons next to labels.
	 * Explicit `icon()` annotations always render, regardless of this setting.
	 *
	 */
	showIcons?: boolean;
	/**
	 * Name of a registered iconify pack used to resolve unprefixed icon
	 * references — `icon(name)` annotations and `filenameIcons`/
	 * `extensionIcons` values without a `pack:` prefix. The pack must be
	 * registered with `registerIconPacks`. When empty, unprefixed names
	 * resolve to the built-in file/folder icons.
	 *
	 */
	defaultIconPack?: string;
	/**
	 * Exact-filename → icon map used to pick a file's icon when
	 * `showIcons` is enabled, e.g.
	 * `{ "Dockerfile": "material-icon-theme:docker" }`.
	 * Values are resolved like `icon()` references: `pack:name` is used
	 * as-is, unprefixed names resolve via `defaultIconPack`, and `none`
	 * hides the icon for matching files.
	 *
	 */
	filenameIcons?: {
		[k: string]: string;
	};
	/**
	 * File-extension → icon map used to pick a file's icon when
	 * `showIcons` is enabled, e.g.
	 * `{ ".ts": "material-icon-theme:typescript" }`. Keys are
	 * lowercase and may include or omit the leading dot.
	 * Values are resolved like `icon()` references: `pack:name` is used
	 * as-is, unprefixed names resolve via `defaultIconPack`, and `none`
	 * hides the icon for matching files.
	 *
	 */
	extensionIcons?: {
		[k: string]: string;
	};
}
interface RadarDiagramConfig extends BaseDiagramConfig {
	/**
	 * The size of the radar diagram.
	 */
	width?: number;
	/**
	 * The size of the radar diagram.
	 */
	height?: number;
	/**
	 * The margin from the top of the radar diagram.
	 */
	marginTop?: number;
	/**
	 * The margin from the right of the radar diagram.
	 */
	marginRight?: number;
	/**
	 * The margin from the bottom of the radar diagram.
	 */
	marginBottom?: number;
	/**
	 * The margin from the left of the radar diagram.
	 */
	marginLeft?: number;
	/**
	 * The scale factor of the axis.
	 */
	axisScaleFactor?: number;
	/**
	 * The scale factor of the axis label.
	 */
	axisLabelFactor?: number;
	/**
	 * The tension factor for the Catmull-Rom spline conversion to cubic Bézier curves.
	 */
	curveTension?: number;
}
interface UsecaseDiagramConfig extends BaseDiagramConfig {
	/**
	 * Theme, the CSS style sheet.
	 * You may also use `themeCSS` to override this value.
	 *
	 */
	theme?: "default" | "base" | "dark" | "forest" | "neutral" | "neo" | "neo-dark" | "redux" | "redux-dark" | "redux-color" | "redux-dark-color" | "null";
	/**
	 * Defines which main look to use for the diagram.
	 *
	 */
	look?: "classic" | "handDrawn" | "neo";
	/**
	 * Width of nodes where text is wrapped.
	 *
	 * When using markdown strings the text is wrapped automatically, this
	 * value sets the max width of a text before it continues on a new line.
	 *
	 */
	wrappingWidth?: number;
	/**
	 * Minimum width of the label area of a node.
	 *
	 * Labels narrower than this are widened to it, so nodes with short text
	 * get a uniform width; the node's own padding is added on top, the same
	 * way it is for `wrappingWidth`. Nodes with an explicit width are not
	 * affected.
	 *
	 */
	minNodeWidth?: number;
	/**
	 * Font size for actor labels
	 */
	actorFontSize?: number;
	/**
	 * Font family for actor labels.
	 *
	 * Written verbatim into an inline CSS custom property, so the characters that could
	 * terminate a declaration or open a new one are excluded: `;`, `<`, `>`, `(`, `)`,
	 * `{`, `}`, and `\`. Quotes, commas, and spaces stay allowed for font stacks such as
	 * `"Open Sans", sans-serif`.
	 *
	 */
	actorFontFamily?: string;
	/**
	 * Font weight for actor labels.
	 *
	 * Restricted to the CSS `font-weight` keywords and numeric weights, since this value
	 * is written verbatim into an inline CSS custom property.
	 *
	 */
	actorFontWeight?: string;
	/**
	 * Font size for usecase labels
	 */
	usecaseFontSize?: number;
	/**
	 * Font family for usecase labels.
	 *
	 * Constrained the same way as `actorFontFamily`.
	 *
	 */
	usecaseFontFamily?: string;
	/**
	 * Font weight for usecase labels.
	 *
	 * Constrained the same way as `actorFontWeight`.
	 *
	 */
	usecaseFontWeight?: string;
	/**
	 * Spacing between nodes on the same level
	 */
	nodeSpacing?: number;
	/**
	 * Spacing between nodes on different levels
	 */
	rankSpacing?: number;
	/**
	 * Padding around the entire diagram
	 */
	diagramPadding?: number;
	/**
	 * How a use case diagram takes its colours from the active theme.
	 *
	 * `role` (the default) gives every element of a kind one colour, read from the
	 * `usecaseActorBkg` / `usecaseActorBorder`, `usecaseBkg` / `usecaseBorder`, and
	 * `usecaseBoundaryBkg` / `usecaseBoundaryBorder` theme variables. Colour then says
	 * what an element *is*, and it is invariant under insertion, reordering, and
	 * renaming -- adding one use case in the middle does not recolour the ones after it,
	 * so diffs, documentation screenshots, and visual baselines stay stable.
	 *
	 * `rotate` instead gives each actor, use case, and system boundary its own slot from
	 * the theme's categorical palette (`borderColorArray` / `bkgColorArray`), the way ER
	 * entities and class boxes are coloured. Actors and use cases share one cycle, and
	 * system boundaries run a second one from zero, so a boundary is never forced to
	 * match an element inside it. Within the shared cycle the actors are numbered first
	 * and the use cases after them, each in declaration order -- an interleaved
	 * `actor A`, `usecase U`, `actor B` is therefore numbered A, B, U rather than
	 * A, U, B. This buys per-instance variety at the cost of the stability `role` has:
	 * inserting an element shifts the colour of every later element of its own kind, and
	 * inserting an actor shifts the use cases too. Only the colour themes
	 * (`redux-color`, `redux-dark-color`) carry a palette, so on every other theme the
	 * two settings render identically.
	 *
	 * `classDef` and `style` keep overriding both, whichever is set.
	 *
	 */
	colorScheme?: "role" | "rotate";
}
interface VennDiagramConfig extends BaseDiagramConfig {
	/**
	 * Theme, the CSS style sheet.
	 * You may also use `themeCSS` to override this value.
	 *
	 */
	theme?: "default" | "base" | "dark" | "forest" | "neutral" | "neo" | "neo-dark" | "redux" | "redux-dark" | "redux-color" | "redux-dark-color" | "null";
	/**
	 * Defines which main look to use for the diagram.
	 *
	 */
	look?: "classic" | "handDrawn" | "neo";
	/**
	 * The width of the Venn diagram.
	 */
	width?: number;
	/**
	 * The height of the Venn diagram.
	 */
	height?: number;
	padding?: number;
	useDebugLayout?: boolean;
}
interface WardleyDiagramConfig extends BaseDiagramConfig {
	/**
	 * The width of the Wardley diagram canvas.
	 */
	width?: number;
	/**
	 * The height of the Wardley diagram canvas.
	 */
	height?: number;
	/**
	 * The padding around the Wardley diagram.
	 */
	padding?: number;
	/**
	 * The radius of component nodes.
	 */
	nodeRadius?: number;
	/**
	 * The offset distance for node labels.
	 */
	nodeLabelOffset?: number;
	/**
	 * The font size for axis labels.
	 */
	axisFontSize?: number;
	/**
	 * The font size for component labels.
	 */
	labelFontSize?: number;
	/**
	 * Whether to display a background grid.
	 */
	showGrid?: boolean;
}
interface CynefinDiagramConfig extends BaseDiagramConfig {
	/**
	 * The width of the Cynefin diagram.
	 */
	width?: number;
	/**
	 * The height of the Cynefin diagram.
	 */
	height?: number;
	/**
	 * Padding around the diagram.
	 */
	padding?: number;
	/**
	 * Show decision model and practice type labels.
	 */
	showDomainDescriptions?: boolean;
	/**
	 * Waviness amplitude of domain boundaries (0 for straight).
	 */
	boundaryAmplitude?: number;
	/**
	 * Deterministic seed for boundary waviness. When 0 (default) the seed is derived
	 * from the diagram's SVG element id, which varies per render. Set any non-zero
	 * number to produce identical boundaries on every render — required for visual
	 * regression tests to be stable.
	 *
	 */
	seed?: number;
}
interface RailroadDiagramConfig extends BaseDiagramConfig {
	/**
	 * Use compact layout mode
	 */
	compactMode?: boolean;
	/**
	 * Padding around elements
	 */
	padding?: number;
	/**
	 * Vertical separation between elements
	 */
	verticalSeparation?: number;
	/**
	 * Horizontal separation between elements
	 */
	horizontalSeparation?: number;
	/**
	 * Radius for curved paths
	 */
	arcRadius?: number;
	/**
	 * Font size for text
	 */
	fontSize?: number;
	/**
	 * Font family for text
	 */
	fontFamily?: string;
	/**
	 * Fill color for terminal elements
	 */
	terminalFill?: string;
	/**
	 * Stroke color for terminal elements
	 */
	terminalStroke?: string;
	/**
	 * Text color for terminal elements
	 */
	terminalTextColor?: string;
	/**
	 * Fill color for non-terminal elements
	 */
	nonTerminalFill?: string;
	/**
	 * Stroke color for non-terminal elements
	 */
	nonTerminalStroke?: string;
	/**
	 * Text color for non-terminal elements
	 */
	nonTerminalTextColor?: string;
	/**
	 * Color for connection lines
	 */
	lineColor?: string;
	/**
	 * Width of strokes
	 */
	strokeWidth?: number;
	/**
	 * Fill color for start/end markers
	 */
	markerFill?: string;
	/**
	 * Fill color for comments
	 */
	commentFill?: string;
	/**
	 * Stroke color for comments
	 */
	commentStroke?: string;
	/**
	 * Text color for comments
	 */
	commentTextColor?: string;
	/**
	 * Fill color for special sequences
	 */
	specialFill?: string;
	/**
	 * Stroke color for special sequences
	 */
	specialStroke?: string;
	/**
	 * Color for rule names
	 */
	ruleNameColor?: string;
	/**
	 * Show start/end markers
	 */
	showMarkers?: boolean;
	/**
	 * Radius of start/end markers
	 */
	markerRadius?: number;
}
interface FontConfig {
	fontSize?: CSSFontSize;
	/**
	 * The CSS [`font-family`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-family) to use.
	 */
	fontFamily?: string;
	/**
	 * The font weight to use.
	 */
	fontWeight?: string | number;
}
export interface IConvertOptions {
	/** Markdown or HTML text. Empty text requires a file. Ignored if `inputFilename` is specified. */
	inputText?: string;
	/** Filename of source Markdown or HTML */
	inputFilename?: string;
	/** Alias for `inputFilename`. `inputFilename` takes priority when both are set. */
	input?: IConvertOptions["inputFilename"];
	/**
	 * Output binary image filename. File type can be `jpeg`, `png` or `webp`. Available when `encoding: "binary"`.
	 * Existing files are overwritten only after the new output is fully written.
	 */
	outputFilename?: import("puppeteer").ScreenshotOptions["path"];
	/** Alias for `outputFilename`. `outputFilename` takes priority when both are set. */
	output?: IConvertOptions["outputFilename"];
	/**
	 * File type of output image. Type will be inferred from `outputFilename` if set
	 * @defaultValue `png`
	 */
	type?: IConvertTypeOption;
	/**
	 * Width in pixel of output image. Must be a positive finite safe integer.
	 * @defaultValue `800`
	 */
	width?: number;
	/**
	 * Min-height in pixel of output image. Must be a finite safe integer >= 100.
	 * @defaultValue `100`
	 */
	height?: number;
	/**
	 * Encoding of output image
	 * @defaultValue `binary`
	 */
	encoding?: IConvertEncodingOption;
	/**
	 * Integer quality of the image, between 0-100 inclusive. Not applicable to `png` images.
	 * @defaultValue `100`
	 */
	quality?: import("puppeteer").ScreenshotOptions["quality"];
	/** HTML rendering text */
	htmlText?: string;
	/** Alias for `htmlText`. `htmlText` takes priority when both are set. */
	html?: IConvertOptions["htmlText"];
	/** CSS text appended last, after template and extension styles. */
	cssText?: string;
	/** Alias for `cssText`. `cssText` takes priority when both are set. */
	css?: IConvertOptions["cssText"];
	/**
	 * HTML rendering template. This option has no effect if `htmlText` is specified
	 * @defaultValue `default`
	 */
	htmlTemplate?: string;
	/**
	 * CSS rendering template. Custom `css` and `cssText` styles are appended.
	 * @defaultValue `default`
	 */
	cssTemplate?: string;
	/**
	 * Configuration for third-party extensions
	 */
	extensions?: boolean | IExtensionOptions;
	/**
	 * List of plugins to apply during the conversion pipeline.
	 * Each plugin may provide lifecycle hooks and/or custom extensions.
	 */
	plugins?: IPlugin[];
	/**
	 * Custom output processor. Overrides the built-in Puppeteer screenshot logic.
	 *
	 * Use the built-in factories from `mdimg`:
	 * ```ts
	 * import { createPdfOutputProcessor, createHtmlOutputProcessor } from 'mdimg';
	 *
	 * // With explicit outputFilename → written to disk
	 * await mdimg({ outputProcessor: createPdfOutputProcessor(), outputFilename: 'out.pdf', ... });
	 *
	 * // Without outputFilename → result returned in-memory only (result.data)
	 * const { data } = await mdimg({ outputProcessor: createHtmlOutputProcessor(), ... });
	 * ```
	 *
	 * When not set, defaults to an image (PNG/JPEG/WebP) processor driven by the
	 * `type`, `encoding`, and `quality` options.
	 *
	 * **Disk-write semantics for custom processors**: a file is written **only**
	 * when `outputFilename` is explicitly provided. No default output path is
	 * generated for custom processors.
	 */
	outputProcessor?: IOutputProcessor;
	/**
	 * Show preset console log
	 * @defaultValue `false`
	 */
	log?: boolean;
	/**
	 * Keep the temporary HTML file and print its absolute path to stderr, even if `log` is false.
	 * The file is created beside the explicit output filename, or beside the input
	 * file when no output filename is set. Text-only input uses the current directory.
	 * @defaultValue `false`
	 */
	debug?: boolean;
	/**
	 * Launch options of Puppeteer
	 * @link https://pptr.dev/api/puppeteer.puppeteerlaunchoptions */
	puppeteerProps?: import("puppeteer").LaunchOptions;
}
export type IConvertResponse = {
	/** Rendered HTML document */
	html: string;
	/** Uint8Array of output image when `encoding: "binary"`, or BASE64 encoded string of output image `encoding: "base64"` */
	data: Uint8Array | string;
	/** Path of output image when `encoding: "binary"` */
	path?: string;
};
/** File type of output image */
export type IConvertTypeOption = NonNullable<import("puppeteer").ScreenshotOptions["type"]>;
/** Encode type of output image */
export type IConvertEncodingOption = NonNullable<import("puppeteer").ScreenshotOptions["encoding"] | "blob">;
/**
 * Runtime context supplied to `IOutputProcessor.process()`.
 * Fields are populated based on whether the processor declares `requiresPage`.
 */
export interface IOutputProcessorContext {
	/** Complete rendered HTML document (after all plugin hooks). */
	html: string;
	/**
	 * Active Puppeteer page.
	 * Present only when `IOutputProcessor.requiresPage !== false`.
	 */
	page?: import("puppeteer").Page;
	/**
	 * `ElementHandle` for the `#mdimg-body` element.
	 * Present only when `page` is present.
	 */
	body?: import("puppeteer").ElementHandle;
	/**
	 * Resolved absolute output file path.
	 * Present only when `outputFilename` was **explicitly provided** by the caller.
	 * The processor may use this as a hint but does **not** need to write the file;
	 * `mdimg` handles disk I/O after the processor returns.
	 * When absent, the processor result is returned in-memory only.
	 */
	outputPath?: string;
}
/**
 * Data payload returned by `IOutputProcessor.process()`.
 * `mdimg` writes this to disk when an output filename was resolved.
 */
export interface IOutputProcessorResult {
	/**
	 * Output payload.
	 * - `Uint8Array` for binary formats (images, PDF).
	 * - `string` for text formats (HTML, SVG).
	 */
	data: Uint8Array | string;
}
/**
 * An output processor transforms the rendered HTML (and optionally a live
 * Puppeteer page) into a specific output format.
 *
 * Built-in factories (all exported from `mdimg`):
 * - `createImageOutputProcessor()` — PNG / JPEG / WebP via Puppeteer screenshot (default)
 * - `createPdfOutputProcessor()` — PDF via `page.pdf()`
 * - `createHtmlOutputProcessor()` — raw HTML string, no browser required
 *
 * Custom processors can target any format — SVG, DOCX, plain text, etc.
 */
export interface IOutputProcessor {
	/**
	 * Format identifier / typical file extension for this processor.
	 * Examples: `"pdf"`, `"svg"`, `"html"`, `"png"`.
	 */
	format: string;
	/**
	 * Whether this processor needs an active Puppeteer page in the context.
	 * Set to `false` for text-only formats (e.g. HTML export) to skip browser
	 * launch entirely and improve performance.
	 * @defaultValue `true`
	 */
	requiresPage?: boolean;
	/** Produce the output from the provided context. */
	process(ctx: IOutputProcessorContext): Promise<IOutputProcessorResult>;
}
/**
 * All highlight.js theme names bundled with mdimg.
 * Top-level themes come from `highlight.js/styles/*.css`;
 * base16 variants are prefixed with `base16/`.
 * @see https://highlightjs.org/demo
 */
export type IHighlightJsTheme = "1c-light" | "a11y-dark" | "a11y-light" | "agate" | "an-old-hope" | "androidstudio" | "arduino-light" | "arta" | "ascetic" | "atom-one-dark-reasonable" | "atom-one-dark" | "atom-one-light" | "brown-paper" | "codepen-embed" | "color-brewer" | "cybertopia-cherry" | "cybertopia-dimmer" | "cybertopia-icecap" | "cybertopia-saturated" | "dark" | "default" | "devibeans" | "docco" | "equinox" | "far" | "felipec" | "foundation" | "github-dark-dimmed" | "github-dark" | "github" | "gml" | "googlecode" | "gradient-dark" | "gradient-light" | "grayscale" | "hybrid" | "idea" | "intellij-light" | "ir-black" | "isbl-editor-dark" | "isbl-editor-light" | "kimbie-dark" | "kimbie-light" | "lightfair" | "lioshi" | "magula" | "mono-blue" | "monokai-sublime" | "monokai" | "night-owl" | "nnfx-dark" | "nnfx-light" | "nord" | "obsidian" | "panda-syntax-dark" | "panda-syntax-light" | "paraiso-dark" | "paraiso-light" | "pojoaque" | "purebasic" | "qtcreator-dark" | "qtcreator-light" | "rainbow" | "rose-pine-dawn" | "rose-pine-moon" | "rose-pine" | "routeros" | "school-book" | "shades-of-purple" | "srcery" | "stackoverflow-dark" | "stackoverflow-light" | "sunburst" | "tokyo-night-dark" | "tokyo-night-light" | "tomorrow-night-blue" | "tomorrow-night-bright" | "vs" | "vs-dark" | "vs2015" | "xcode" | "xt256" | "base16/3024" | "base16/apathy" | "base16/apprentice" | "base16/ashes" | "base16/atelier-cave-light" | "base16/atelier-cave" | "base16/atelier-dune-light" | "base16/atelier-dune" | "base16/atelier-estuary-light" | "base16/atelier-estuary" | "base16/atelier-forest-light" | "base16/atelier-forest" | "base16/atelier-heath-light" | "base16/atelier-heath" | "base16/atelier-lakeside-light" | "base16/atelier-lakeside" | "base16/atelier-plateau-light" | "base16/atelier-plateau" | "base16/atelier-savanna-light" | "base16/atelier-savanna" | "base16/atelier-seaside-light" | "base16/atelier-seaside" | "base16/atelier-sulphurpool-light" | "base16/atelier-sulphurpool" | "base16/atlas" | "base16/bespin" | "base16/black-metal-bathory" | "base16/black-metal-burzum" | "base16/black-metal-dark-funeral" | "base16/black-metal-gorgoroth" | "base16/black-metal-immortal" | "base16/black-metal-khold" | "base16/black-metal-marduk" | "base16/black-metal-mayhem" | "base16/black-metal-nile" | "base16/black-metal-venom" | "base16/black-metal" | "base16/brewer" | "base16/bright" | "base16/brogrammer" | "base16/brush-trees-dark" | "base16/brush-trees" | "base16/chalk" | "base16/circus" | "base16/classic-dark" | "base16/classic-light" | "base16/codeschool" | "base16/colors" | "base16/cupcake" | "base16/cupertino" | "base16/danqing" | "base16/darcula" | "base16/dark-violet" | "base16/darkmoss" | "base16/darktooth" | "base16/decaf" | "base16/default-dark" | "base16/default-light" | "base16/dirtysea" | "base16/dracula" | "base16/edge-dark" | "base16/edge-light" | "base16/eighties" | "base16/embers" | "base16/equilibrium-dark" | "base16/equilibrium-gray-dark" | "base16/equilibrium-gray-light" | "base16/equilibrium-light" | "base16/espresso" | "base16/eva-dim" | "base16/eva" | "base16/flat" | "base16/framer" | "base16/fruit-soda" | "base16/gigavolt" | "base16/github" | "base16/google-dark" | "base16/google-light" | "base16/grayscale-dark" | "base16/grayscale-light" | "base16/green-screen" | "base16/gruvbox-dark-hard" | "base16/gruvbox-dark-medium" | "base16/gruvbox-dark-pale" | "base16/gruvbox-dark-soft" | "base16/gruvbox-light-hard" | "base16/gruvbox-light-medium" | "base16/gruvbox-light-soft" | "base16/hardcore" | "base16/harmonic16-dark" | "base16/harmonic16-light" | "base16/heetch-dark" | "base16/heetch-light" | "base16/helios" | "base16/hopscotch" | "base16/horizon-dark" | "base16/horizon-light" | "base16/humanoid-dark" | "base16/humanoid-light" | "base16/ia-dark" | "base16/ia-light" | "base16/icy-dark" | "base16/ir-black" | "base16/isotope" | "base16/kimber" | "base16/london-tube" | "base16/macintosh" | "base16/marrakesh" | "base16/materia" | "base16/material-darker" | "base16/material-lighter" | "base16/material-palenight" | "base16/material-vivid" | "base16/material" | "base16/mellow-purple" | "base16/mexico-light" | "base16/mocha" | "base16/monokai" | "base16/nebula" | "base16/nord" | "base16/nova" | "base16/ocean" | "base16/oceanicnext" | "base16/one-light" | "base16/onedark" | "base16/outrun-dark" | "base16/papercolor-dark" | "base16/papercolor-light" | "base16/paraiso" | "base16/pasque" | "base16/phd" | "base16/pico" | "base16/pop" | "base16/porple" | "base16/qualia" | "base16/railscasts" | "base16/rebecca" | "base16/ros-pine-dawn" | "base16/ros-pine-moon" | "base16/ros-pine" | "base16/sagelight" | "base16/sandcastle" | "base16/seti-ui" | "base16/shapeshifter" | "base16/silk-dark" | "base16/silk-light" | "base16/snazzy" | "base16/solar-flare-light" | "base16/solar-flare" | "base16/solarized-dark" | "base16/solarized-light" | "base16/spacemacs" | "base16/summercamp" | "base16/summerfruit-dark" | "base16/summerfruit-light" | "base16/synth-midnight-terminal-dark" | "base16/synth-midnight-terminal-light" | "base16/tango" | "base16/tender" | "base16/tomorrow-night" | "base16/tomorrow" | "base16/twilight" | "base16/unikitty-dark" | "base16/unikitty-light" | "base16/vulcan" | "base16/windows-10-light" | "base16/windows-10" | "base16/windows-95-light" | "base16/windows-95" | "base16/windows-high-contrast-light" | "base16/windows-high-contrast" | "base16/windows-nt-light" | "base16/windows-nt" | "base16/woodland" | "base16/xcode-dusk" | "base16/zenburn";
export interface IExtensionOptions {
	/**
	 * Provide a boolean value of a configuration object for `hljs.configure()`.
	 * Available options: https://highlightjs.readthedocs.io/en/latest/api.html#configure
	 * @link https://github.com/highlightjs/highlight.js
	 * @defaultValue `true`
	 */
	highlightJs?: boolean | Partial<HLJSOptions & {
		/**
		 * Highlight.js theme name. Defaults to `atom-one-light` / `atom-one-dark`
		 * based on the CSS template when not set.
		 * Setting this overrides the automatic selection.
		 */
		theme: IHighlightJsTheme;
	}>;
	/**
	 * Provide a boolean value of a configuration object.
	 * Available options: https://docs.mathjax.org/en/latest/options/index.html
	 * @link https://github.com/mathjax/MathJax
	 * @defaultValue `true`
	 */
	mathJax?: boolean | Record<string, unknown>;
	/**
	 * Provide a boolean value of a configuration object.
	 * Available options: https://mermaid.js.org/config/schema-docs/config.html
	 * @link https://github.com/mermaid-js/mermaid
	 * @defaultValue `true`
	 */
	mermaid?: boolean | Partial<MermaidConfig>;
	/**
	 * Suppress any extension (built-in or plugin-contributed) or entire plugin
	 * by setting its name to `false`.
	 *
	 * **By extension name** — removes that `IExtension` from injection AND suppresses
	 * `markedExtensions` of the plugin that owns it, preventing a half-enabled
	 * state where resources are gone but custom parsing still runs:
	 * ```ts
	 * extensions: { mermaid: false, myExt: false }
	 * ```
	 *
	 * **By plugin name** — suppresses all `IExtension` entries the plugin registered
	 * AND its `markedExtensions` in a single key:
	 * ```ts
	 * extensions: { myPlugin: false }
	 * ```
	 *
	 * Both forms reach the same result for a plugin that contributes both
	 * injection and custom parsing.
	 */
	[name: string]: boolean | object | undefined;
}
/** Runtime context passed to an extension's `inject` method */
export interface IExtensionContext {
	/** Selected CSS template name or filename */
	cssTemplate: string;
}
/** HTML fragments returned by an extension to be injected into the page */
export interface IExtensionInjectResult {
	/** HTML fragment appended to `<head>` */
	head?: string;
	/** HTML fragment appended to `<body>` */
	body?: string;
}
/** Interface every extension (built-in or custom) must implement */
export interface IExtension {
	/** Unique name identifying this extension */
	name: string;
	/** Produce HTML/CSS/JS fragments to inject into the rendered page */
	inject(context: IExtensionContext): IExtensionInjectResult | Promise<IExtensionInjectResult>;
}
/** Lifecycle hooks available in the conversion pipeline */
export interface IHooks {
	/**
	 * Transform the raw input text **before** Markdown parsing.
	 * Receives the original Markdown/HTML string and must return the (optionally modified) string.
	 */
	beforeParse?: (text: string) => string | Promise<string>;
	/**
	 * Transform the parsed HTML **after** Markdown parsing but before the HTML template is spliced.
	 * Receives the rendered HTML fragment and must return the (optionally modified) string.
	 */
	afterParse?: (html: string) => string | Promise<string>;
	/**
	 * Transform the final HTML document **after** template splicing and extension injection.
	 * Receives the complete HTML document string and must return the (optionally modified) string.
	 */
	afterSplice?: (html: string) => string | Promise<string>;
	/**
	 * Transform the conversion result **after** Puppeteer rendering.
	 * Receives the `IConvertResponse` and must return the (optionally modified) response.
	 */
	afterRender?: (result: IConvertResponse) => IConvertResponse | Promise<IConvertResponse>;
}
/** A plugin bundles lifecycle hooks and/or custom extensions */
export interface IPlugin {
	/** Unique name identifying this plugin */
	name: string;
	/** Lifecycle hooks to tap into the conversion pipeline */
	hooks?: IHooks;
	/** Custom extensions to inject into every rendered page */
	extensions?: IExtension[];
	/**
	 * Custom marked extensions applied during Markdown parsing.
	 * Each item is passed to `marked.use()` in registration order, allowing
	 * you to add custom syntax (block/inline rules), override renderers, or
	 * attach `walkTokens` logic.
	 * @see https://marked.js.org/using_pro#extensions
	 */
	markedExtensions?: import("marked").MarkedExtension[];
}

export {};
