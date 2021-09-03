declare module "segmentit";
declare module "pinyinlite" {
  function getPinyin(str: string): string[][];
  export default getPinyin;
}
