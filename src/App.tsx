import React from "react";
import { useEffect, useRef, useCallback, useReducer } from "react";
import "./App.css";
import Editor from "./Editor";
import MessageArea from "./MessageArea";

enum ActionType {
  LOAD,
  UPDATE,
  SAVE,
  ARCHIVE,
  RESET_EFFECT,
  SHOW_MESSAGE,
  HIDE_MESSAGE,
}

interface Action<ActionType, Payload = null> {
  type: ActionType;
  payload: Payload;
}

type LoadAction = Action<ActionType.LOAD, { content: string }>;
type UpdateAction = Action<
  ActionType.UPDATE,
  { content: string; todoList: string[]; doneList: string[] }
>;
type SaveAction = Action<ActionType.SAVE, null>;
type ArchiveAction = Action<
  ActionType.ARCHIVE,
  { archiveContentInfo: ArchiveContentInfo }
>;
type ResetEffectAction = Action<ActionType.RESET_EFFECT, null>;
type ShowMessageAction = Action<ActionType.SHOW_MESSAGE, { message: string }>;
type HideMessageAction = Action<ActionType.HIDE_MESSAGE, null>;

type ToDoAction =
  | LoadAction
  | UpdateAction
  | SaveAction
  | ArchiveAction
  | ResetEffectAction
  | ShowMessageAction
  | HideMessageAction;

const SAVE_DELAY_MS = 5000;

interface AppState {
  init: boolean;
  content: string;
  saveContent: string | null;
  archiveContentInfo: ArchiveContentInfo | null;
  todoList: string[];
  doneList: string[];
  message: string;
  isShowMessage: boolean;
}

const initialState: AppState = {
  init: true,
  content: "",
  saveContent: null,
  archiveContentInfo: null,
  todoList: [],
  doneList: [],
  message: "",
  isShowMessage: false,
};

const reducer = (state: AppState, action: ToDoAction): AppState => {
  switch (action.type) {
    case ActionType.LOAD:
      return {
        ...state,
        content: action.payload.content,
      };
    case ActionType.UPDATE:
      return {
        ...state,
        content: action.payload.content,
        todoList: action.payload.todoList,
        doneList: action.payload.doneList,
      };
    case ActionType.SAVE:
      if (state.init) {
        return {
          ...state,
          init: false,
        };
      }
      return {
        ...state,
        saveContent: state.content,
      };
    case ActionType.ARCHIVE:
      return {
        ...state,
        archiveContentInfo: action.payload.archiveContentInfo,
      };
    case ActionType.RESET_EFFECT:
      return {
        ...state,
        saveContent: null,
        archiveContentInfo: null,
      };
    case ActionType.SHOW_MESSAGE:
      return {
        ...state,
        message: action.payload.message,
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

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  useEffect(() => {
    window.electronAPI.on(
      "did-finish-load-todotxt-file",
      (event, content: string) => {
        dispatch({
          type: ActionType.LOAD,
          payload: {
            content: content,
          },
        });
      }
    );
    window.electronAPI.on(
      "did-finish-load-todotxt-file",
      (event, content: string, loadSuccess: boolean) => {
        if (loadSuccess) {
          dispatch({
            type: ActionType.LOAD,
            payload: {
              content: content,
            },
          });
        } else {
          dispatch({
            type: ActionType.SHOW_MESSAGE,
            payload: {
              message: "load failed",
            },
          });
        }
      }
    );
  }, []);

  const timerId = useRef<NodeJS.Timeout | null>(null!);
  const saveTimer = useCallback(() => {
    if (timerId.current) {
      clearTimeout(timerId.current);
    }
    timerId.current = setTimeout(() => {
      timerId.current = null;
      dispatch({ type: ActionType.SAVE, payload: null });
    }, SAVE_DELAY_MS);
  }, []);

  useEffect(() => {
    window.electronAPI.on("save-success-reply", (event, err) => {
      dispatch({
        type: ActionType.SHOW_MESSAGE,
        payload: {
          message: "saved",
        },
      });
      dispatch({
        type: ActionType.RESET_EFFECT,
        payload: null,
      });
    });
    window.electronAPI.on("save-failed-reply", (event, err) => {
      dispatch({
        type: ActionType.SHOW_MESSAGE,
        payload: {
          message: "save failed",
        },
      });
      dispatch({
        type: ActionType.RESET_EFFECT,
        payload: null,
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
    if (!state.saveContent) {
      return;
    }
    window.electronAPI.save(state.saveContent);
  }, [state.saveContent]);

  useEffect(() => {
    if (!state.archiveContentInfo) {
      return;
    }
    let message: string;
    if (window.electronAPI.archive(state.archiveContentInfo.doneContent)) {
      dispatch({
        type: ActionType.UPDATE,
        payload: {
          content: state.archiveContentInfo.content,
          todoList: state.archiveContentInfo.todoList,
          doneList: state.archiveContentInfo.doneList,
        },
      });
      message = "archived";
    } else {
      message = "archive failed";
    }
    dispatch({
      type: ActionType.SHOW_MESSAGE,
      payload: {
        message: message,
      },
    });
    dispatch({
      type: ActionType.RESET_EFFECT,
      payload: null,
    });
  }, [state.archiveContentInfo]);

  return (
    <div className="App">
      <Editor
        onChange={(content, todoList, doneList) => {
          dispatch({
            type: ActionType.UPDATE,
            payload: {
              content: content,
              todoList: todoList,
              doneList: doneList,
            },
          });
          saveTimer();
        }}
        onArchive={(archiveContentInfo) => {
          dispatch({
            type: ActionType.ARCHIVE,
            payload: {
              archiveContentInfo: archiveContentInfo,
            },
          });
        }}
        content={state.content}
      />
      <footer>
        <MessageArea
          onClose={() =>
            dispatch({ type: ActionType.HIDE_MESSAGE, payload: null })
          }
          message={state.message}
          show={state.isShowMessage}
        />
      </footer>
    </div>
  );
};

export default App;
