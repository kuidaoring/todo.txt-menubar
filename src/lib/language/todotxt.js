import { LanguageSupport, LRLanguage } from "@codemirror/language";
import { styleTags, tags as t } from "@codemirror/highlight";
import { parser } from "./todotxt_parser";

const todotxtLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      styleTags({
        "DoneContent/Done DoneContent/Priority DoneContent/Description":
          t.comment,
        "PriorityA PriorityAContent/Description/Content": t.constant(t.name),
        "PriorityB PriorityBContent/Description/Content": t.controlKeyword,
        "PriorityC PriorityCContent/Description/Content": t.variableName,
        Project: t.namespace,
        Context: t.labelName,
        DueDate: t.processingInstruction,
      }),
    ],
  }),
});

export const todotxt = () => {
  return new LanguageSupport(todotxtLanguage);
};
