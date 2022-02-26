import { useCallback, useReducer } from "react";
import { useEffect, useRef } from "react/cjs/react.development";
import "./App.css";
import Editor from "./Editor";
import MessageArea from "./MessageArea";

const ActionType = {
  LOAD: "load",
  UPDATE: "update",
  SAVE: "save",
  ARCHIVE: "archive",
  SHOW_MESSAGE: "show_message",
  HIDE_MESSAGE: "hide_message",
};

const SAVE_DELAY_MS = 5000;

const initialState = {
  init: true,
  content: "",
  archiveContent: null,
  todoList: [],
  doneList: [],
  message: "",
  isShowMessage: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case ActionType.LOAD:
      return {
        ...state,
        content: action.content,
      };
    case ActionType.UPDATE:
      return {
        ...state,
        content: action.content,
        todoList: action.todoList,
        doneList: action.doneList,
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
      };
    case ActionType.ARCHIVE:
      return {
        ...state,
        archiveContent: action.archiveContent,
      };
    case ActionType.SHOW_MESSAGE:
      return {
        ...state,
        message: action.message,
        isShowMessage: true,
      };
    case ActionType.HIDE_MESSAGE:
      return {
        ...state,
        isShowMessage: false,
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
        type: ActionType.LOAD,
        content: content,
        dispatch: dispatch,
      });
    });
  }, []);

  useEffect(() => {
    window.electronAPI.setTaskCount(
      state.todoList.length,
      state.doneList.length
    );
  }, [state.todoList, state.doneList]);

  useEffect(() => {
    if (!state.archiveContent) {
      return;
    }
    if (window.electronAPI.archive(state.archiveContent.doneContent)) {
      dispatch({
        type: ActionType.UPDATE,
        content: state.archiveContent.content,
        todoList: state.archiveContent.todoList,
        doneList: state.archiveContent.doneList,
      });
      dispatch({
        type: ActionType.SHOW_MESSAGE,
        message: "archived",
      });
    } else {
      dispatch({
        type: ActionType.SHOW_MESSAGE,
        message: "archive failed",
      });
    }
  }, [state.archiveContent]);

  const timerId = useRef(null);
  const saveTimer = useCallback(() => {
    if (timerId.current) {
      clearTimeout(timerId.current);
    }
    timerId.current = setTimeout(() => {
      timerId.current = null;
      dispatch({ type: ActionType.SAVE });
      dispatch({ type: ActionType.SHOW_MESSAGE, message: "saved" });
    }, SAVE_DELAY_MS);
  }, []);

  return (
    <div className="App">
      <Editor
        onChange={(content, todoList, doneList) => {
          dispatch({
            type: ActionType.UPDATE,
            content: content,
            todoList: todoList,
            doneList: doneList,
          });
          saveTimer();
        }}
        onArchive={(doneContent, content, todoList, doneList) => {
          dispatch({
            type: ActionType.ARCHIVE,
            archiveContent: {
              doneContent: doneContent,
              content: content,
              todoList: todoList,
              doneList: doneList,
            },
          });
        }}
        content={state.content}
      />
      <footer>
        <MessageArea
          onClose={() => dispatch({ type: ActionType.HIDE_MESSAGE })}
          message={state.message}
          show={state.isShowMessage}
        />
      </footer>
    </div>
  );
};

export default App;
