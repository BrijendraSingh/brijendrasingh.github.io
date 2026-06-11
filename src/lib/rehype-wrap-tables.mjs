/** Wrap <table> in a scroll container for small viewports. */
export function rehypeWrapTables() {
  return (tree) => {
    walk(tree);
  };
}

function walk(node) {
  if (!node.children) return;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child.type !== "element") continue;

    if (child.tagName === "table") {
      node.children[i] = {
        type: "element",
        tagName: "div",
        properties: { className: ["prose-table-wrap"] },
        children: [child],
      };
    } else {
      walk(child);
    }
  }
}
