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
  | { tag: "text"; content };

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

export type ParseError = { line: number; offset: number; message: string }
