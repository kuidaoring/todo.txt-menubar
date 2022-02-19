import { useCallback, useReducer } from "react";
import { useEffect, useRef } from "react/cjs/react.development";
import "./App.css";
import Editor from "./Editor";
import MessageArea from "./MessageArea";

const ActionType = {
  UPDATE: "update",
  SAVE: "save",
  HIDE_FOOTER: "hide_footer",
};

const SAVE_DELAY_MS = 5000;

const initialState = {
  init: true,
  content: "",
  todoList: [],
  doneList: [],
  message: "",
  isShowFooter: false,
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
        ...state,
        content: action.content,
        todoList: todoList,
        doneList: doneList,
      };
    case ActionType.SAVE:
      if (state.init) {
        return {
          ...state,
          init: false,
        };
      }
      window.electronAPI.save(state.content);
      return {
        ...state,
        message: "saved",
        isShowFooter: true,
      };
    case ActionType.HIDE_FOOTER:
      return {
        ...state,
        isShowFooter: false,
      };
    default:
      return state;
  }
};

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  useEffect(() => {
    window.electronAPI.on("did-finish-load-todotxt-file", (event, content) => {
      dispatch({
        type: ActionType.UPDATE,
        content: content,
        dispatch: dispatch,
      });
    });
  }, []);

  const timerId = useRef(null);
  const saveTimer = useCallback(() => {
    if (timerId.current) {
      clearTimeout(timerId.current);
    }
    timerId.current = setTimeout(() => {
      timerId.current = null;
      dispatch({ type: ActionType.SAVE });
    }, SAVE_DELAY_MS);
  }, []);

  return (
    <div className="App">
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
      <footer>
        <MessageArea
          onClose={() => dispatch({ type: ActionType.HIDE_FOOTER })}
          message={state.message}
          show={state.isShowFooter}
        />
      </footer>
    </div>
  );
};

export default App;
