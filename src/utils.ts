const chsTest = /[\u4e00-\u9fff]/;
export const isChs = (str: string) => {
  return chsTest.test(str);
};
