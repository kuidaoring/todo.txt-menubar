export class Priority {
  readonly value: string | null;

  constructor(value: string | null) {
    if (value?.match(/^[A-Za-z]$/)) {
      this.value = value.toUpperCase();
    } else {
      this.value = null;
    }
  }

  increment(): Priority {
    if (!this.value) {
      return this;
    }
    const nextPriorityCharCode = this.value.charCodeAt(0) - 1;
    if (nextPriorityCharCode < "A".charCodeAt(0)) {
      return this;
    }
    return new Priority(String.fromCharCode(nextPriorityCharCode));
  }

  decrement(): Priority {
    if (!this.value) {
      return this;
    }

    const nextPriorityCharCode = this.value.charCodeAt(0) + 1;
    if (nextPriorityCharCode > "Z".charCodeAt(0)) {
      return this;
    }
    return new Priority(String.fromCharCode(nextPriorityCharCode));
  }

  getLabelString() {
    if (this.value) {
      return `pri:${this.value}`;
    }
    return "";
  }

  getLabel() {
    if (this.value) {
      return {
        key: "pri",
        value: this.value,
      };
    }
    return null;
  }

  static build(content: string, isDone: boolean): Priority {
    if (isDone) {
      const matchPriorityLabel = / pri:([A-Za-z])(\s|$)/.exec(content);
      if (!matchPriorityLabel) {
        return new Priority(null);
      }
      return new Priority(matchPriorityLabel[1]);
    }
    const matchPriority = /^\(([A-Za-z])\)/.exec(content);
    if (!matchPriority) {
      return new Priority(null);
    }
    return new Priority(matchPriority[1]);
  }
}
