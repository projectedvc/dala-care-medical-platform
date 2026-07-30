import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("uses one persistent instanced WebGL particle scene", async () => {
  const scene = await readProjectFile("app/WebGLMorphScene.tsx");

  assert.match(scene, /new THREE\.WebGLRenderer/);
  assert.match(scene, /new THREE\.InstancedBufferGeometry/);
  assert.match(scene, /data-particle-shape/);
  assert.match(scene, /uMouseForce/);
  assert.match(scene, /uScrollPhase/);
  assert.match(scene, /makeBulb/);
  assert.match(scene, /makeTurbine/);
  assert.match(scene, /makeAtom/);
});

test("connects every medical narrative section to a particle target", async () => {
  const page = await readProjectFile("app/page.tsx");
  const targets = [
    "energy-generator",
    "cloud",
    "bulb",
    "turbine",
    "atom",
    "ambient",
    "investors",
    "hands",
    "energy-hub",
  ];

  for (const target of targets) {
    assert.match(page, new RegExp(`data-particle-shape=\\"${target}\\"`));
  }
  assert.match(page, /<span>See the<\/span>/);
  assert.match(page, /<span>whole<\/span>/);
  assert.match(page, /<span className="outline">patient\.<\/span>/);
  assert.match(page, /Enter Dala Care/);
});

test("ships the live medical consultation experience", async () => {
  const page = await readProjectFile("app/page.tsx");
  const styles = await readProjectFile("app/medical.css");

  assert.match(page, /meeting-shell/);
  assert.match(page, /Video consultation controls/);
  assert.match(page, /Live clinical note/);
  assert.match(page, /Open longitudinal record/);
  assert.match(styles, /\.meeting-shell/);
  assert.match(styles, /\.meeting-controls/);
});

test("connects the public experience to a dedicated clinical login", async () => {
  const page = await readProjectFile("app/page.tsx");
  const login = await readProjectFile("app/login/page.tsx");

  assert.match(page, /href="\/login"/);
  assert.match(page, /Doctor login/);
  assert.match(login, /Enter clinical workspace/);
  assert.match(login, /router\.push\("\/portal"\)/);
  assert.match(login, /fictional patient data/i);
});

test("ships the doctor portal, AI research, patient CRM and appointments", async () => {
  const shell = await readProjectFile("app/portal/PortalShell.tsx");
  const overview = await readProjectFile("app/portal/page.tsx");
  const research = await readProjectFile("app/portal/research/page.tsx");
  const patients = await readProjectFile("app/portal/patients/page.tsx");
  const appointments = await readProjectFile("app/portal/appointments/page.tsx");

  assert.match(shell, /Clinical workspace/);
  assert.match(shell, /\/portal\/research/);
  assert.match(shell, /\/portal\/patients/);
  assert.match(shell, /\/portal\/appointments/);
  assert.match(overview, /AI case brief/);
  assert.match(research, /Evidence synthesis/);
  assert.match(research, /clinician review required/i);
  assert.match(patients, /Patient CRM/);
  assert.match(appointments, /Appointments/);
});

test("keeps platform surfaces responsive and visually separate from the public scene", async () => {
  const styles = await readProjectFile("app/platform.css");

  assert.match(styles, /\.auth-page/);
  assert.match(styles, /\.portal-sidebar/);
  assert.match(styles, /\.research-workspace/);
  assert.match(styles, /@media \(max-width: 760px\)/);
});

test("ships a Windows launcher for the local site", async () => {
  const launcher = await readProjectFile("start-site.bat");

  assert.match(launcher, /npm\.cmd run dev/);
  assert.match(launcher, /http:\/\/localhost:3000/);
});
