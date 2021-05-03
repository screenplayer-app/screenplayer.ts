export type Value = string | Value[];

export type Definition = { name: string; value: Value };

export type SceneHeading =
  | { tag: "interior"; details: string }
  | { tag: "exterior"; details: string }
  | { tag: "other"; details: string }
  | { tag: "nested"; headings: SceneHeading[] };

export type Annotation = string;

export type Character = { name: string; annotation: Annotation };

export type DialogueContent =
  | { tag: "annotation"; content: string }
  | { tag: "text"; content: string };

export type Dialogue = { characters: Character[]; contents: DialogueContent[] };

export type Transition = { name: string };

export type Action =
  | { tag: "linebreak" }
  | { tag: "description"; content: string }
  | { tag: "behavior"; characters: Character[]; content: string };

export type Line =
  | { tag: "definition"; line: Definition }
  | { tag: "sceneheading"; line: SceneHeading }
  | { tag: "dialogue"; line: Dialogue }
  | { tag: "transition"; line: Transition }
  | { tag: "action"; line: Action };

export type Source = { chars: string; line: number; offset: number };

export type ParseError = { line: number; offset: number; message: string };

export type Result<T, E> = { tag: "ok"; value: T } | { tag: "error"; error: E };

export function ok<T, E>(value: T): Result<T, E> {
  return {
    tag: "ok",
    value,
  };
}

export function error<T, E>(error: E): Result<T, E> {
  return {
    tag: "error",
    error,
  };
}

export enum Tag {
  LeftBracket = "{",
  RightBracket = "}",
}

export function parseValue(
  source: Source
): Result<[Value, Source], ParseError> {
  let first = source.chars[0];
  if (first === Tag.LeftBracket) {
    let rightBracketIndex = source.chars.indexOf(Tag.RightBracket);
    if (rightBracketIndex === -1) {
      return error({
        line: source.line,
        offset: source.chars.length,
        message: "expected }, but found undefined",
      });
    } else {
      let variable = source.chars.slice(1, rightBracketIndex);
      let parts = variable.split(";");
      if (parts.length === 1) {
        return ok([
          variable.trim(),
          {
            ...source,
            chars: source.chars.slice(rightBracketIndex + 1),
            offset: rightBracketIndex + 1,
          },
        ]);
      } else {
        return ok([
          parts.map((variable) => variable.trim()),
          {
            ...source,
            chars: source.chars.slice(rightBracketIndex + 1),
            offset: rightBracketIndex + 1,
          },
        ]);
      }
    }
  } else if (first === undefined) {
    return error({
      line: source.line,
      offset: source.offset,
      message: `expected {, but found undefined`,
    });
  } else {
    return error({
      line: source.line,
      offset: source.offset,
      message: `expected {, but found ${first}`,
    });
  }
}
