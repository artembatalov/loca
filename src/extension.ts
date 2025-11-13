import * as vscode from 'vscode';

/**
 * Defines the LOC severity categories based on function size.
 */
type LocCategory = 'green' | 'orange' | 'red';

/**
 * Represents all collected metrics for a single function:
 *  - its full range,
 *  - the range of its signature,
 *  - and its LOC value.
 */
interface FunctionMetric {
  range: vscode.Range;
  signatureRange: vscode.Range;
  loc: number;
}

/**
 * Tracks the currently active editor. Updated whenever the user
 * switches tabs or opens a new file.
 */
let activeEditor: vscode.TextEditor | undefined;

/**
 * Stores the debounce timer used to avoid recalculating metrics
 * on every keystroke.
 */
let updateTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Decoration type used for inline "LOC: X" labels that appear
 * next to the function signature.
 */
const inlineDecoration = vscode.window.createTextEditorDecorationType({
  after: {
    margin: '0 0 0 1.1rem',
    fontStyle: 'normal',
    fontWeight: 'bold',
  },
});

/**
 * Background highlight styles applied to entire function ranges
 * depending on their LOC category (green / orange / red).
 */
const highlightDecorations: Record<LocCategory, vscode.TextEditorDecorationType> = {
  green: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
    isWholeLine: true,
  }),
  orange: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 152, 0, 0.12)',
    isWholeLine: true,
  }),
  red: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(244, 67, 54, 0.14)',
    isWholeLine: true,
  }),
};

/**
 * Text colors used for inline LOC labels, aligned with
 * the same severity categories.
 */
const categoryColors: Record<LocCategory, string> = {
  green: '#4CAF50',
  orange: '#FF9800',
  red: '#F44336',
};


/** 
 * VS code plugin's starting point function
 * @param {vscode.ExtensionContext} context Keeps plugin context
*/
export function activate(context: vscode.ExtensionContext) {
  const refreshMetricsCommand = vscode.commands.registerCommand('loca.recalculateMetrics', () => {
    if (!activeEditor) {
      vscode.window.showInformationMessage('LOCA: open a file to analyze its functions.');
      return;
    }

    refreshDecorations(activeEditor);
    vscode.window.showInformationMessage('LOCA metrics recalculated.');
  });

  context.subscriptions.push(
    refreshMetricsCommand,
    inlineDecoration,
    ...Object.values(highlightDecorations),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      activeEditor = editor;
      if (editor) {
        triggerUpdate(editor);
      }
    }),
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (activeEditor && event.document === activeEditor.document) {
        triggerUpdate(activeEditor);
      }
    }),
  );

  activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    triggerUpdate(activeEditor);
  }
}

/**
 * VS code plugin's deactivation function
 * 
 * Cleaning update timer
 */
export function deactivate() {
  clearTimeout(updateTimer);
}

/**
 * Schedules a deferred LOC update (debounce).
 * If the user keeps typing, the previously scheduled update is canceled.
 * A new timer is started, and the actual refresh runs only after the user
 * pauses for ~250 ms.
 * 
 * @param {vscode.TextEditor} editor Editor where backlight need to be updated
 */
export function triggerUpdate(editor: vscode.TextEditor) {
  if (updateTimer) {
    clearTimeout(updateTimer);
  }

  updateTimer = setTimeout(() => refreshDecorations(editor), 250);
}

/**
 * Updates all LOC-related decorations in the editor.
 *
 * Steps:
 *  1. Analyzes the document and retrieves LOC metrics for each function.
 *  2. Clears decorations if the document contains no functions.
 *  3. Groups function ranges by LOC category (green, orange, red).
 *  4. Builds inline "LOC: X" labels placed next to each function signature.
 *  5. Applies background highlights and inline decorations to the editor.
 *
 * Red-category functions receive an additional warning message,
 * which can be removed by disabling the corresponding conditional block.
 *
 * @param {vscode.TextEditor} editor The editor where decorations should be refreshed.
 */
export async function refreshDecorations(editor: vscode.TextEditor) {
  const metrics = await analyzeDocument(editor.document);

  if (!metrics.length) {
    clearAllDecorations(editor);
    return;
  }

  const backgroundBuckets: Record<LocCategory, vscode.Range[]> = {
    green: [],
    orange: [],
    red: [],
  };
  const inlineEntries: vscode.DecorationOptions[] = [];

  for (const metric of metrics) {
    const category = getLocCategory(metric.loc);
    backgroundBuckets[category].push(metric.range);

    const inlinePosition = metric.signatureRange.end;
    const inlineRenderAfter: vscode.DecorationInstanceRenderOptions['after'] = {
      contentText: ` LOC: ${metric.loc}`,
      color: categoryColors[category],
    };

    inlineEntries.push({
      range: new vscode.Range(inlinePosition, inlinePosition),
      renderOptions: {
        after: inlineRenderAfter,
      },
    });
  }

  for (const category of Object.keys(backgroundBuckets) as LocCategory[]) {
    editor.setDecorations(highlightDecorations[category], backgroundBuckets[category]);
  }

  editor.setDecorations(inlineDecoration, inlineEntries);
}

