import PropertyType from "./PropertyType";

export type ScenePropertyCache = {
  ref: any;
  dict: Record<string, PropertyType>;
};
