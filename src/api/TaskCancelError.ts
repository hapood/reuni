export default class TaskCancelError extends Error {
  constructor(tid: string, s: string) {
    super(`Task [${tid}] is canceled.` + " " + s);
  }
}
