import assert from "node:assert/strict";
import {
  spawn,
  type ChildProcess,
} from "node:child_process";
import * as fs from "node:fs";
import {
  createServer,
} from "node:http";
import type {
  AddressInfo,
} from "node:net";
import * as os from "node:os";
import * as path from "node:path";
import {
  after,
  before,
  describe,
  test,
} from "node:test";

const projectRoot = path.resolve(
  __dirname,
  "..",
);
const uploadsDir = path.join(
  os.tmpdir(),
  "gold-uploads",
);

interface User {
  name: string;
  age: number;
}

function freePort(): Promise<number> {
  return new Promise(
    (resolve, reject) => {
      const probe = createServer();
      probe.listen(
        0,
        "127.0.0.1",
        () => {
          const {
            port,
          } = probe.address() as AddressInfo;
          probe.close(
            (error) => error
              ? reject(error)
              : resolve(port),
          );
        },
      );
      probe.on(
        "error",
        reject,
      );
    },
  );
}

async function waitUntilServing(url: string, app: ChildProcess, output: () => string): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (app.exitCode !== null) throw new Error(`App exited early:\n${output()}`);
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not listening yet
    }
    await new Promise(
      (resolve) => setTimeout(
        resolve,
        100,
      ),
    );
  }
  throw new Error(`App did not start:\n${output()}`);
}

function call(url: string, method: string, args: unknown): Promise<Response> {
  return fetch(
    `${url}/gold_request`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gold-Method": method,
      },
      body: JSON.stringify(args),
    },
  );
}

/** Opens a stream and returns a function that resolves with each next data frame. */
async function openStream(url: string, method: string): Promise<{
  next: () => Promise<unknown>;
  close: () => void;
}> {
  const controller = new AbortController();
  const response = await fetch(
    `${url}/gold_sse`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gold-Method": method,
      },
      body: "{}",
      signal: controller.signal,
    },
  );
  assert.equal(
    response.status,
    200,
  );
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const next = async (): Promise<unknown> => {
    while (true) {
      const end = buffer.indexOf("\n\n");
      if (end !== -1) {
        const frame = buffer.slice(
          0,
          end,
        );
        buffer = buffer.slice(end + 2);
        const data = frame.split("\n").find(
          (line) => line.startsWith("data: "),
        );
        if (frame.startsWith("event: ")) throw new Error(`Unexpected stream event: ${frame}`);
        return JSON.parse(data!.slice(6));
      }
      const {
        done,
        value,
      } = await reader.read();
      if (done) throw new Error("Stream ended");
      buffer += decoder.decode(
        value,
        {
          stream: true,
        },
      );
    }
  };
  return {
    next,
    close: () => controller.abort(),
  };
}

interface RunningApp {
  url: string;
  port: number;
  stop: () => void;
}

/** Starts the app as `npm start` (production) or `npm run dev` does, without the file watcher. */
async function startApp(mode: "production" | "development"): Promise<RunningApp> {
  const port = await freePort();
  const url = `http://127.0.0.1:${port}`;
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PORT: String(port),
  };
  if (mode === "production") env.NODE_ENV = "production";
  else delete env.NODE_ENV;
  const app = spawn(
    process.execPath,
    [
      require.resolve("tsx/cli"),
      "backend/index.ts",
    ],
    {
      cwd: projectRoot,
      env,
      stdio: [
        "ignore",
        "pipe",
        "pipe",
      ],
    },
  );
  let output = "";
  app.stdout!.on(
    "data",
    (chunk) => output += chunk,
  );
  app.stderr!.on(
    "data",
    (chunk) => output += chunk,
  );
  await waitUntilServing(
    url,
    app,
    () => output,
  );
  return {
    url,
    port,
    stop: () => app.kill(),
  };
}

function listUploads(): string[] {
  return fs.existsSync(uploadsDir)
    ? fs.readdirSync(uploadsDir)
    : [];
}

