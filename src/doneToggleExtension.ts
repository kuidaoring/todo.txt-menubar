import { Extension } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";

const CLASS_NAME = "cm-boolean-toggle";

class CheckboxWidget extends WidgetType {
  readonly checked: boolean;

  constructor(checked: boolean) {
    super();
    this.checked = checked;
  }

  eq(widget: CheckboxWidget): boolean {
    return widget.checked === this.checked;
  }

  toDOM(view: EditorView): HTMLElement {
    let wrap = document.createElement("span");
    wrap.setAttribute("aria-hidden", "true");
    wrap.className = CLASS_NAME;
    let box = wrap.appendChild(document.createElement("input"));
    box.type = "checkbox";
    box.checked = this.checked;
    return wrap;
  }

  ignoreEvent(event: Event): boolean {
    return false;
  }
}

function checkboxes(view: EditorView) {
  let widgets = [];
  for (let { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to; ) {
      const line = view.state.doc.lineAt(pos);
      const isDone = line.text.startsWith("x ");
      const deco = Decoration.widget({
        widget: new CheckboxWidget(isDone),
      });
      widgets.push(deco.range(pos));
      pos = line.to + 1;
    }
  }
  return Decoration.set(widgets);
}

export function doneToggleExtension() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = checkboxes(view);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = checkboxes(update.view);
        }
      }
    },
    {
      decorations: (v) => {
        return v.decorations;
      },
      eventHandlers: {
        mousedown: (e: MouseEvent, view: EditorView) => {
          const target = e.target as HTMLElement;
          if (
            target.nodeName === "INPUT" &&
            target.parentElement!.classList.contains(CLASS_NAME)
          ) {
            const pos = view.posAtDOM(target);
            const before = view.state.doc.sliceString(
              Math.max(0, pos),
              pos + 2
            );
            let change;
            if (before === "x ") {
              change = {
                from: pos,
                to: pos + 2,
                insert: "",
              };
            } else {
              change = {
                from: pos,
                to: pos,
                insert: "x ",
              };
            }
            view.dispatch({ changes: change });
          }
        },
      },
    }
  );
}

export const doneToggle: Extension = [doneToggleExtension()];
