import { useEffect, useRef, useState } from "react";
import { EditorState, StateEffect } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { lineNumbers } from "@codemirror/gutter";
import { solarizedDark } from "cm6-theme-solarized-dark";
import { solarizedLight } from "cm6-theme-solarized-light";
import { vim } from "@replit/codemirror-vim";
import { todotxt } from "./lib/language/todotxt";

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
});

const isDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
const themeMap = {
  light: solarizedLight,
  dark: solarizedDark,
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
          if (update.changes) {
            onChange && onChange(update.state.doc.toString());
          }
        }),
      ];
      if (!viewRef.current) {
        const startState = EditorState.create({
          doc: content,
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
  return <div ref={containerRef} />;
};

export default Editor;