describe(
  "gold-janus-example over HTTP",
  () => {
    let app: RunningApp;
    let url: string;

    before(
      async () => {
        app = await startApp("production");
        url = app.url;
      },
    );

    after(
      () => {
        app.stop();
      },
    );

    test(
      "serves the page and the generated client",
      async () => {
        const page = await fetch(`${url}/`);
        assert.equal(
          page.status,
          200,
        );
        assert.match(
          await page.text(),
          /<janus-page>/,
        );
        const client = await fetch(`${url}/client.js`);
        assert.equal(
          client.status,
          200,
        );
        assert.match(
          await client.text(),
          /export const Users/,
        );
      },
    );

    test(
      "users can be created, updated and deleted, and the stream follows",
      async () => {
        const stream = await openStream(
          url,
          "Users.streamListUsers",
        );
        try {
          const initial = await stream.next() as User[];

          assert.equal(
            (await call(
              url,
              "Users.createUser",
              {
                user: {
                  name: "Carol",
                  age: 41,
                },
              },
            )).status,
            200,
          );
          assert.deepEqual(
            await stream.next(),
            [
              ...initial,
              {
                name: "Carol",
                age: 41,
              },
            ],
          );

          const index = initial.length;
          assert.equal(
            (await call(
              url,
              "Users.updateUser",
              {
                index,
                user: {
                  name: "Caroline",
                  age: 42,
                },
              },
            )).status,
            200,
          );
          assert.deepEqual(
            await stream.next(),
            [
              ...initial,
              {
                name: "Caroline",
                age: 42,
              },
            ],
          );

          assert.equal(
            (await call(
              url,
              "Users.deleteUser",
              {
                index,
              },
            )).status,
            200,
          );
          assert.deepEqual(
            await stream.next(),
            initial,
          );
        } finally {
          stream.close();
        }
      },
    );

    test(
      "a cross-site form post cannot delete a user",
      async () => {
        const stream = await openStream(
          url,
          "Users.streamListUsers",
        );
        try {
          const before = await stream.next();
          const form = new FormData();
          form.append(
            "__method",
            "Users.deleteUser",
          );
          form.append(
            "index",
            "0",
          );
          const response = await fetch(
            `${url}/gold_request`,
            {
              method: "POST",
              body: form,
            },
          );
          assert.equal(
            response.status,
            403,
          );
          stream.close();
          const after = await openStream(
            url,
            "Users.streamListUsers",
          );
          try {
            assert.deepEqual(
              await after.next(),
              before,
            );
          } finally {
            after.close();
          }
        } finally {
          stream.close();
        }
      },
    );

    test(
      "malformed users and bad indexes give 400",
      async () => {
        const malformed = await call(
          url,
          "Users.createUser",
          {
            user: {
              name: {
                x: 1,
              },
              age: "lots",
            },
          },
        );
        assert.equal(
          malformed.status,
          400,
        );
        assert.match(
          (await malformed.json() as {
            error: string;
          }).error,
          /user\.name/,
        );

        const missing = await call(
          url,
          "Users.updateUser",
          {
            index: 0,
          },
        );
        assert.equal(
          missing.status,
          400,
        );

        const outOfRange = await call(
          url,
          "Users.getByIndex",
          {
            index: 99,
          },
        );
        assert.equal(
          outOfRange.status,
          400,
        );
        assert.deepEqual(
          await outOfRange.json(),
          {
            error: "Invalid user index",
          },
        );
      },
    );

    test(
      "an uploaded image reaches the image stream and leaves no temp file",
      async () => {
        const stream = await openStream(
          url,
          "Chat.streamBase64ImageUrl",
        );
        try {
          await stream.next();
          const uploadsBefore = listUploads();
          const pixel = Buffer.from("not really a png");
          const form = new FormData();
          form.append(
            "file",
            new Blob(
              [
                pixel,
              ],
              {
                type: "image/png",
              },
            ),
            "pixel.png",
          );
          const response = await fetch(
            `${url}/gold_request`,
            {
              method: "POST",
              headers: {
                "X-Gold-Method": "Chat.setImage",
              },
              body: form,
            },
          );
          assert.equal(
            response.status,
            200,
          );
          assert.equal(
            await stream.next(),
            `data:image/png;base64,${pixel.toString("base64")}`,
          );
          assert.deepEqual(
            listUploads(),
            uploadsBefore,
          );
        } finally {
          stream.close();
        }
      },
    );
  },
);

test(
  "tsx, which runs npm start, is a runtime dependency",
  () => {
    const manifest = JSON.parse(fs.readFileSync(
      path.join(
        projectRoot,
        "package.json",
      ),
      "utf8",
    )) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    assert.ok(manifest.dependencies?.tsx);
    assert.equal(
      manifest.devDependencies?.tsx,
      undefined,
    );
  },
);

describe(
  "user indexes are integers in every method",
  () => {
    let app: RunningApp;
    before(
      async () => {
        app = await startApp("production");
      },
    );
    after(
      () => app.stop(),
    );

    const user = {
      name: "Dana",
      age: 30,
    };
    for (const [
      method,
      args,
    ] of [
      [
        "Users.getByIndex",
        {},
      ],
      [
        "Users.updateUser",
        {
          user,
        },
      ],
      [
        "Users.deleteUser",
        {},
      ],
    ] as const) {
      test(
        `${method} accepts a number and rejects strings and fractions`,
        async () => {
          assert.equal(
            (await call(
              app.url,
              method,
              {
                ...args,
                index: 0,
              },
            )).status,
            200,
          );
          assert.equal(
            (await call(
              app.url,
              method,
              {
                ...args,
                index: "0",
              },
            )).status,
            400,
          );
          const fraction = await call(
            app.url,
            method,
            {
              ...args,
              index: 0.5,
            },
          );
          assert.equal(
            fraction.status,
            400,
          );
          assert.deepEqual(
            await fraction.json(),
            {
              error: "Invalid user index",
            },
          );
        },
      );
    }
  },
);

describe(
  "dev mode",
  () => {
    test(
      "answers on 127.0.0.1 and refuses the machine's other addresses",
      async (t) => {
        const otherAddress = Object.values(os.networkInterfaces()).flat().find(
          (address) => address && address.family === "IPv4" && !address.internal,
        )?.address;
        const app = await startApp("development");
        try {
          assert.equal(
            (await fetch(`${app.url}/client.js`)).status,
            200,
          );
          if (!otherAddress) {
            t.skip("no non-loopback IPv4 address on this machine");
            return;
          }
          await assert.rejects(
            fetch(`http://${otherAddress}:${app.port}/client.js`),
            /fetch failed/,
          );
        } finally {
          app.stop();
        }
      },
    );
  },
);
