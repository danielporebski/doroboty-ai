import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
function inventory(root) {
  const files = {};
  function visit(folder, prefix = "") {
    for (const entry of fs
      .readdirSync(folder, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name, "en"))) {
      const relative = prefix + entry.name;
      assert(!entry.isSymbolicLink(), "Release cannot include symbolic links.");
      if (entry.isDirectory()) visit(path.join(folder, entry.name), relative + "/");
      else if (relative !== "release.json") {
        const bytes = fs.readFileSync(path.join(root, relative));
        files[relative] = { sha256: hash(bytes), bytes: bytes.length };
      }
    }
  }
  visit(root);
  assert(files["index.html"], "Missing index.html; build the static site first.");
  return files;
}
function manifest(root) {
  const files = inventory(root);
  return { version: 1, id: hash(JSON.stringify(files)), files };
}
function verify(root) {
  const expected = JSON.parse(fs.readFileSync(path.join(root, "release.json"), "utf8"));
  assert.deepEqual(manifest(root), expected, "Release identity or file integrity mismatch.");
  return expected;
}
async function smoke(address, root) {
  const expected = verify(root);
  const base = new URL(address);
  assert(
    !base.username && !base.password && !base.search && !base.hash,
    "Use a plain site base URL without credentials, query or hash.",
  );
  assert(
    base.protocol === "https:" ||
      (base.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(base.hostname)),
    "HTTPS is required outside loopback.",
  );
  assert(base.pathname.endsWith("/"), "The site base URL must end with /.");
  async function get(relative) {
    const response = await fetch(new URL(relative, base), {
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    assert(response.ok, `HTTP ${response.status}: ${relative}`);
    return Buffer.from(await response.arrayBuffer());
  }
  const deployed = JSON.parse((await get("release.json")).toString());
  assert.deepEqual(deployed, expected, "The target is serving a different release.");
  for (const [relative, file] of Object.entries(expected.files)) {
    // Paths originate from the verified local artifact, never the remote response.
    const bytes = await get(relative);
    assert.equal(bytes.length, file.bytes, `Size mismatch: ${relative}`);
    assert.equal(hash(bytes), file.sha256, `Hash mismatch: ${relative}`);
  }
  console.log(
    `Static smoke passed: release ${expected.id}; ${Object.keys(expected.files).length} files.`,
  );
}

const [command, argument, localArtifact] = process.argv.slice(2);
if (command === "manifest") {
  const root = path.resolve(argument ?? "dist");
  fs.writeFileSync(path.join(root, "release.json"), JSON.stringify(manifest(root), null, 2) + "\n");
  console.log(`Release manifest: ${verify(root).id}`);
} else if (command === "package") {
  assert(
    argument && path.isAbsolute(argument),
    "Pass an absolute output path outside the repository.",
  );
  const target = path.resolve(argument);
  const relative = path.relative(process.cwd(), target);
  assert(
    relative.startsWith(`..${path.sep}`) && !process.cwd().startsWith(target + path.sep),
    "Output must be outside the repository and not an ancestor.",
  );
  assert(!fs.existsSync(target), "Output already exists; retain releases in separate directories.");
  verify("dist");
  fs.cpSync("dist", target, { recursive: true });
  const built = verify(target);
  console.log(`Static release ${built.id} packaged (${Object.keys(built.files).length} files).`);
} else if (command === "verify") {
  console.log(`Release integrity passed: ${verify(path.resolve(argument ?? "dist")).id}`);
} else if (command === "smoke") {
  assert(
    argument && localArtifact,
    "Usage: release.mjs smoke https://site.example/ /absolute/local/artifact",
  );
  await smoke(argument, path.resolve(localArtifact));
} else {
  throw new Error("Use manifest, package, verify or smoke.");
}