/**
 * Analyzes a document and extracts LOC metrics for all function-like symbols.
 *
 * Process:
 *  1. Requests the document's symbol tree via VS Code's DocumentSymbolProvider.
 *  2. Performs a DFS traversal of the symbol tree.
 *  3. Filters out all symbols that are not functions, methods, or constructors.
 *  4. Computes LOC for each function using `countLoc`.
 *  5. Stores metrics in a Map to avoid duplicates.
 *  6. Returns a flat array of all collected function metrics.
 *
 * @param {vscode.TextDocument} document Document to analyze.
 *
 * @returns {Promise<FunctionMetric[]>} List of LOC metrics for all discovered functions.
 */
export async function analyzeDocument(document: vscode.TextDocument): Promise<FunctionMetric[]> {
  let symbols: vscode.DocumentSymbol[] | undefined;

  try {
    symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
      'vscode.executeDocumentSymbolProvider',
      document.uri,
    );
  } catch {
    symbols = undefined;
  }

  if (!symbols) {
    return [];
  }

  const metrics = new Map<string, FunctionMetric>();
  const stack: vscode.DocumentSymbol[] = [...symbols];

  while (stack.length) {
    const symbol = stack.pop();
    if (!symbol) {
      continue;
    }

    stack.push(...symbol.children);

    if (!isFunctionSymbol(symbol)) {
      continue;
    }

    const loc = countLoc(document, symbol);
    if (loc >= 0) {
      const key = getMetricKey(symbol);
      metrics.set(key, {
        range: symbol.range,
        signatureRange: symbol.selectionRange,
        loc,
      });
    }
  }

  return [...metrics.values()];
}

/**
 * Counts the number of meaningful lines of code (LOC) inside a function.
 *
 * Steps:
 *  1. Determines the line where the function signature ends.
 *  2. Iterates through all lines in the function body.
 *  3. Ignores empty lines and comment lines using `isIgnorableLine`.
 *  4. Returns the total number of non-ignored lines.
 *
 * Signature lines are never counted, even if the signature spans multiple lines.
 * 
 * @param {vscode.TextDocument} document Document containing the function.
 * @param {vscode.DocumentSymbol} symbol Symbol representing the function whose LOC is being measured.
 * @returns {number} Number of meaningful LOC inside the function.
 */
export function countLoc(document: vscode.TextDocument, symbol: vscode.DocumentSymbol): number {
  const startLine = symbol.range.start.line;
  const endLine = symbol.range.end.line;
  const signatureEndLine = Math.max(symbol.selectionRange.end.line, startLine);

  if (endLine <= signatureEndLine) {
    return 0;
  }

  let loc = 0;
  for (let lineNumber = signatureEndLine + 1; lineNumber <= endLine; lineNumber += 1) {
    const text = document.lineAt(lineNumber).text;
    if (!isIgnorableLine(text)) {
      loc += 1;
    }
  }

  return loc;
}

/**
 * Determines whether a line of text should be ignored when counting LOC.
 * 
 * @param line The raw line of text from the document.
 * @returns True if the line should not be counted as LOC, false otherwise.
 */
export function isIgnorableLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) {
    // empty line
    return true;
  }

  if (
    trimmed.startsWith('//') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('--') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('*/')
  ) {
    return true;
  }

  if (/^\/\*.*\*\/$/.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Checks whether a DocumentSymbol represents a function-like element.
 * 
 * Accepted symbol kinds:
 * - Function      (standalone functions)
 * - Method        (class or object methods)
 * - Constructor   (class constructors)
 * 
 * @param {vscode.DocumentSymbol} symbol Symbol to check
 * @return {boolean} True if symbol is a function, method, or constructor, false otherwise.
 */
export function isFunctionSymbol(symbol: vscode.DocumentSymbol): boolean {
  return (
    symbol.kind === vscode.SymbolKind.Function ||
    symbol.kind === vscode.SymbolKind.Method ||
    symbol.kind === vscode.SymbolKind.Constructor
  );
}

/**
 * Determines the LOC category for a function based on its size.
 * 
 * @param {number} loc Number of code inside the function body.
 * @returns {LocCategory} The corresponding LOC category ("green", "orange", or "red").
 */
export function getLocCategory(loc: number): LocCategory {
  if (loc <= 35) {
    return 'green';
  }

  if (loc <= 60) {
    return 'orange';
  }

  return 'red';
}

/**
 * Generates a unique key for a function symbol based on its signature range.
 * 
 * @param symbol The symbol representing a function, method, or constructor.
 * @returns {string} A unique position-based key for the symbol.
 */
export function getMetricKey(symbol: vscode.DocumentSymbol): string {
  const start = symbol.selectionRange.start;
  const end = symbol.selectionRange.end;
  return `${start.line}:${start.character}-${end.line}:${end.character}`;
}

/**
 * Clears all LOC-related decorations from the editor.
 * 
 * This removes:
 * - inline "LOC: X" labels
 * - background highlight
 * 
 * Decorations are cleared by applying each decoration type with an
 * empty range array, which instructs VS Code to remove them.
 * @param {vscode.TextEditor} editor Editor from which all decorations should be removed.
 */
export function clearAllDecorations(editor: vscode.TextEditor) {
  editor.setDecorations(inlineDecoration, []);
  for (const decoration of Object.values(highlightDecorations)) {
    editor.setDecorations(decoration, []);
  }
}