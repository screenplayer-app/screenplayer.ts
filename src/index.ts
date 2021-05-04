export type Value = string | Value[];

export type Definition = { name: string; value: Value };

export type SceneHeading =
  | { tag: "interior"; details: string | undefined }
  | { tag: "exterior"; details: string | undefined }
  | { tag: "other"; details: string | undefined }
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

export function forward(source: Source, len: number) {
  return {
    chars: source.chars.slice(len),
    offset: source.offset + len,
    line: source.line,
  };
}

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
  LeftSquareBracket = "[",
  RightSquareBracket = "]",
  Assignment = "=",
  Definition = "$",
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
        return ok([variable.trim(), forward(source, rightBracketIndex + 1)]);
      } else {
        return ok([
          parts.map((variable) => variable.trim()),
          forward(source, rightBracketIndex + 1),
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

export function parseDefinition(
  source: Source
): Result<[Definition, Source], ParseError> {
  let first = source.chars[0];
  if (first === Tag.Definition) {
    let result = parseValue(forward(source, 1));
    if (result.tag === "error") {
      return result;
    } else {
      let [variable, newSource] = result.value;
      if (typeof variable === "string") {
        let assignmentIndex = newSource.chars
          .trimLeft()
          .indexOf(Tag.Assignment);
        if (assignmentIndex === -1) {
          return error({
            line: newSource.line,
            offset: newSource.offset + assignmentIndex + 1,
            message: `expected =, but found ${newSource.chars.trimLeft()[0]}`,
          });
        } else {
          let result = parseValue(forward(newSource, assignmentIndex + 1));
          if (result.tag === "error") {
            return result;
          } else {
            let [value, newSource] = result.value;
            return ok([{ name: variable, value }, newSource]);
          }
        }
      } else {
        return error({
          line: source.line,
          offset: source.offset,
          message: "variable can't be defined as list",
        });
      }
    }
  } else {
    return error({
      line: source.line,
      offset: source.offset,
      message: `expected $, but found ${first}`,
    });
  }
}

export function parseSceneHeading(
  source: Source
): Result<[SceneHeading, Source], ParseError> {
  let first = source.chars[0];
  if (first === Tag.LeftSquareBracket) {
    let rightSquareBracketIndex = source.chars.indexOf(Tag.RightSquareBracket);
    if (rightSquareBracketIndex === -1) {
      return error({
        line: source.line,
        offset: source.chars.length,
        message: "expected ], but found undefined",
      });
    } else {
      let value = source.chars.slice(1, rightSquareBracketIndex);
      let headings = value.split("/").map((sceneHeading) => {
        let parts = sceneHeading.split("-").map((part) => part.trim());
        let tag: SceneHeading["tag"] = "other";
        switch (parts[0].toUpperCase()) {
          case "EXT":
            tag = "exterior";
            break;
          case "INT":
            tag = "interior";
            break;
          default:
            tag = "other";
        }
        return {
          tag,
          details: parts[1],
        };
      });
      if (headings.length === 1) {
        return ok([headings[0], forward(source, rightSquareBracketIndex + 1)]);
      } else {
        return ok([
          {
            tag: "nested",
            headings,
          },
          forward(source, rightSquareBracketIndex + 1),
        ]);
      }
    }
  } else if (first === undefined) {
    return error({
      line: source.line,
      offset: source.offset,
      message: `expected [, but found undefined`,
    });
  } else {
    return error({
      line: source.line,
      offset: source.offset,
      message: `expected [, but found ${first}`,
    });
  }
}
