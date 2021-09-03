declare module "segmentit";
declare module "pinyinlite" {
  interface PinyinLiteOpts {
    /** Whether to retain full-width characters and half-width punctuation marks that cannot be obtained in pinyin,
     * the default is false, that is, not to retain, the corresponding position will be an empty array.
     * Letters and numbers are always output as they are.  */
    keepUnrecognized: boolean;
  }
  function getPinyin(str: string, opts: PinyinLiteOpts): string[][];
  export default getPinyin;
}
