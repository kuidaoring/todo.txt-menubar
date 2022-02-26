import { useEffect, useRef, useState } from "react";
import { EditorState, StateEffect } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { lineNumbers } from "@codemirror/gutter";
import { solarizedDark } from "cm6-theme-solarized-dark";
import { solarizedLight } from "cm6-theme-solarized-light";
import { vim, Vim } from "@replit/codemirror-vim";
import { format } from "date-fns";
import { todotxt } from "./lib/language/todotxt";
import "./Editor.css";

const transparentTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent !important",
    height: "100%",
  },
  ".cm-gutters": {
    backgroundColor: "transparent !important",
  },
  "&.cm-editor.cm-focused": {
    outline: "none",
  },
  "&.cm-editor": {
    height: "100%",
  },
  "&.cm-scroller": {
    overflow: "auto",
  },
});

const isDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
const themeMap = {
  light: solarizedLight,
  dark: solarizedDark,
};

const getCurrentLine = (state) => {
  return state.selection.ranges
    .filter((range) => range.empty)
    .map((range) => state.doc.lineAt(range.head))
    .at(0);
};

const isTaskDone = (line) => {
  return line.startsWith("x ");
};

const handleMarkAsDone = (cm) => {
  const line = getCurrentLine(cm.cm6.viewState.state);
  if (isTaskDone(line.text)) {
    unMarkAsDone(line, cm.cm6);
  } else {
    markAsDone(line, cm.cm6);
  }
};

const markAsDone = (line, view) => {
  const dateWord = format(new Date(), "yyyy-LL-dd");
  const matchPriority = /^\(([A-Za-z])\) */.exec(line.text);
  const priorityTrimmed = line.text.replace(/^\([A-Za-z]\) /, "");
  const priorityLabel =
    matchPriority && matchPriority[1] ? ` pri:${matchPriority[1]}` : "";
  const result = `x ${dateWord} ${priorityTrimmed}${priorityLabel}`;
  view.dispatch({
    changes: {
      from: line.from,
      to: line.to,
      insert: result,
    },
  });
};

const unMarkAsDone = (line, view) => {
  const matchPriorityLabel = / pri:([A-Za-z])(\s|$)/.exec(line.text);
  const priorityWord =
    matchPriorityLabel && matchPriorityLabel[1]
      ? `(${matchPriorityLabel[1]}) `
      : "";
  const priorityTrimmed = line.text.replace(/ pri:([A-Za-z])(\s|$)?/, "");
  const doneTrimmed = priorityTrimmed.replace(/^x (\d{4}-\d{2}-\d{2} )?/, "");
  view.dispatch({
    changes: {
      from: line.from,
      to: line.to,
      insert: `${priorityWord}${doneTrimmed}`,
    },
  });
};

const handleMarkPriority = (cm, params) => {
  const inputPriority = params.args[0];
  const line = getCurrentLine(cm.cm6.viewState.state);
  if (isTaskDone(line.text)) {
    return;
  }
  const regexp = new RegExp(`^\\(${inputPriority}\\) `);
  if (line.text.match(regexp)) {
    unMarkPriority(inputPriority, line, cm.cm6);
  } else {
    markPriority(inputPriority, line, cm.cm6);
  }
};

const markPriority = (priority, line, view) => {
  let to = line.from;
  if (line.text.match(/^\([A-Z]\) /)) {
    to += 4;
  }
  view.dispatch({
    changes: {
      from: line.from,
      to: to,
      insert: `(${priority}) `,
    },
  });
};

const unMarkPriority = (priority, line, view) => {
  const regexp = new RegExp(`^\\(${priority}\\) `);
  const result = line.text.replace(regexp, "");
  view.dispatch({
    changes: {
      from: line.from,
      to: line.to,
      insert: result,
    },
  });
};

const handleChangePriority = (cm, params) => {
  const line = getCurrentLine(cm.cm6.viewState.state);
  const matches = line.text.match(/^\(([A-Za-z])\) /);
  if (!matches) {
    return;
  }
  const currentPriority = matches[1].toUpperCase();
  const option = params.args[0] ?? null;
  const charCode =
    option === "inc"
      ? currentPriority.charCodeAt() - 1
      : option === "dec"
      ? currentPriority.charCodeAt() + 1
      : -1;
  if (charCode < "A".charCodeAt() || charCode > "Z".charCodeAt()) {
    return;
  }

  cm.cm6.dispatch({
    changes: {
      from: line.from + 1,
      to: line.from + 2,
      insert: String.fromCharCode(charCode),
    },
  });
};

