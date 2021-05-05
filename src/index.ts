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

export type SoloDialogue = {
  tag: "solo";
  character: Character;
  contents: DialogueContent[];
};

export type Dialogue =
  | SoloDialogue
  | { tag: "harmony"; dialogues: SoloDialogue[] };

export type Transition = { name: string };

export type Action =
  | { tag: "linebreak" }
  | { tag: "description"; content: string };

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
  Transition = ">",
  Carrige = "\r",
  Newline = "\n",
  Colon = ":",
  And = "&",
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
    if (first === Tag.Newline) {
      return ok([contents, source]);
    } else if (first === Tag.DialogueText) {
      let result = parseDialogueText(source);
      if (result.tag === "error") {
        return ok([contents, source]);
      } else {
        let [dialogueText, newSource] = result.value;
        if (newSource.chars[0] === Tag.Newline) {
          return ok([[...contents, dialogueText], newSource]);
        } else {
          return parseDialogueContent(
            [...contents, dialogueText],
            trimLeft(newSource)
          );
        }
      }
    } else if (first === Tag.LeftBracket) {
      let result = parseDialogueAnnotation(source);
      if (result.tag === "error") {
        return ok([contents, source]);
      } else {
        let [dialogueAnnotation, newSource] = result.value;
        if (newSource.chars[0] === Tag.Newline) {
          return ok([[...contents, dialogueAnnotation], newSource]);
        } else {
          return parseDialogueContent(
            [...contents, dialogueAnnotation],
            trimLeft(newSource)
          );
        }
      }
    } else {
      return ok([contents, source]);
    }
  } else {
    return ok([contents, source]);
  }
}

export function parseDialogue(
  source: Source,
  dialogues: SoloDialogue[] = []
): Result<[Dialogue, Source], ParseError> {
  let result = parseCharacter(source);
  if (result.tag === "ok") {
    let [character, newSource] = result.value;
    let result2 = parseDialogueContent([], trimLeft(newSource));
    if (result2.tag === "ok") {
      let [contents, newSource] = result2.value;
      let dialogue: SoloDialogue = { tag: "solo", character, contents };

      let next = trimLeft(newSource).chars[0];
      if (next === Tag.And) {
        return parseDialogue(trimLeft(forward(trimLeft(newSource), 1)), [
          ...dialogues,
          dialogue,
        ]);
      } else {
        if (dialogues.length === 0) {
          return ok([dialogue, newSource]);
        } else {
          return ok([
            { tag: "harmony", dialogues: [...dialogues, dialogue] },
            newSource,
          ]);
        }
      }
    } else {
      return result2;
    }
  } else {
    return result;
  }
}

export function parseTransition(
  source: Source
): Result<[Transition, Source], ParseError> {
  let first = source.chars[0];
  if (first === Tag.Transition) {
    let endIndex = source.chars.indexOf(Tag.Colon);
    if (endIndex === -1) {
      return error({
        line: source.line,
        offset: source.offset,
        message: `expect :, but found undefined`,
      });
    } else {
      let transition = source.chars.slice(Tag.Transition.length, endIndex);
      return ok([
        { name: transition.trim() },
        forward(source, endIndex + Tag.Transition.length),
      ]);
    }
  } else {
    return error({
      line: source.line,
      offset: source.offset,
      message: `expect >, but found ${first}`,
    });
  }
}

export function parseAction(
  source: Source
): Result<[Action, Source], ParseError> {
  let endIndex = source.chars.indexOf(Tag.Newline);
  if (endIndex === -1) {
    endIndex = source.chars.length;
  }
  let action = source.chars.slice(0, endIndex);
  if (endIndex === 0) {
    return ok([{ tag: "linebreak" }, forward(source, action.length + 1)]);
  }

  return ok([
    { tag: "description", content: action },
    forward(source, action.length),
  ]);
}

export function parse(
  lines: Line[],
  source: Source
): Result<Line[], ParseError> {
  if (source.chars.length === 0) {
    return ok(lines);
  } else {
    let first = source.chars[0];
    switch (first) {
      case Tag.Definition:
        {
          let result = parseDefinition(source);
          if (result.tag === "error") {
            return result;
          } else {
            let [definition, newSource] = result.value;
            return parse(
              [...lines, { tag: "definition", line: definition }],
              newSource
            );
          }
        }
        break;
      case Tag.LeftSquareBracket:
        {
          let result = parseSceneHeading(source);
          if (result.tag === "error") {
            return result;
          } else {
            let [sceneHeading, newSource] = result.value;
            return parse(
              [...lines, { tag: "sceneheading", line: sceneHeading }],
              newSource
            );
          }
        }
        break;
      case Tag.Transition:
        {
          let result = parseTransition(source);
          if (result.tag === "error") {
            return result;
          } else {
            let [transition, newSource] = result.value;
            return parse(
              [...lines, { tag: "transition", line: transition }],
              newSource
            );
          }
        }
        break;
      case Tag.Character:
        {
          let result = parseDialogue(source);
          if (result.tag === "error") {
            let result = parseAction(source);
            if (result.tag === "error") {
              return result;
            } else {
              let [action, newSource] = result.value;
              return parse(
                [...lines, { tag: "action", line: action }],
                newSource
              );
            }
          } else {
            let [dialogue, newSource] = result.value;
            return parse(
              [...lines, { tag: "dialogue", line: dialogue }],
              newSource
            );
          }
        }
        break;
      default: {
        let result = parseAction(source);
        if (result.tag === "error") {
          return result;
        } else {
          let [action, newSource] = result.value;
          return parse([...lines, { tag: "action", line: action }], newSource);
        }
      }
    }
  }
}
