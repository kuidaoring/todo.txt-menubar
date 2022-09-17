import { Task } from "./model/task";

const compareTask = (a: Task, b: Task): number => {
  if (a.isDone && b.isDone) {
    return compareTaskByDueDate(a, b);
  }
  if (b.isDone) {
    return -1;
  }
  if (a.isDone) {
    return 1;
  }

  return compareTaskByPriority(a, b);
};

const compareTaskByPriority = (a: Task, b: Task): number => {
  if (!a.priority.value && !b.priority.value) {
    return compareTaskByDueDate(a, b);
  }
  if (!b.priority.value) {
    return -1;
  }
  if (!a.priority.value) {
    return 1;
  }
  if (a.priority.value === b.priority.value) {
    return compareTaskByDueDate(a, b);
  }
  if (a.priority.value < b.priority.value) {
    return -1;
  }
  return 1;
};

const compareTaskByDueDate = (a: Task, b: Task): number => {
  if (!a.dueDate && !b.dueDate) {
    return 0;
  }

  if (a.dueDate && b.dueDate) {
    if (a.dueDate === b.dueDate) {
      return 0;
    }
    if (a.dueDate < b.dueDate) {
      return -1;
    }
    return 1;
  }

  if (a.dueDate) {
    return -1;
  }

  return 1;
};

export default compareTask;
