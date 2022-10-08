import init, {
  add_word,
  cut as jiebaCut,
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

const vaildTags = {
  n: undefined,
  f: undefined,
  s: undefined,
  t: undefined,
  nr: undefined,
  ns: undefined,
  nt: undefined,
  nw: undefined,
  nz: undefined,
  v: undefined,
  vd: undefined,
  vn: undefined,
  a: undefined,
  ad: undefined,
  an: undefined,
  d: undefined,
  m: undefined,
  q: undefined,
  r: undefined,
  p: undefined,
  c: undefined,
  u: undefined,
  xc: undefined,
  w: undefined,
  PER: undefined,
  LOC: undefined,
  ORG: undefined,
  TIME: undefined,
};
