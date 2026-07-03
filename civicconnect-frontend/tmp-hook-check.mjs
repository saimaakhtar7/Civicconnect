import ts from 'typescript';
import fs from 'fs';
import path from 'path';
const hookNames = new Set([
  'useState',
  'useEffect',
  'useMemo',
  'useCallback',
  'useRef',
  'useContext',
  'useReducer',
  'useImperativeHandle',
  'useLayoutEffect',
  'useDebugValue',
]);
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') return [];
      return walk(full);
    }
    if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name)) return [full];
    return [];
  });
}
function isHookCall(node) {
  if (!ts.isCallExpression(node)) return false;
  const expr = node.expression;
  if (ts.isIdentifier(expr) && hookNames.has(expr.escapedText)) return true;
  if (ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.name) && hookNames.has(expr.name.escapedText)) return true;
  return false;
}
function scanFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const issues = [];
  function visit(node) {
    if (isHookCall(node)) {
      let cur = node.parent;
      while (cur && !ts.isFunctionLike(cur) && !ts.isSourceFile(cur)) {
        if (
          ts.isIfStatement(cur) ||
          ts.isSwitchStatement(cur) ||
          ts.isForStatement(cur) ||
          ts.isForInStatement(cur) ||
          ts.isForOfStatement(cur) ||
          ts.isWhileStatement(cur) ||
          ts.isDoStatement(cur) ||
          ts.isConditionalExpression(cur)
        ) {
          const pos = source.getLineAndCharacterOfPosition(node.getStart());
          issues.push({
            file,
            line: pos.line + 1,
            column: pos.character + 1,
            hook: node.expression.getText(source),
            context: ts.SyntaxKind[cur.kind],
            snippet: cur.getText(source).slice(0, 220).replace(/\s+/g, ' '),
          });
          break;
        }
        cur = cur.parent;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return issues;
}
function scanAll() {
  const files = walk(path.resolve('src'));
  const findings = [];
  for (const file of files) {
    findings.push(...scanFile(file));
  }
  console.log(JSON.stringify(findings, null, 2));
}
scanAll();
