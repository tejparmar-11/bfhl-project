const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const USER_ID = "tejasparmar_11092004";
const EMAIL = "tp1633@srmist.edu.in";
const ROLL = "RA2311050010052";

function isValidEdge(edge) {
  if (!edge) return false;
  const trimmed = edge.trim();
  return /^[A-Z]->[A-Z]$/.test(trimmed) && trimmed[0] !== trimmed[3];
}

app.post('/bfhl', (req, res) => {
  const input = req.body.data || [];

  const invalid = [];
  const duplicates = [];
  const seen = new Set();
  const edges = [];

  for (let e of input) {
    const trimmed = e.trim();

    if (!isValidEdge(trimmed)) {
      invalid.push(trimmed);
      continue;
    }

    if (seen.has(trimmed)) {
      if (!duplicates.includes(trimmed)) duplicates.push(trimmed);
      continue;
    }

    seen.add(trimmed);
    edges.push(trimmed);
  }

  const graph = {};
  const childSet = new Set();

  for (let e of edges) {
    const [u, v] = e.split('->');

    if (!graph[u]) graph[u] = [];
    graph[u].push(v);

    childSet.add(v);
  }

  const nodes = new Set();
  edges.forEach(e => {
    const [u, v] = e.split('->');
    nodes.add(u);
    nodes.add(v);
  });

  let roots = [...nodes].filter(n => !childSet.has(n));
  if (roots.length === 0 && nodes.size > 0) {
    roots = [[...nodes].sort()[0]];
  }

  const hierarchies = [];
  let totalCycles = 0;

  function dfs(node, path) {
    if (path.has(node)) return { cycle: true };

    path.add(node);

    let subtree = {};
    let maxDepth = 1;

    for (let nei of (graph[node] || [])) {
      const res = dfs(nei, new Set(path));
      if (res.cycle) return { cycle: true };

      subtree[nei] = res.tree;
      maxDepth = Math.max(maxDepth, res.depth + 1);
    }

    return { tree: subtree, depth: maxDepth };
  }

  for (let root of roots) {
    const res = dfs(root, new Set());

    if (res.cycle) {
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true
      });
      totalCycles++;
    } else {
      hierarchies.push({
        root,
        tree: { [root]: res.tree },
        depth: res.depth
      });
    }
  }

  let totalTrees = hierarchies.filter(h => !h.has_cycle).length;

  let bestRoot = null;
  let bestDepth = -1;

  for (let h of hierarchies) {
    if (!h.has_cycle) {
      if (
        h.depth > bestDepth ||
        (h.depth === bestDepth && h.root < bestRoot)
      ) {
        bestDepth = h.depth;
        bestRoot = h.root;
      }
    }
  }

  res.json({
    user_id: USER_ID,
    email_id: EMAIL,
    college_roll_number: ROLL,
    hierarchies,
    invalid_entries: invalid,
    duplicate_edges: duplicates,
    summary: {
      total_trees: totalTrees,
      total_cycles: totalCycles,
      largest_tree_root: bestRoot
    }
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});