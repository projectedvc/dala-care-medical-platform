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
  assert.match(scene, /makeHeart/);
  assert.match(scene, /makeLungs/);
  assert.match(scene, /makeBrain/);
  assert.match(scene, /makeLiver/);
});

test("connects every medical narrative section to a particle target", async () => {
  const page = await readProjectFile("app/page.tsx");
  const targets = [
    "energy-generator",
    "cloud",
    "heart",
    "lungs",
    "brain",
    "ambient",
    "liver",
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
  assert.match(login, /clinical-human-v1\.png/);
  assert.match(login, /Patient digital twin/);
});

test("ships the doctor portal, AI research, patient CRM and appointments", async () => {
  const shell = await readProjectFile("app/portal/PortalShell.tsx");
  const overview = await readProjectFile("app/portal/page.tsx");
  const research = await readProjectFile("app/portal/research/page.tsx");
  const patients = await readProjectFile("app/portal/patients/page.tsx");
  const appointments = await readProjectFile("app/portal/appointments/page.tsx");
  const studies = await readProjectFile("app/portal/studies/page.tsx");
  const reports = await readProjectFile("app/portal/reports/page.tsx");
  const tasks = await readProjectFile("app/portal/tasks/page.tsx");

  assert.match(shell, /Clinical workspace/);
  assert.match(shell, /\/portal\/studies/);
  assert.match(shell, /\/portal\/research/);
  assert.match(shell, /\/portal\/patients/);
  assert.match(shell, /\/portal\/reports/);
  assert.match(shell, /\/portal\/appointments/);
  assert.match(shell, /\/portal\/tasks/);
  assert.match(overview, /AI case brief/);
  assert.match(research, /Evidence synthesis/);
  assert.match(research, /clinician review required/i);
  assert.match(patients, /Patient CRM/);
  assert.match(appointments, /Appointments/);
  assert.match(studies, /Clinical studies/);
  assert.match(studies, /Clinician verification required/);
  assert.match(reports, /Reporting queue/);
  assert.match(reports, /Before signing/);
  assert.match(tasks, /Clinical tasks/);
});

test("renders recognisable medical particle anatomy and leaves space for hand disintegration", async () => {
  const scene = await readProjectFile("app/WebGLMorphScene.tsx");
  const page = await readProjectFile("app/page.tsx");
  const styles = await readProjectFile("app/medical.css");

  assert.match(scene, /function makeBrain/);
  assert.match(scene, /function makeLungs/);
  assert.match(scene, /function makeHeart/);
  assert.match(scene, /function makeLiver/);
  assert.match(page, /organ-readout/);
  assert.match(page, /data-particle-anchor="0\.22"/);
  assert.match(styles, /\.organ-readout/);
  assert.match(styles, /\.hand-sequence-copy/);
  assert.match(styles, /top: 80%/);
});

test("keeps platform surfaces responsive and visually separate from the public scene", async () => {
  const styles = await readProjectFile("app/platform.css");

  assert.match(styles, /\.auth-page/);
  assert.match(styles, /\.portal-sidebar/);
  assert.match(styles, /\.research-workspace/);
  assert.match(styles, /@media \(max-width: 760px\)/);
});

test("uses clinical loading states and an ECG cursor across the experience", async () => {
  const chrome = await readProjectFile("app/MedicalChrome.tsx");
  const globalStyles = await readProjectFile("app/globals.css");
  const research = await readProjectFile("app/portal/research/page.tsx");
  const platformStyles = await readProjectFile("app/platform.css");

  assert.match(chrome, /loader-diagnostic/);
  assert.match(chrome, /loader-ecg/);
  assert.match(chrome, /medical-cursor-ring/);
  assert.match(globalStyles, /\.medical-loader/);
  assert.match(globalStyles, /\.medical-cursor-ring/);
  assert.match(research, /research-vital-loader/);
  assert.match(platformStyles, /\.research-vital-loader/);
});

test("ships a Windows launcher for the local site", async () => {
  const launcher = await readProjectFile("start-site.bat");

  assert.match(launcher, /npm\.cmd run dev/);
  assert.match(launcher, /http:\/\/localhost:3000/);
});
