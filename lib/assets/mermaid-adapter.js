/* global document, mermaid */

globalThis.__mdimgMermaid = async (layouts) => {
  const sources = Array.from(
    document.querySelectorAll(".mermaid"),
    (node) => node.textContent,
  );
  let needsKaTeX = false;
  for (const source of sources) {
    await mermaid.parse(source);
    const config = mermaid.mermaidAPI.getConfig();
    for (const layout of [
      config.layout,
      config.flowchart?.layout,
      config.class?.layout,
      config.state?.layout,
    ]) {
      if (layout && !layouts.includes(layout))
        throw new Error(`Mermaid: layout ${layout} is not packaged`);
    }
    if (
      /@import|url\(\s*["']?(?:https?:|\/\/)/i.test(
        String(config.themeCSS || ""),
      )
    ) {
      throw new Error("Mermaid: external styles/fonts are not packaged");
    }
    if (/\bfa[bklrs]?:fa-[\w-]+/.test(source))
      throw new Error("Mermaid: Font Awesome icons are not packaged");
    const diagram = await mermaid.mermaidAPI.getDiagramFromText(source);
    const db = diagram.db;
    const nodes = [
      ...Array.from(db.getVertices?.()?.values() || []),
      ...(db.getServices?.() || []),
      ...(db.getGroups?.() || []),
      ...(db.getData?.()?.nodes || []),
    ];
    for (const node of nodes) {
      if (
        node.icon &&
        (!db.getServices ||
          ![
            "blank",
            "cloud",
            "database",
            "disk",
            "internet",
            "server",
          ].includes(node.icon.replace(/^mermaid-architecture:/, "")))
      ) {
        throw new Error(`Mermaid: icon ${node.icon} is not packaged`);
      }
      if (node.img && /^(?:https?:|\/\/)/i.test(node.img))
        throw new Error(`Mermaid: image ${node.img} is not packaged`);
    }
    needsKaTeX ||= config.forceLegacyMathML || config.legacyMathML;
  }
  if (needsKaTeX) {
    await Promise.all(
      Array.from(document.fonts)
        .filter((font) => font.family.includes("KaTeX_"))
        .map((font) => font.load()),
    );
  }
  await document.fonts.ready;
  await mermaid.run({ querySelector: ".mermaid", suppressErrors: false });
};
