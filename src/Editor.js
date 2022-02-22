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

const markAsDone = (cm) => {
  const state = cm.cm6.viewState.state;
  const line = state.selection.ranges
    .filter((range) => range.empty)
    .map((range) => state.doc.lineAt(range.head))
    .at(0);
  const dateWord = format(new Date(), "yyyy-LL-dd");
  const matchPriority = /^\(([A-Za-z])\) */.exec(line.text);
  const priorityReplacedTaskText = line.text.replace(/^\([A-Za-z]\) /, "");
  const priorityLabel =
    matchPriority && matchPriority[1] ? ` pri:${matchPriority[1]}` : "";
  const result = `x ${dateWord} ${priorityReplacedTaskText}${priorityLabel}`;
  cm.cm6.dispatch({
    changes: {
      from: line.from,
      to: line.to,
      insert: result,
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
    Vim.defineEx("todotxtMarkAsDone", null, markAsDone);
    Vim.map(",x", ":todotxtMarkAsDone", "normal");
  }, []);
  return <div ref={containerRef} className="editor-container" />;
};

export default Editor;
