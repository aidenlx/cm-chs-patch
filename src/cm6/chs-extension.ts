import type CMChsPatch from "../chsp-main";
import { dblClickPatch } from "./dbl-click";
import { patchKeymap } from "./patch-keymap";

export const getChsPatchExtension = (plugin: CMChsPatch) => [
  dblClickPatch(plugin),
  patchKeymap(plugin),
];
