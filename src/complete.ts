import {
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";

export function completeContext(
  context: CompletionContext,
  projects: string[]
): CompletionResult | null {
  return complete(context, /@\w*/, projects);
}

export function completeProject(
  context: CompletionContext,
  projects: string[]
): CompletionResult | null {
  return complete(context, /\+\w*/, projects);
}

function complete(
  context: CompletionContext,
  pattern: RegExp,
  values: string[]
): CompletionResult | null {
  let word = context.matchBefore(pattern);
  if (!word || word.from === word.to || values.length < 1) {
    return null;
  }
  const options = values.map((value) => createOption(value));
  return {
    from: word.from,
    options: options,
  };
}

function createOption(value: string): Completion {
  return {
    label: value,
  };
}
