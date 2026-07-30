# Dala Care

Dala Care is a separate medical product built from the visual language of the
Dala particle experience. It combines a public clinical-intelligence landing
page with a demonstrational workspace for doctors.

## Product surfaces

- `/` — public Dala Care presentation and live-care preview
- `/login` — doctor and clinical staff sign-in
- `/portal` — clinician overview and patient queue
- `/portal/research` — AI-assisted evidence research with patient context
- `/portal/patients` — patient CRM and care pathways
- `/portal/appointments` — appointments, preparation and consultation flow

All patients and medical records in the current version are fictional demo
data. Authentication, medical AI and protected record storage are UI-ready
surfaces for a future backend; they are not represented as production clinical
services.

## Local development

Requirements: Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, or run `start-site.bat` on Windows.

## Verification

```bash
npm test
npm run lint
```

The production build is compatible with Vercel through `vercel.json`.
