import { syntaxTree } from "@codemirror/language";
import { Extension, Range } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { isBefore, parse, startOfTomorrow } from "date-fns";

function dueDateDecorations(view: EditorView) {
  const widgets: Array<Range<Decoration>> = [];
  for (const range of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from: range.from,
      to: range.to,
      enter: ({ type, from, to }) => {
        const content: string = view.state.doc.sliceString(from, to);
        if (type.name === "DueDate") {
          const matchDueDate = /due:(\d{4}-\d{2}-\d{2})/.exec(content);
          if (matchDueDate) {
            const date = parse(matchDueDate[1], "yyyy-LL-dd", new Date());
            if (isBefore(date, startOfTomorrow())) {
              const widget = Decoration.mark({
                class: "cm-underline-duedate",
              });
              widgets.push(widget.range(from, to));
            }
          }
        }
      },
    });
  }
  return Decoration.set(widgets);
}

export function dueDateExtension() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = dueDateDecorations(view);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = dueDateDecorations(update.view);
        }
      }
    },
    {
      decorations: (v) => {
        return v.decorations;
      },
    }
  );
}

export const dueDateStyle = EditorView.baseTheme({
  ".cm-underline-duedate": {
    textDecoration: "underline 3px red",
  },
});

export const dueDate: Extension = [dueDateExtension(), dueDateStyle];