const handleSortByPriority = (cm) => {
  const lineArray = cm.cm6.state.doc.toString().split("\n");
  lineArray.sort(compareTaskByPriority);
  cm.cm6.dispatch({
    changes: {
      from: 0,
      to: cm.cm6.state.doc.length,
      insert: lineArray.join("\n"),
    },
  });
};

const compareTaskByPriority = (a, b) => {
  const isATaskDone = isTaskDone(a);
  const isBTaskDone = isTaskDone(b);
  if (isATaskDone && isBTaskDone) {
    return compareTaskByDueDate(a, b);
  }
  if (isBTaskDone) {
    return -1;
  }
  if (isATaskDone) {
    return 1;
  }
  const aMatches = a.match(/^\(([A-Za-z])\) /);
  const bMatches = b.match(/^\(([A-Za-z])\) /);
  if (!aMatches && !bMatches) {
    return compareTaskByDueDate(a, b);
  }
  if (!bMatches) {
    return -1;
  }
  if (!aMatches) {
    return 1;
  }
  const aPriority = aMatches[1].toUpperCase();
  const bPriority = bMatches[1].toUpperCase();
  if (aPriority === bPriority) {
    return compareTaskByDueDate(a, b);
  }
  if (aPriority < bPriority) {
    return -1;
  }
  return 1;
};

const compareTaskByDueDate = (a, b) => {
  const aMatches = a.match(/due:(\d{4}-\d{2}-\d{2})/);
  const bMatches = b.match(/due:(\d{4}-\d{2}-\d{2})/);
  if (!aMatches && !bMatches) {
    return 0;
  }
  if (aMatches && bMatches) {
    if (aMatches[1] === bMatches[1]) {
      return 0;
    }
    if (aMatches[1] < bMatches[1]) {
      return -1;
    }
    return 1;
  }
  if (aMatches) {
    return -1;
  }
  return 1;
};

const Editor = ({ onChange, content }) => {
  const [theme, setTheme] = useState(isDark() ? "dark" : "light");
  const viewRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (event) => {
        setTheme(isDark() ? "dark" : "light");
      });
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const extensions = [
        lineNumbers(),
        vim(),
        todotxt(),
        themeMap[theme],
        transparentTheme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const content = update.state.doc.toString();
            const lines = content.split("\n");
            const todoList = lines.filter(
              (line) => !isTaskDone(line) && !line.match(/^\s*$/)
            );
            const doneList = lines.filter((line) => isTaskDone(line));
            onChange && onChange(content, todoList, doneList);
          }
        }),
      ];
      if (!viewRef.current) {
        const startState = EditorState.create({
          doc: "",
          extensions: extensions,
        });
        const view = new EditorView({
          state: startState,
          parent: containerRef.current,
        });
        viewRef.current = view;
      } else {
        viewRef.current.dispatch({
          effects: StateEffect.reconfigure.of(extensions),
        });
      }
    }
  }, [theme]);

  useEffect(() => {
    if (viewRef.current) {
      const currentContent = viewRef.current.state.doc.toString();
      if (content !== currentContent) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: viewRef.current.state.doc.length,
            insert: content,
          },
        });
      }
    }
  }, [content]);

  useEffect(() => {
    Vim.unmap(",");
    Vim.map(",x", ":todotxtMarkAsDone", "normal");
    Vim.defineEx("todotxtMarkAsDone", null, handleMarkAsDone);
    Vim.map(",a", ":todotxtMarkPriority A", "normal");
    Vim.map(",b", ":todotxtMarkPriority B", "normal");
    Vim.map(",c", ":todotxtMarkPriority C", "normal");
    Vim.defineEx("todotxtMarkPriority", null, handleMarkPriority);
    Vim.map(",k", ":todotxtChangePriority inc", "normal");
    Vim.map(",j", ":todotxtChangePriority dec", "normal");
    Vim.defineEx("todotxtChangePriority", null, handleChangePriority);
    Vim.map(",s", ":todotxtSortByPriority", "normal");
    Vim.defineEx("todotxtSortByPriority", null, handleSortByPriority);
  }, []);
  return <div ref={containerRef} className="editor-container" />;
};

export default Editor;
