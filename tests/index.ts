import test from "tape";
import {
  ParseError,
  parseValue,
  parseDefinition,
  parseSceneHeading,
  Source,
  Value,
  Definition,
  SceneHeading,
  parseAnnotation,
  Annotation,
} from "../src/index";
import { createSource } from "./helper";

test("parseValue should parse string value", (t) => {
  let source = createSource("{string}");
  let result = parseValue(source) as { tag: "ok"; value: [Value, Source] };
  t.equal(result.tag, "ok", "result should have tag ok");
  let [variable, newSource] = result.value;
  t.equal(variable, "string", "variable shoule be string");
  t.equal(newSource.line, source.line, "new source should have the same line");
  t.equal(
    newSource.offset,
    source.chars.length,
    "new source should move to new offset"
  );
  t.equal(newSource.chars, "", "new source should have no chars left");

  t.end();
});

test("parseValue should parse list value", (t) => {
  let source = createSource("{string1; string2}");
  let result = parseValue(source) as { tag: "ok"; value: [Value, Source] };
  t.equal(result.tag, "ok", "result should have tag ok");
  let [variable, newSource] = result.value;
  t.deepEqual(variable, ["string1", "string2"], "variable shoule be list");
  t.equal(newSource.line, source.line, "new source should have the same line");
  t.equal(
    newSource.offset,
    source.chars.length,
    "new source should move to new offset"
  );
  t.equal(newSource.chars, "", "new source should have no chars left");

  t.end();
});

test("parseValue should return error for invalid input", (t) => {
  let source = createSource("{string");
  let { tag, error } = parseValue(source) as {
    tag: "error";
    error: ParseError;
  };
  t.equal(tag, "error", "result should have tag error");
  t.equal(
    error.offset,
    source.chars.length,
    "offset should point to the end of chars"
  );
  t.equal(source.line, error.line, "error should have the same line");
  t.equal(
    "expected }, but found undefined",
    error.message,
    "error should have correct message"
  );

  t.end();
});

test("parseDefinition should parse string definition", (t) => {
  let source = createSource("${var}={string}");
  let result = parseDefinition(source) as {
    tag: "ok";
    value: [Definition, Source];
  };
  t.equal(result.tag, "ok", "result should have tag ok");
  let [definition, newSource] = result.value;
  t.equal(definition.name, "var", "variable shoule have identity var");
  t.equal(definition.value, "string", "variable should have value string");
  t.equal(
    newSource.offset,
    source.offset + source.chars.length,
    "new source should move to new offset"
  );
  t.equal(newSource.chars, "", "new source should have no chars left");

  t.end();
});

test("parseDefinition should parse list definition", (t) => {
  let source = createSource("${var}={stringA; stringB}");
  let result = parseDefinition(source) as {
    tag: "ok";
    value: [Definition, Source];
  };
  t.equal(result.tag, "ok", "result should have tag ok");
  let [definition, newSource] = result.value;
  t.equal(definition.name, "var", "variable shoule have identity var");
  t.deepEqual(
    definition.value,
    ["stringA", "stringB"],
    "variable should have value list"
  );
  t.equal(
    newSource.offset,
    source.offset + source.chars.length,
    "new source should move to new offset"
  );
  t.equal(newSource.chars, "", "new source should have no chars left");

  t.end();
});

test("parseDefinition should return error for invalid input", (t) => {
  let source = createSource("${string}a");
  let { tag, error } = parseDefinition(source) as {
    tag: "error";
    error: ParseError;
  };
  t.equal(tag, "error", "result should have tag error");
  t.equal(
    error.offset,
    source.chars.indexOf("a"),
    "offset should point to the invalid char"
  );
  t.equal(source.line, error.line, "error should have the same line");
  t.equal(
    "expected =, but found a",
    error.message,
    "error should have correct message"
  );

  t.end();
});

