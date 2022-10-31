import { useEffect, useRef, useState } from "react";
import { EditorState, Extension, StateEffect } from "@codemirror/state";
import { EditorView, lineNumbers } from "@codemirror/view";
import { history } from "@codemirror/commands";
import { solarizedDark } from "cm6-theme-solarized-dark";
import { solarizedLight } from "cm6-theme-solarized-light";
import { CodeMirror, vim, Vim } from "@replit/codemirror-vim";
import { todotxt } from "./lib/language/todotxt";
import { hyperLink } from "@uiw/codemirror-extensions-hyper-link";
import { dueDate } from "./dueDateExtension";
import "./Editor.css";
import React from "react";
import { Line } from "@codemirror/state";
import { Task } from "./model/task";
import compareTask from "./compareTask";
import editorTheme from "./editorTheme";
import { completeContext, completeProject } from "./complete";
import { autocompletion } from "@codemirror/autocomplete";

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
  const tasks = cm.cm6.state.doc.toString().split("\n").map(Task.build);
  tasks.sort(compareTask);
  cm.cm6.dispatch({
    changes: {
      from: 0,
      to: cm.cm6.state.doc.length,
      insert: tasks.map((task) => task.content).join("\n"),
    },
  });
};

const handleArchiveDone = (cm: CodeMirror, onArchive: OnArchiveFunc): void => {
  const tasks = cm.cm6.state.doc.toString().split("\n").map(Task.build);
  const doneTasks = tasks.filter((task) => task.isDone && !task.isEmpty());
  const todoTasks = tasks.filter((task) => !task.isDone && !task.isEmpty());

  onArchive({
    doneContent: doneTasks.map((task) => task.content).join("\n"),
    content: todoTasks.map((task) => task.content).join("\n"),
    doneList: doneTasks.map((task) => task.content),
    todoList: todoTasks.map((task) => task.content),
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
  const option = params.args[0] ?? null;
  let task = Task.build(line.text);
  if (option === "inc") {
    task = task.incrementDueDate();
  } else if (option === "dec") {
    task = task.decrementDueDate();
  }
  cm.cm6.dispatch({
    changes: {
      from: line.from,
      to: line.to,
      insert: task.content,
    },
  });
};

interface Props {
  onChange: (content: string, todoList: string[], doneList: string[]) => void;
  onArchive: OnArchiveFunc;
  content: string;
  lineWrapping: boolean;
  font: {
    size: number;
    family: string;
  };
}

type OnArchiveFunc = (archiveContentInfo: ArchiveContentInfo) => void;

const Editor: React.FC<Props> = ({
  onChange,
  onArchive,
  content,
  lineWrapping,
  font,
}) => {
  const [theme, setTheme] = useState<"dark" | "light">(
    isDark() ? "dark" : "light"
  );
  const viewRef = useRef<EditorView>(null!);
  const containerRef = useRef<HTMLDivElement>(null);
  const onArchiveRef = useRef<OnArchiveFunc>(onArchive);
  const [projects, setProjects] = useState<string[]>([]);
  const [contexts, setContexts] = useState<string[]>([]);
  const updateTimer = useRef<NodeJS.Timeout | null>(null);

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
      const transparentTheme = EditorView.theme({
        ...editorTheme,
        "&": {
          ...editorTheme["&"],
          fontSize: `${font.size}px`,
        },
        ".cm-content": {
          fontFamily: font.family,
        },
      });
      let extensions = [
        history(),
        lineNumbers(),
        vimStyle,
        vimPlugin,
        vimPanelState,
        todotxt(),
        autocompletion({
          override: [
            (context) => completeProject(context, projects),
            (context) => completeContext(context, contexts),
          ],
        }),
        hyperLink,
        dueDate,
        themeMap[theme],
        transparentTheme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            if (updateTimer.current) {
              clearTimeout(updateTimer.current);
            }
            updateTimer.current = setTimeout(() => {
              const content = update.state.doc.toString();
              const tasks = content.split("\n").map(Task.build);
              const todoTasks = tasks.filter(
                (task) => !task.isDone && !task.isEmpty()
              );
              const doneTasks = tasks.filter(
                (task) => task.isDone && !task.isEmpty()
              );
              setProjects([...new Set(tasks.flatMap((task) => task.projects))]);
              setContexts([...new Set(tasks.flatMap((task) => task.contexts))]);
              onChange(
                content,
                todoTasks.map((task) => task.content),
                doneTasks.map((task) => task.content)
              );
              updateTimer.current = null;
            }, 1000);
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
  }, [theme, onChange, lineWrapping, font, contexts, projects]);

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
