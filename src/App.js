import { useReducer } from "react";
import { useEffect } from "react/cjs/react.development";
import "./App.css";
import Editor from "./Editor";

const ActionType = {
  UPDATE: "update",
};

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
    default:
      return state;
  }
};

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  useEffect(() => {
    window.electronAPI.on("did-finish-load-todotxt-file", (event, content) => {
      dispatch({ type: ActionType.UPDATE, content: content });
    });
  }, []);
  return (
    <div className="App">
      <p>
        ToDo : {state.todoList.length}, Done: {state.doneList.length}
      </p>
      <Editor
        onChange={(content) =>
          dispatch({ type: ActionType.UPDATE, content: content })
        }
        content={state.content}
      />
    </div>
  );
};

export default App;
