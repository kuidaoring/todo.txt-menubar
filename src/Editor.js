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

const handleMarkAsDone = (cm) => {
  const line = getCurrentLine(cm.cm6.viewState.state);
  if (line.text.match(/^x /)) {
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
  if (line.text.match(/^x /)) {
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
            onChange && onChange(update.state.doc.toString());
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
  }, []);
  return <div ref={containerRef} className="editor-container" />;
};

export default Editor;
