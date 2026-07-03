const ts = require("typescript");
const fs = require("fs");
const path = require("path");
const root = path.join(process.cwd(), "src");
const hookNames = new Set([
  "useState",
  "useEffect",
  "useMemo",
  "useCallback",
  "useRef",
  "useContext",
  "useReducer",
  "useLayoutEffect",
  "useImperativeHandle",
  "useDebugValue",
]);
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) walk(path.join(dir, entry.name));
    else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) files.push(path.join(dir, entry.name));
  }
}
walk(root);
const results = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const parent = new Map();
  function visit(node, par) {
    if (par) parent.set(node, par);
    ts.forEachChild(node, child => visit(child, node));
  }
  visit(sourceFile, null);
  function ancestors(node) {
    const out = [];
    let cur = parent.get(node);
    while (cur) {
      out.push(cur);
      cur = parent.get(cur);
    }
    return out;
  }
  function isHook(node) {
    if (!ts.isCallExpression(node)) return false;
    const expr = node.expression;
    if (ts.isIdentifier(expr) && hookNames.has(expr.text)) return true;
    if (ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.name) && hookNames.has(expr.name.text)) return true;
    return false;
  }
  function findFunctionAncestor(node) {
    return ancestors(node).find(
      a =>
        ts.isFunctionDeclaration(a) ||
        ts.isFunctionExpression(a) ||
        ts.isArrowFunction(a) ||
        ts.isMethodDeclaration(a)
    );
  }
  function report(node, msg) {
    const loc = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    results.push({
      file,
      line: loc.line + 1,
      column: loc.character + 1,
      msg,
      snippet: node.getText(sourceFile).replace(/\n/g, ' '),
    });
  }
  function traverse(node) {
    if (isHook(node)) {
      const anc = ancestors(node);
      const conditional = anc.some(
        a =>
          ts.isIfStatement(a) ||
          ts.isForStatement(a) ||
          ts.isForOfStatement(a) ||
          ts.isForInStatement(a) ||
          ts.isWhileStatement(a) ||
          ts.isDoStatement(a) ||
          ts.isSwitchStatement(a) ||
          ts.isConditionalExpression(a) ||
          ts.isCatchClause(a)
      );
      if (conditional) report(node, 'hook inside conditional/loop');
      const func = findFunctionAncestor(node);
      if (func && func.body && ts.isBlock(func.body)) {
        for (const stmt of func.body.statements) {
          if (stmt.getStart(sourceFile) < node.getStart(sourceFile) && ts.isReturnStatement(stmt)) {
            report(node, 'hook after return in function body');
            break;
          }
        }
      }
    }
    ts.forEachChild(node, traverse);
  }
  traverse(sourceFile);
}
for (const r of results) {
  console.log(`${r.file}:${r.line}:${r.column}: ${r.msg} --- ${r.snippet}`);
}
console.log('TOTAL', results.length);
