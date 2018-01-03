import Task, { tKey } from "./TaskDescriptor";

export default function getTaskDescriptor(p: Promise<any>): Task {
  return (p as any)[tKey];
}
