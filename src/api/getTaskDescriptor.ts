import TaskHandler, { tKey } from "./TaskHandler";

export default function getTaskDescriptor(p: Promise<any>): TaskHandler {
  return (p as any)[tKey];
}
