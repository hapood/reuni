export type StateTreeDict = Record<
  string,
  {
    path: symbol[];
  }
>;

export type Scene<S, A> = {
  id: string;
  state: S;
  actions: A;
};
