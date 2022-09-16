import { useEffect, useRef, useState } from "react";
import { EditorState, Extension, StateEffect } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { lineNumbers } from "@codemirror/gutter";
import { history } from "@codemirror/history";
import { solarizedDark } from "cm6-theme-solarized-dark";
import { solarizedLight } from "cm6-theme-solarized-light";
import { CodeMirror, vim, Vim } from "@replit/codemirror-vim";
import { format, addDays, parse, subDays } from "date-fns";
import { todotxt } from "./lib/language/todotxt";
import "./Editor.css";
import React from "react";
import { Line } from "@codemirror/text";
import { Task } from "./model/task";

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
});

const isDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
const themeMap = {
  light: solarizedLight,
  dark: solarizedDark,
};

const getCurrentLine = (state: EditorState): Line | undefined => {
  return state.selection.ranges
    .filter((range) => range.empty)
    .map((range) => state.doc.lineAt(range.head))
    .at(0);
};

const isTaskDone = (line: string): boolean => {
  return Task.build(line).isDone;
};

const handleMarkAsDone = (cm: CodeMirror): void => {
  const line = getCurrentLine(cm.cm6.state);
  if (!line) {
    return;
  }
  cm.cm6.dispatch({
    changes: {
      from: line.from,
      to: line.to,
      insert: Task.build(line.text).toggleAsDone().content,
    },
  });
};

const handleMarkPriority = (
  cm: CodeMirror,
  params: { args: string[] }
): void => {
  const inputPriority = params.args[0];
  const line = getCurrentLine(cm.cm6.state);
  if (!line) {
    return;
  }

  cm.cm6.dispatch({
    changes: {
      from: line.from,
      to: line.to,
      insert: Task.build(line.text).markPriority(inputPriority).content,
    },
  });
};

const handleChangePriority = (
  cm: CodeMirror,
  params: { args: string[] }
): void => {
  const line = getCurrentLine(cm.cm6.state);
  if (!line) {
    return;
  }
  const option = params.args[0] ?? null;
  let task = Task.build(line.text);
  if (option === "inc") {
    task = task.incrementPriority();
  } else if (option === "dec") {
    task = task.decrementPriority();
  }
  cm.cm6.dispatch({
    changes: {
      from: line.from,
      to: line.to,
      insert: task.content,
    },
  });
};

const handleSortByPriority = (cm: CodeMirror): void => {
  const lines = cm.cm6.state.doc.toString().split("\n");
  lines.sort(compareTaskByPriority);
  cm.cm6.dispatch({
    changes: {
      from: 0,
      to: cm.cm6.state.doc.length,
      insert: lines.join("\n"),
    },
  });
};

const compareTaskByPriority = (a: string, b: string): number => {
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

const compareTaskByDueDate = (a: string, b: string): number => {
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

const handleArchiveDone = (cm: CodeMirror, onArchive: OnArchiveFunc): void => {
  const currentLines = cm.cm6.state.doc.toString().split("\n");
  const doneContent = currentLines
    .filter((line) => isTaskDone(line))
    .join("\n");
  const content = currentLines.filter((line) => !isTaskDone(line)).join("\n");
  const lines = content.split("\n");
  const todoList = lines.filter(
    (line) => !isTaskDone(line) && !line.match(/^\s*$/)
  );
  const doneList = lines.filter((line) => isTaskDone(line));
  onArchive({
    doneContent: doneContent,
    content: content,
    todoList: todoList,
    doneList: doneList,
  });
};

const handleChangeDueDate = (
  cm: CodeMirror,
  params: { args: string[] }
): void => {
  const line = getCurrentLine(cm.cm6.state);
  if (!line) {
    return;
  }
  if (isTaskDone(line.text)) {
    return;
  }
  const incrementOrDecrementFunc =
    params.args[0] === "inc"
      ? (date: Date): Date => addDays(date, 1)
      : params.args[0] === "dec"
      ? (date: Date): Date => subDays(date, 1)
      : null;
  if (!incrementOrDecrementFunc) {
    return;
  }
  const dueDateMatch = line.text.match(/due:(\d{4}-\d{2}-\d{2})/);
  if (!dueDateMatch) {
    cm.cm6.dispatch({
      changes: {
        from: line.to,
        insert: ` due:${format(
          incrementOrDecrementFunc(new Date()),
          "yyyy-LL-dd"
        )}`,
      },
    });
    return;
  }
  try {
    const parsed = parse(dueDateMatch[1], "yyyy-LL-dd", new Date());
    const replaced = line.text.replace(
      `due:${dueDateMatch[1]}`,
      `due:${format(incrementOrDecrementFunc(parsed), "yyyy-LL-dd")}`
    );
    cm.cm6.dispatch({
      changes: {
        from: line.from,
        to: line.to,
        insert: replaced,
      },
    });
  } catch (err) {
    return;
  }
};

interface Props {
  onChange: (content: string, todoList: string[], doneList: string[]) => void;
  onArchive: OnArchiveFunc;
  content: string;
  lineWrapping: boolean;
}

type OnArchiveFunc = (archiveContentInfo: ArchiveContentInfo) => void;

const Editor: React.FC<Props> = ({
  onChange,
  onArchive,
  content,
  lineWrapping,
}) => {
  const [theme, setTheme] = useState<"dark" | "light">(
    isDark() ? "dark" : "light"
  );
  const viewRef = useRef<EditorView>(null!);
  const containerRef = useRef<HTMLDivElement>(null);
  const onArchiveRef = useRef<OnArchiveFunc>(onArchive);

  useEffect(() => {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (event) => {
        setTheme(isDark() ? "dark" : "light");
      });
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const [vimStyle, vimPlugin, , vimPanelState] = vim() as Extension[];
      let extensions = [
        history(),
        lineNumbers(),
        vimStyle,
        vimPlugin,
        vimPanelState,
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
            onChange(content, todoList, doneList);
          }
        }),
      ];
      if (lineWrapping) {
        extensions.push(EditorView.lineWrapping);
      }
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
    Vim.map(",D", ":todotxtArchiveDone", "normal");
    Vim.defineEx(
      "todotxtArchiveDone",
      null,
      (cm: CodeMirror) =>
        onArchiveRef.current && handleArchiveDone(cm, onArchiveRef.current)
    );
    Vim.map(",p", ":todotxtChangeDueDate inc", "normal");
    Vim.map(",P", ":todotxtChangeDueDate dec", "normal");
    Vim.defineEx("todotxtChangeDueDate", null, handleChangeDueDate);
  }, []);
  return <div ref={containerRef} className="editor-container" />;
};

export default Editor;
