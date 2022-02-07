import { useEffect, useRef, useState } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { lineNumbers } from "@codemirror/gutter";
import { oneDark } from "@codemirror/theme-one-dark";
import { vim } from "@replit/codemirror-vim";

const transparentTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent !important",
    height: "100%",
  },
});

const Editor = ({ onChange }) => {
  const [editorView, setEditorView] = useState();
  const containerRef = useRef(null);
  useEffect(() => {
    const startState = EditorState.create({
      doc: "Hello World!",
      extensions: [
        lineNumbers(),
        vim(),
        oneDark,
        transparentTheme,
        EditorView.updateListener.of((update) => {
          if (update.changes) {
            onChange && onChange(update.state);
          }
        }),
      ],
    });
    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });
    setEditorView(view);
  }, []);
  return <div ref={containerRef} />;
};

export default Editor;
