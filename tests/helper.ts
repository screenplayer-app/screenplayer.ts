import { Source } from "../src";

export function createSource(chars: string): Source {
  return {
    line: 0,
    offset: 0,
    chars,
  };
}
