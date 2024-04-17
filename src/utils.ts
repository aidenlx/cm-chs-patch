const chsPattern = /[\u4e00-\u9fff]/;
export const chsPatternGlobal = new RegExp(chsPattern, "g");
export const isChs = (str: string) => {
  return chsPattern.test(str);
};
