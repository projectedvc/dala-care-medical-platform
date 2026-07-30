export type StudyStatus =
  | "Incoming"
  | "Validated"
  | "AI analyzed"
  | "Draft ready"
  | "Needs review"
  | "Signed";

export type ClinicalStudy = {
  id: string;
  accession: string;
  patient: string;
  initials: string;
  mrn: string;
  age: number;
  modality: string;
  region: string;
  requestedBy: string;
  received: string;
  priority: "Routine" | "Urgent" | "Critical";
  status: StudyStatus;
  slices: number;
  indication: string;
  aiFinding: string;
  evidence: string[];
};

export const clinicalStudies: ClinicalStudy[] = [
  {
    id: "ST-240730-184",
    accession: "ACC-730184",
    patient: "Elena Markova",
    initials: "EM",
    mrn: "00842",
    age: 42,
    modality: "CT",
    region: "Chest",
    requestedBy: "Dr. A. Khan",
    received: "Today · 12:41",
    priority: "Urgent",
    status: "Needs review",
    slices: 286,
    indication: "Intermittent palpitations with new exertional dyspnea.",
    aiFinding: "No acute pulmonary embolism. Mild dependent atelectatic change. Cardiac silhouette within expected limits.",
    evidence: ["Axial series 3 · slice 124", "Coronal series 5 · slice 41", "Prior CT · 16 Jan 2025"],
  },
  {
    id: "ST-240730-176",
    accession: "ACC-730176",
    patient: "Daniyar Bek",
    initials: "DB",
    mrn: "00407",
    age: 67,
    modality: "XR",
    region: "Chest",
    requestedBy: "Dr. N. Williams",
    received: "Today · 11:58",
    priority: "Critical",
    status: "Draft ready",
    slices: 2,
    indication: "Shortness of breath on day five after hospital discharge.",
    aiFinding: "New right basal opacity with a small pleural effusion. Recommend urgent clinical correlation.",
    evidence: ["PA projection", "Lateral projection", "Discharge radiograph · 25 Jul"],
  },
  {
    id: "ST-240730-161",
    accession: "ACC-730161",
    patient: "Sofia Omarova",
    initials: "SO",
    mrn: "00918",
    age: 35,
    modality: "MR",
    region: "Brain",
    requestedBy: "Dr. L. Chen",
    received: "Today · 10:26",
    priority: "Routine",
    status: "AI analyzed",
    slices: 412,
    indication: "Recurrent migraine with a change in aura pattern.",
    aiFinding: "No acute intracranial abnormality. A few nonspecific punctate FLAIR hyperintensities.",
    evidence: ["Axial FLAIR · slice 63", "DWI · slice 31", "ADC map · slice 31"],
  },
  {
    id: "ST-240730-149",
    accession: "ACC-730149",
    patient: "Arman Tulegenov",
    initials: "AT",
    mrn: "00611",
    age: 58,
    modality: "US",
    region: "Liver",
    requestedBy: "Dr. M. Issaeva",
    received: "Today · 09:37",
    priority: "Routine",
    status: "Validated",
    slices: 48,
    indication: "Persistently elevated transaminases.",
    aiFinding: "Analysis has not started. Image quality checks passed.",
    evidence: ["B-mode cine loop", "Portal vein Doppler", "Elastography series"],
  },
  {
    id: "ST-240729-392",
    accession: "ACC-729392",
    patient: "Amina Kassen",
    initials: "AK",
    mrn: "00874",
    age: 29,
    modality: "CT",
    region: "Abdomen",
    requestedBy: "Dr. N. Williams",
    received: "Yesterday · 17:12",
    priority: "Routine",
    status: "Signed",
    slices: 318,
    indication: "Right upper quadrant pain.",
    aiFinding: "No acute abdominal process. Incidental 7 mm simple renal cyst.",
    evidence: ["Portal venous phase", "Coronal reformat", "Sagittal reformat"],
  },
];

export const reportQueue = [
  { id: "RP-184", patient: "Elena Markova", study: "CT chest", status: "Needs review", updated: "7 min", author: "Dala Clinical AI" },
  { id: "RP-176", patient: "Daniyar Bek", study: "Chest radiograph", status: "Draft ready", updated: "19 min", author: "Dala Clinical AI" },
  { id: "RP-161", patient: "Sofia Omarova", study: "Brain MRI", status: "AI analyzed", updated: "42 min", author: "Dala Clinical AI" },
  { id: "RP-392", patient: "Amina Kassen", study: "CT abdomen", status: "Signed", updated: "Yesterday", author: "Dr. Noah Williams" },
];

export const clinicalTasks = [
  { id: 1, title: "Review critical chest radiograph", patient: "Daniyar Bek", due: "Now", owner: "You", priority: "Critical", group: "Today" },
  { id: 2, title: "Confirm CT chest report", patient: "Elena Markova", due: "13:20", owner: "You", priority: "Urgent", group: "Today" },
  { id: 3, title: "Call patient with ferritin result", patient: "Sofia Omarova", due: "15:30", owner: "Care team", priority: "Routine", group: "Today" },
  { id: 4, title: "Approve hypertension care plan", patient: "Arman Tulegenov", due: "Tomorrow", owner: "You", priority: "Routine", group: "Upcoming" },
  { id: 5, title: "Reconcile discharge medication", patient: "Daniyar Bek", due: "Tomorrow", owner: "Pharmacy", priority: "Urgent", group: "Upcoming" },
  { id: 6, title: "Prepare multidisciplinary case review", patient: "Mila Akhmetova", due: "04 Aug", owner: "Care team", priority: "Routine", group: "Upcoming" },
];
