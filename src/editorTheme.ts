const editorTheme = {
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
  ".cm-vimMode .cm-line": {
    caretColor: "transparent !important",
  },
  ".cm-fat-cursor": {
    position: "absolute",
    background: "#ff9696",
    border: "none",
    whiteSpace: "pre",
  },
  "&:not(.cm-focused) .cm-fat-cursor": {
    background: "none",
    outline: "solid 1px #ff9696",
  },
  ".cm-panels.cm-panels-bottom": {
    borderTop: "1px solid rgba(102, 102, 102, 0.2) !important",
  },
  ".cm-panels": {
    backgroundColor: "transparent !important",
    color: "#657b83 !important",
  },
  ".cm-panels input": {
    color: "#657b83",
  },
  ".cm-hyper-link-icon svg": {
    color: "#2aa198",
  },
  "@media (prefers-color-scheme: dark)": {
    ".cm-panels.cm-panels-bottom": {
      borderTop: "1px solid rgba(255, 255, 255, 0.2) !important",
    },
    ".cm-panels": {
      backgroundColor: "transparent !important",
      color: "#93a1a1 !important",
    },
    ".cm-panels input": {
      color: "#93a1a1",
    },
  },
};

export default editorTheme;
