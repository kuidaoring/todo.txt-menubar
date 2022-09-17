import { parse, format } from "date-fns";
import { Priority } from "./priority";

type Label = {
  key: string;
  value: string;
};

export class Task {
  readonly content: string;
  readonly isDone: boolean;
  readonly priority: Priority;
  readonly projects: string[];
  readonly contexts: string[];
  readonly labels: Label[];
  readonly dueDate: Date | null;
  readonly doneDate: Date | null;

  constructor(
    content: string,
    isDone: boolean,
    priority: Priority,
    projects: string[],
    contexts: string[],
    labels: Label[],
    dueDate: Date | null,
    doneDate: Date | null
  ) {
    this.content = content;
    this.isDone = isDone;
    this.priority = priority;
    this.projects = projects;
    this.contexts = contexts;
    this.labels = labels;
    this.dueDate = dueDate;
    this.doneDate = doneDate;
  }

  isEmpty(): boolean {
    return !!this.content.match(/^\s*$/);
  }

  toggleAsDone(): Task {
    return this.isDone ? this.unMarkAsDone() : this.markAsDone();
  }

  markAsDone(): Task {
    let content = this.content;
    if (this.priority.value) {
      content = content.slice(4) + ` ${this.priority.getLabelString()}`;
    }

    const doneDate = new Date();
    const dateWord = format(doneDate, "yyyy-LL-dd");
    content = `x ${dateWord} ${content}`;

    return Task.build(content);
  }

  unMarkAsDone(): Task {
    let content = this.content.replace(/^x (\d{4}-\d{2}-\d{2} )?/, "");

    const priorityLabel = this.labels.find((l) => l.key === "pri");
    if (priorityLabel) {
      content = `(${priorityLabel.value}) ${content.replace(
        ` pri:${priorityLabel.value}`,
        ""
      )}`;
    }

    return Task.build(content);
  }

  markPriority(value: string): Task {
    if (this.isDone) {
      return this;
    }

    const priority = new Priority(value);
    if (!priority.value) {
      return this;
    }

    let content = this.content;
    if (this.priority.value) {
      content = content.slice(4);
    }
    if (this.priority.value !== priority.value) {
      content = `(${priority.value}) ${content}`;
    }

    return Task.build(content);
  }

  incrementPriority(): Task {
    if (this.isDone) {
      return this;
    }
    const nextPriority = this.priority.increment();
    if (!nextPriority.value) {
      return this;
    }
    return this.markPriority(nextPriority.value);
  }

  decrementPriority(): Task {
    if (this.isDone) {
      return this;
    }

    const nextPriority = this.priority.decrement();
    if (!nextPriority.value) {
      return this;
    }

    return this.markPriority(nextPriority.value);
  }

  static build(content: string): Task {
    const isDone = content.startsWith("x ");
    const projects = [...content.matchAll(/\+(\S+)/g)].map((v) => v.toString());
    const contexts = [...content.matchAll(/@(\S+)/g)].map((v) => v.toString());
    const labels = content
      .split(/\s/)
      .map((token) => token.match(/^([^@+]\S+):(\S+)/))
      .filter((matches) => !!matches)
      .map((matches) => ({ key: matches![1], value: matches![2] }));
    const priority = Priority.build(content, isDone);

    let doneDate = null;
    if (isDone) {
      const matchDoneDate = /^x (\d{4}-\d{2}-\d{2} )/.exec(content);
      if (matchDoneDate) {
        doneDate = parse(matchDoneDate[1], "yyyy-LL-dd", new Date());
      }
    }

    let dueDate = null;
    const matchDueDate = /due:(\d{4}-\d{2}-\d{2})/.exec(content);
    if (matchDueDate) {
      dueDate = parse(matchDueDate[1], "yyyy-LL-dd", new Date());
    }

    return new Task(
      content,
      isDone,
      priority,
      projects,
      contexts,
      labels,
      dueDate,
      doneDate
    );
  }
}
