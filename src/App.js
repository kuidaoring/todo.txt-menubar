import { useReducer } from "react";
import "./App.css";
import Editor from "./Editor";

const ActionType = {
  UPDATE: "update",
};

const initialState = {
  todoList: [],
  doneList: [],
};

const reducer = (state, action) => {
  switch (action.type) {
    case ActionType.UPDATE:
      return {
        todoList: action.state.doc.text.filter(
          (line) => !line.startsWith("x ") && !line.match(/^\s*$/)
        ),
        doneList: action.state.doc.text.filter((line) => line.startsWith("x ")),
      };
    default:
      return state;
  }
};

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <div className="App">
      <p>
        ToDo : {state.todoList.length}, Done: {state.doneList.length}
      </p>
      <Editor
        onChange={(state) =>
          dispatch({ type: ActionType.UPDATE, state: state })
        }
      />
    </div>
  );
};

export default App;
