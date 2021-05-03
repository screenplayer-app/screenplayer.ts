import test from "tape";
import { ParseError, parseValue, Source, Value } from "../src/index";
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
    source.offset + variable.length + 2,
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
    source.offset + variable[0].length + variable[1].length + 4,
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
  t.equal(tag, "error", "result should have tag ok");
  t.deepEqual(
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
