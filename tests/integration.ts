import test from "tape";
import fs from "fs";
import path from "path";
import { parse } from "../src";

test("parse should be able to parse a file", (t) => {
  let content = fs.readFileSync(path.join(__dirname, "data.scp"), "utf-8");
  let result = parse([], { offset: 0, line: 0, chars: content });
  t.deepEqual(
    {
      tag: "ok",
      value: [
        {
          tag: "definition",
          line: {
            name: "Title",
            value: "Document of ScreenPlay",
          },
        },
        {
          tag: "action",
          line: {
            tag: "linebreak",
          },
        },
        {
          tag: "definition",
          line: {
            name: "Contact",
            value: "https://github.com/screenplayer/FSharp.ScreenPlayer",
          },
        },
        {
          tag: "action",
          line: {
            tag: "linebreak",
          },
        },
        {
          tag: "definition",
          line: {
            name: "Characters",
            value: ["John", "Henry"],
          },
        },
        {
          tag: "action",
          line: {
            tag: "linebreak",
          },
        },
        {
          tag: "action",
          line: {
            tag: "linebreak",
          },
        },
        {
          tag: "sceneheading",
          line: {
            tag: "nested",
            headings: [
              {
                tag: "exterior",
                details: "on the highway",
              },
              {
                tag: "interior",
                details: "in the car",
              },
            ],
          },
        },
        {
          tag: "action",
          line: {
            tag: "linebreak",
          },
        },
        {
          tag: "dialogue",
          line: {
            tag: "solo",
            character: {
              names: ["John"],
            },
            contents: [
              {
                tag: "text",
                content: "Hi, Henry",
              },
            ],
          },
        },
        {
          tag: "action",
          line: {
            tag: "linebreak",
          },
        },
        {
          tag: "dialogue",
          line: {
            tag: "solo",
            character: {
              names: ["Henry"],
            },
            contents: [
              {
                tag: "text",
                content: "Hi, John",
              },
            ],
          },
        },
        {
          tag: "action",
          line: {
            tag: "linebreak",
          },
        },
        {
          tag: "dialogue",
          line: {
            tag: "solo",
            character: {
              names: ["John", "Henry"],
              annotation: "with sad face",
            },
            contents: [
              {
                tag: "text",
                content: "Long time no see",
              },
              {
                tag: "annotation",
                content: "pause",
              },
              {
                tag: "text",
                content: "Where have you been",
              },
            ],
          },
        },
        {
          tag: "action",
          line: {
            tag: "linebreak",
          },
        },
        {
          tag: "dialogue",
          line: {
            tag: "harmony",
            dialogues: [
              {
                tag: "solo",
                character: {
                  names: ["Henry"],
                },
                contents: [
                  {
                    tag: "text",
                    content: "Heaven",
                  },
                ],
              },
              {
                tag: "solo",
                character: {
                  names: ["John"],
                },
                contents: [
                  {
                    tag: "text",
                    content: "Hell",
                  },
                ],
              },
            ],
          },
        },
        {
          tag: "action",
          line: {
            tag: "linebreak",
          },
        },
        {
          tag: "action",
          line: {
            tag: "linebreak",
          },
        },
        {
          tag: "action",
          line: {
            tag: "description",
            content: "A new world started.",
          },
        },
        {
          tag: "action",
          line: {
            tag: "linebreak",
          },
        },
      ],
    },
    result,
    "should have expected result"
  );
  t.end();
});
