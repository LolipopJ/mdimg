/* global document */

// This browser entry is copied as an asset; it must stay self-contained.
globalThis.__mdimgMathJax = async function initializeMathJax(
  config,
  resources,
) {
  const loader = config.loader || {};
  const output = config.output || {};
  const svg = config.svg || {};
  const startup = config.startup || {};
  if (config.chtml || (startup.output && startup.output !== "svg")) {
    throw new Error("MathJax: CHTML output is unsupported; use SVG options");
  }
  for (const options of [output, svg]) {
    if (options.font && options.font !== "mathjax-newcm") {
      throw new Error(`MathJax: font ${options.font} is not packaged`);
    }
    if (
      options.fontPath ||
      options.dynamicPrefix ||
      options.fontExtensions?.length
    ) {
      throw new Error(
        "MathJax: custom font paths and font extensions are not packaged",
      );
    }
  }
  for (const option of ["paths", "source", "require", "pathFilters"]) {
    if (loader[option]) {
      throw new Error(
        `MathJax: custom loader.${option} is unsupported for offline resources`,
      );
    }
  }
  const components = [
    "input/tex",
    "input/mml",
    "output/svg",
    ...(loader.load || []),
  ];
  if (components.some((name) => /chtml|^https?:|^a11y\/sre$/.test(name))) {
    throw new Error(
      "MathJax: requested component is unsupported for offline SVG resources",
    );
  }

  let rejectFailure;
  const failure = new Promise((_, reject) => {
    rejectFailure = reject;
  });
  const fail = (reason) => {
    const error = new Error(`MathJax: ${reason.message || reason}`);
    rejectFailure(error);
    return error;
  };
  const load = async (name) => {
    try {
      if (name === "mathjax/a11y/sre.js") {
        throw new Error(
          "speech engine resources are not packaged for offline SVG",
        );
      }
      const data = resources[name];
      if (!data) throw new Error(`offline resource ${name} is missing`);
      await import(data);
    } catch (reason) {
      throw fail(new Error(`${name}: ${reason.message || reason}`));
    }
  };
  globalThis.MathJax = {
    ...config,
    loader: {
      ...loader,
      load: components,
      paths: { mathjax: "mathjax", "mathjax-newcm": "mathjax-newcm" },
      require: load,
      failed: fail,
    },
    startup: { ...startup, output: "svg", typeset: false },
    output: { ...output, font: "mathjax-newcm", fontPath: "[mathjax-newcm]" },
    svg: {
      ...svg,
      fontCache: "local",
      dynamicPrefix: "[mathjax-newcm]/svg/dynamic",
    },
    tex: {
      ...config.tex,
      formatError: (_jax, error) => {
        throw fail(error);
      },
    },
    options: {
      ...config.options,
      compileError: (_document, _math, error) => {
        throw fail(error);
      },
      typesetError: (_document, _math, error) => {
        throw fail(error);
      },
    },
  };

  await Promise.race([
    (async () => {
      await load("mathjax/startup.js");
      await globalThis.MathJax.startup.promise;
      for (const [name, resource] of [
        ["tex", "mathjax/input/tex.js"],
        ["mml", "mathjax/input/mml.js"],
        ["svg", "mathjax/output/svg.js"],
      ]) {
        if (
          typeof globalThis.MathJax.startup.constructors[name] !== "function"
        ) {
          throw new Error(`MathJax: ${resource} did not register ${name}`);
        }
      }
      const mathml = globalThis.MathJax.startup.document.inputJax.find(
        (jax) => jax.name === "MathML",
      );
      mathml?.postFilters.add(({ data }) => {
        data.walkTree((node) => {
          if (!node.isKind("merror")) return;
          const message = node.attributes.get("data-mjx-message");
          if (message) {
            throw fail(new Error(`MathML validation failed: ${message}`));
          }
        });
      });
      await document.fonts.ready;
      await globalThis.MathJax.typesetPromise();
    })(),
    failure,
  ]);
};