test("parseSceneHeading should parse normal scene heading", (t) => {
  let source = createSource("[INT]");
  let result = parseSceneHeading(source) as {
    tag: "ok";
    value: [SceneHeading, Source];
  };
  t.equal(result.tag, "ok", "result should have tag ok");
  let [sceneheading, newSource] = result.value as [
    { tag: "interior"; details: string | undefined },
    Source
  ];
  t.equal("interior", sceneheading.tag, "scene heading shoule have tag EXT");
  t.equal(
    sceneheading.details,
    undefined,
    "scene heading should not have details"
  );
  t.equal(
    newSource.offset,
    source.offset + source.chars.length,
    "new source should move to new offset"
  );
  t.equal(newSource.chars, "", "new source should have no chars left");

  t.end();
});

test("parseSceneHeading should parse scene heading with details", (t) => {
  let source = createSource("[INT - in the house]");
  let result = parseSceneHeading(source) as {
    tag: "ok";
    value: [SceneHeading, Source];
  };
  t.equal(result.tag, "ok", "result should have tag ok");
  let [sceneheading, newSource] = result.value as [
    { tag: "interior"; details: string | undefined },
    Source
  ];
  t.equal("interior", sceneheading.tag, "scene heading shoule have tag EXT");
  t.equal(
    sceneheading.details,
    "in the house",
    "scene heading should have details"
  );
  t.equal(
    newSource.offset,
    source.offset + source.chars.length,
    "new source should move to new offset"
  );
  t.equal(newSource.chars, "", "new source should have no chars left");

  t.end();
});

test("parseSceneHeading should parse nested scene heading with details", (t) => {
  let source = createSource("[INT - in the house / EXT - in the field]");
  let result = parseSceneHeading(source) as {
    tag: "ok";
    value: [SceneHeading, Source];
  };
  t.equal(result.tag, "ok", "result should have tag ok");
  let [sceneheading, newSource] = result.value as [
    { tag: "nested"; headings: SceneHeading[] },
    Source
  ];
  t.equal("nested", sceneheading.tag, "scene heading shoule have tag nested");
  t.equal(
    "interior",
    sceneheading.headings[0].tag,
    "scene heading shoule have tag EXT"
  );
  t.equal(
    // @ts-ignore
    sceneheading.headings[0].details,
    "in the house",
    "scene heading should have details"
  );
  t.equal(
    "exterior",
    sceneheading.headings[1].tag,
    "scene heading shoule have tag EXT"
  );
  t.equal(
    // @ts-ignore
    sceneheading.headings[1].details,
    "in the field",
    "scene heading should have details"
  );
  t.equal(
    newSource.offset,
    source.offset + source.chars.length,
    "new source should move to new offset"
  );
  t.equal(newSource.chars, "", "new source should have no chars left");

  t.end();
});

test("parseAnnotation should parse string value", (t) => {
  let source = createSource("(string)");
  let result = parseAnnotation(source) as {
    tag: "ok";
    value: [Annotation, Source];
  };
  t.equal(result.tag, "ok", "result should have tag ok");
  let [variable, newSource] = result.value;
  t.equal(variable, "string", "annotation shoule be string");
  t.equal(newSource.line, source.line, "new source should have the same line");
  t.equal(
    newSource.offset,
    source.chars.length,
    "new source should move to new offset"
  );
  t.equal(newSource.chars, "", "new source should have no chars left");

  t.end();
});

test("parseAnnotation should parse special value", (t) => {
  let source = createSource("(string1; string2)");
  let result = parseAnnotation(source) as {
    tag: "ok";
    value: [Annotation, Source];
  };
  t.equal(result.tag, "ok", "result should have tag ok");
  let [variable, newSource] = result.value;
  t.deepEqual(
    variable,
    "string1; string2",
    "annotation should not parse special chars"
  );
  t.equal(newSource.line, source.line, "new source should have the same line");
  t.equal(
    newSource.offset,
    source.chars.length,
    "new source should move to new offset"
  );
  t.equal(newSource.chars, "", "new source should have no chars left");

  t.end();
});

test("parseAnnotation should return error for invalid input", (t) => {
  let source = createSource("(string");
  let { tag, error } = parseAnnotation(source) as {
    tag: "error";
    error: ParseError;
  };
  t.equal(tag, "error", "result should have tag error");
  t.equal(
    error.offset,
    source.chars.length,
    "offset should point to the end of chars"
  );
  t.equal(source.line, error.line, "error should have the same line");
  t.equal(
    "expected ), but found undefined",
    error.message,
    "error should have correct message"
  );

  t.end();
});
