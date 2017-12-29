export type StateTreeDict = Record<
  string,
  {
    path: string[];
  }
>;

export type Scene<S, A> = {
  name: string;
  state: S;
  actions: A;
};

export type SceneObserver = () => void;
