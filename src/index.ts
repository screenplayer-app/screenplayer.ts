export type Value = string | string[];

export type Definition = { name: string; value: Value };

export type SceneHeading =
  | { tag: "interior"; details: string | undefined }
  | { tag: "exterior"; details: string | undefined }
  | { tag: "other"; details: string | undefined }
  | { tag: "nested"; headings: SceneHeading[] };

export type Annotation = string;

export type Character = { names: string[]; annotation?: Annotation };

export type DialogueText = { tag: "text"; content: string };
export type DialogueAnnotation = { tag: "annotation"; content: string };

export type DialogueContent = DialogueText | DialogueAnnotation;

export type Dialogue = { character: Character; contents: DialogueContent[] };

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

export function forward(source: Source, len: number): Source {
  return {
    chars: source.chars.slice(len),
    offset: source.offset + len,
    line: source.line,
  };
}

export function trimLeft(source: Source): Source {
  let chars = source.chars.trimLeft();
  return {
    chars,
    offset: source.offset + source.chars.length - chars.length,
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
  LeftCurlyBracket = "{",
  RightCurlyBracket = "}",
  LeftSquareBracket = "[",
  RightSquareBracket = "]",
  LeftBracket = "(",
  RightBracket = ")",
  Assignment = "=",
  Definition = "$",
  Character = "@",
  DialogueText = '"',
}

export function parseValue(
  source: Source
): Result<[Value, Source], ParseError> {
  let first = source.chars[0];
  if (first === Tag.LeftCurlyBracket) {
    let rightBracketIndex = source.chars.indexOf(Tag.RightCurlyBracket);
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

export function parseAnnotation(
  source: Source
): Result<[Annotation, Source], ParseError> {
  let first = source.chars[0];
  if (first === Tag.LeftBracket) {
    let rightBracketIndex = source.chars.indexOf(Tag.RightBracket);
    if (rightBracketIndex === -1) {
      return error({
        line: source.line,
        offset: source.chars.length,
        message: "expected ), but found undefined",
      });
    } else {
      let annotation = source.chars.slice(1, rightBracketIndex);
      return ok([annotation, forward(source, rightBracketIndex + 1)]);
    }
  } else if (first === undefined) {
    return error({
      line: source.line,
      offset: source.offset,
      message: `expected (, but found undefined`,
    });
  } else {
    return error({
      line: source.line,
      offset: source.offset,
      message: `expected (, but found ${first}`,
    });
  }
}

export function parseCharacter(
  source: Source
): Result<[Character, Source], ParseError> {
  let first = source.chars[0];
  if (first === Tag.Character) {
    let result1 = parseValue(forward(source, 1));
    if (result1.tag === "error") {
      return result1;
    } else {
      let [variable, newSource] = result1.value;
      let names = [];
      if (typeof variable === "string") {
        names.push(variable);
      } else {
        names.push(...variable);
      }
      let result2 = parseAnnotation(newSource);
      if (result2.tag === "error") {
        return ok([
          {
            names,
          },
          newSource,
        ]);
      } else {
        let [annotation, newSource] = result2.value;
        return ok([{ names, annotation }, newSource]);
      }
    }
  } else {
    return error({
      line: source.line,
      offset: source.offset,
      message: `expected @, but found ${first}`,
    });
  }
}

export function parseDialogueText(
  source: Source
): Result<[DialogueText, Source], ParseError> {
  let first = source.chars[0];
  if (first === Tag.DialogueText) {
    let rest = source.chars.slice(1);
    let endTagIndex = rest.indexOf(Tag.DialogueText);
    if (endTagIndex === -1) {
      return error({
        line: source.line,
        offset: source.chars.length + source.offset,
        message: 'expect ", but found undefined',
      });
    } else {
      let text = rest.slice(0, endTagIndex);

      return ok([
        { tag: "text", content: text },
        forward(source, text.length + 2),
      ]);
    }
  } else {
    return error({
      line: source.line,
      offset: source.offset,
      message: `expected ", but found ${first}`,
    });
  }
}

export function parseDialogueAnnotation(
  source: Source
): Result<[DialogueAnnotation, Source], ParseError> {
  let result = parseAnnotation(source);
  if (result.tag === "error") {
    return result;
  } else {
    let [annotation, newSource] = result.value;
    return ok([{ tag: "annotation", content: annotation }, newSource]);
  }
}

export function parseDialogueContent(
  contents: DialogueContent[],
  source: Source
): Result<[DialogueContent[], Source], ParseError> {
  let first = source.chars[0];
  if (first !== undefined) {
    if (first === Tag.DialogueText) {
      let result = parseDialogueText(source);
      if (result.tag === "error") {
        return ok([contents, source]);
      } else {
        let [dialogueText, newSource] = result.value;
        return parseDialogueContent([...contents, dialogueText], newSource);
      }
    } else if (first === Tag.LeftBracket) {
      let result = parseDialogueAnnotation(source);
      if (result.tag === "error") {
        return ok([contents, source]);
      } else {
        let [dialogueAnnotation, newSource] = result.value;
        return parseDialogueContent(
          [...contents, dialogueAnnotation],
          newSource
        );
      }
    } else {
      return ok([contents, source]);
    }
  } else {
    return ok([contents, source]);
  }
}

export function parseDialogue(
  source: Source
): Result<[Dialogue, Source], ParseError> {
  let result = parseCharacter(source);
  if (result.tag === "ok") {
    let [character, newSource] = result.value;
    let result2 = parseDialogueContent([], trimLeft(newSource));
    if (result2.tag === "ok") {
      let [contents, newSource] = result2.value;
      return ok([{ character, contents }, newSource]);
    } else {
      return result2;
    }
  } else {
    return result;
  }
}
