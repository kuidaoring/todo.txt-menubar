import { useCallback, useReducer } from "react";
import { useEffect, useRef } from "react/cjs/react.development";
import "./App.css";
import Editor from "./Editor";

const ActionType = {
  UPDATE: "update",
  SAVE: "save",
};

const SAVE_DELAY_MS = 5000;

const initialState = {
  content: "",
  todoList: [],
  doneList: [],
};

const reducer = (state, action) => {
  switch (action.type) {
    case ActionType.UPDATE:
      const lines = action.content.split("\n");
      const todoList = lines.filter(
        (line) => !line.startsWith("x ") && !line.match(/^\s*$/)
      );
      const doneList = lines.filter((line) => line.startsWith("x "));
      window.electronAPI.setTaskCount(todoList.length, doneList.length);
      return {
        content: action.content,
        todoList: todoList,
        doneList: doneList,
      };
    case ActionType.SAVE:
      window.electronAPI.save(state.content);
      return state;
    default:
      return state;
  }
};

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const timeoutRef = useRef(null);
  useEffect(() => {
    window.electronAPI.on("did-finish-load-todotxt-file", (event, content) => {
      dispatch({
        type: ActionType.UPDATE,
        content: content,
        dispatch: dispatch,
      });
    });
  }, []);
  const saveTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      dispatch({ type: ActionType.SAVE });
    }, SAVE_DELAY_MS);
  }, []);
  return (
    <div className="App">
      <header>
        ToDo : {state.todoList.length}, Done: {state.doneList.length}
      </header>
      <Editor
        onChange={(content) => {
          dispatch({
            type: ActionType.UPDATE,
            content: content,
            dispatch: dispatch,
          });
          saveTimer();
        }}
        content={state.content}
      />
      <footer>footer area</footer>
    </div>
  );
};

export default App;
