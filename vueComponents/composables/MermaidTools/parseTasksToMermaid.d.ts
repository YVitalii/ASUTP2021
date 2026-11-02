declare function parseTasksToMermaid(
  tasks: unknown,
  indentation?: string,
  parent?: string | null,
  res?: string,
): string;

export function safeId(id: string): string;

export default parseTasksToMermaid;
