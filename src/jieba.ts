import init, {
  add_word,
  cut as jiebaCut,
  cut_for_search as jiebaCutForSearch,
} from "jieba-wasm/pkg/web/jieba_rs_wasm";

const vaildateFreq = (freq: string): number | undefined =>
  freq && Number.isInteger(+freq) ? +freq : undefined;
const vaildateTag = (tag: string): keyof typeof vaildTags | undefined =>
  tag && tag in vaildTags ? (tag as any) : undefined;

let initialized = false;

export const initJieba = async (
  wasm: Promise<ArrayBuffer> | ArrayBuffer,
  dict?: string,
) => {
  if (initialized) return;
  const invaildLines = [] as string[];
  await init(wasm);
  if (dict)
    for (const line of dict.split(/\r?\n/)) {
      // eg: 集团公司 1297 n
      const [word, freqOrTag, tag] = line.trim().split(/\s+/);
      let f: number | undefined, t: keyof typeof vaildTags | undefined;
      if (!word) {
        invaildLines.push(line);
        continue;
      }
      if (!freqOrTag && !tag) {
        add_word(word);
      } else if ((t = vaildateTag(freqOrTag))) {
        add_word(word, undefined, t);
      } else {
        t = vaildateTag(tag);
        f = vaildateFreq(freqOrTag);
        add_word(word, f, t);
      }
    }
  // initialize jieba.wasm
  jiebaCut("", true);
  initialized = true;
};

export const cut = (text: string, hmm = false) => {
  if (!initialized) throw new Error("jieba not loaded");
  return jiebaCut(text, hmm);
};
export const cutForSearch = (text: string, hmm = false) => {
  if (!initialized) throw new Error("jieba not loaded");
  return jiebaCutForSearch(text, hmm);
};

const vaildTags = {
  n: undefined, // 普通名词
  f: undefined, // 方位名词
  s: undefined, // 处所名词
  t: undefined, // 时间
  nr: undefined, // 人名
  ns: undefined, // 地名
  nt: undefined, // 机构名
  nw: undefined, // 作品名
  nz: undefined, // 其他专名
  v: undefined, // 普通动词
  vd: undefined, // 动副词
  vn: undefined, // 名动词
  a: undefined, // 形容词
  ad: undefined, // 副形词
  an: undefined, // 名形词
  d: undefined, // 副词
  m: undefined, // 数量词
  q: undefined, // 量词
  r: undefined, // 代词
  p: undefined, // 介词
  c: undefined, // 连词
  u: undefined, // 助词
  xc: undefined, // 其他虚词
  w: undefined, // 标点符号
  PER: undefined, // 人名
  LOC: undefined, // 地名
  ORG: undefined, // 机构名
  TIME: undefined, // 时间
};
