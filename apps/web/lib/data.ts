// Sample data for the coach workspace. Deterministic so numbers are stable across renders.
// Every screen reads through this module; swapping it for the Supabase data layer later
// must not require changing a single component.

export type ClientStatus = "active" | "paused" | "leaving" | "completed";

export type Client = {
  id: string;
  name: string;
  email: string;
  goal: string;
  status: ClientStatus;
  joined: string;
  checkInDay: string;
  /** Planned workouts completed over the last four weeks, or null with no plan yet. */
  adherence: number | null;
  weights: number[];
  targetKg: number | null;
  nextRenewal: string | null;
  feeInr: number | null;
  unread: number;
  lastCheckIn: string | null;
  reviewed: boolean;
  attention?: string;
  journey: Journey;
};

/**
 * The four stages of a client's time with a coach. A client moves forward only; a stage that
 * has not started yet has a null date.
 */
export type JourneyStage = "onboarding" | "transformation" | "maintenance" | "ongoing";

export type Journey = {
  /** The day each stage began, or null when the client has not reached it. */
  started: Record<JourneyStage, string | null>;
  /** Planned length of the transformation block. */
  transformationWeeks: number;
  /** Planned length of the maintenance block that follows it. */
  maintenanceWeeks: number;
};

export type CheckIn = {
  id: string;
  clientId: string;
  clientName: string;
  week: number;
  submittedAt: string;
  reviewed: boolean;
  photos: number;
  weightKg: number | null;
  answers: { question: string; answer: string }[];
};

export type Message = {
  id: string;
  clientId: string;
  clientName: string;
  from: "coach" | "client";
  at: string;
  text: string;
  unread: boolean;
};

export type PlanDay = {
  name: string;
  exercises: { name: string; sets: number; reps: string; restSec: number; /** e.g. "60 kg", "RPE 8", "bodyweight" */ load?: string }[];
};

export type Plan = {
  clientId: string;
  clientName: string;
  status: "none" | "draft" | "active" | "ending";
  week: number;
  weeks: number;
  days: PlanDay[];
};

/* ------------------------------------------------------------------ */

const NAMES = [
  "Sanjay Rao", "Priya Nair", "Arjun Mehta", "Kavya Iyer", "Rahul Verma",
  "Meera Joshi", "Vikram Shah", "Ananya Desai", "Karthik Reddy", "Sneha Kulkarni",
  "Aditya Bhat", "Riya Sharma", "Nikhil Menon", "Divya Pillai", "Rohit Gupta",
  "Aisha Khan", "Siddharth Rao", "Tanvi Patel", "Harsha Vardhan", "Neha Singh",
  "Manish Kumar", "Pooja Reddy", "Varun Malhotra", "Lakshmi Narayan", "Aman Sethi",
  "Shreya Ghosh", "Kiran Das", "Madhavi Rane", "Omar Sheikh", "Ritu Bansal",
  "Deepak Chauhan", "Anjali Menon", "Suresh Babu", "Ishita Roy", "Gaurav Jain",
  "Nandini Rao", "Farhan Ali", "Bhavya Shetty", "Rakesh Nayak", "Sonal Kapoor",
] as const;

const GOALS = [
  "Lose 8 kg", "Build muscle", "Get stronger", "HYROX prep", "Fat loss + tone",
  "Run 10 km", "Post-injury return", "Recomposition",
] as const;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Small deterministic PRNG so the sample data never changes between builds. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

const r = rng(42);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(r() * arr.length)];
const between = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
function isoDaysAhead(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * A plausible journey from the join date: a week of onboarding, a 12- or 16-week transformation,
 * an 8-week maintenance block, then ongoing coaching. Clients without a plan are still onboarding.
 */
function sampleJourney(joinedAgo: number, hasPlan: boolean, i: number): Journey {
  const transformationWeeks = i % 3 === 0 ? 16 : 12;
  const maintenanceWeeks = 8;
  const onboardingDays = 7;
  const tAgo = joinedAgo - onboardingDays;
  const mAgo = tAgo - transformationWeeks * 7;
  const oAgo = mAgo - maintenanceWeeks * 7;
  return {
    transformationWeeks,
    maintenanceWeeks,
    started: {
      onboarding: isoDaysAgo(joinedAgo),
      transformation: hasPlan && tAgo >= 0 ? isoDaysAgo(tAgo) : null,
      maintenance: hasPlan && mAgo >= 0 ? isoDaysAgo(mAgo) : null,
      ongoing: hasPlan && oAgo >= 0 ? isoDaysAgo(oAgo) : null,
    },
  };
}

export const CLIENTS: Client[] = NAMES.map((name, i) => {
  const status: ClientStatus =
    i % 17 === 0 ? "paused" : i % 23 === 0 ? "leaving" : i % 29 === 0 ? "completed" : "active";
  const hasPlan = i % 11 !== 0;
  const start = 60 + between(0, 55);
  const weights: number[] = [];
  let w = start;
  for (let k = 0; k < 8; k += 1) {
    w += (r() - 0.55) * 1.4;
    weights.push(Math.round(w * 10) / 10);
  }
  const adherence = hasPlan ? between(35, 100) : null;
  const REASONS = [
    "Adherence dropped this week",
    "No check-in for 6 days",
    "Check-in to review",
    "Missed two sessions",
    "Weight flat for 3 weeks",
    "Asked about a plan change",
  ];
  const attention =
    adherence !== null && adherence < 60
      ? REASONS[i % 3]
      : i % 13 === 0
        ? REASONS[3]
        : i % 19 === 0
          ? REASONS[4]
          : i % 23 === 0
            ? REASONS[5]
            : undefined;

  // Drawn in the same order as before, so every other sample value stays where it was.
  const goal = pick(GOALS);
  const joinedAgo = between(20, 200);

  return {
    id: `c${String(i + 1).padStart(2, "0")}`,
    name,
    email: `${name.split(" ")[0]?.toLowerCase()}@example.com`,
    goal,
    status,
    joined: isoDaysAgo(joinedAgo),
    journey: sampleJourney(joinedAgo, hasPlan, i),
    checkInDay: pick(DAYS),
    adherence,
    weights,
    targetKg: Math.round((start - between(3, 9)) * 10) / 10,
    nextRenewal: status === "active" ? isoDaysAhead(between(2, 40)) : null,
    feeInr: i % 11 === 0 ? null : between(2, 7) * 500,
    unread: r() > 0.72 ? between(1, 3) : 0,
    lastCheckIn: hasPlan ? isoDaysAgo(between(0, 9)) : null,
    reviewed: r() > 0.5,
    attention,
  };
});

const QUESTIONS = [
  ["How did training feel this week?", "Strong on the first two sessions, the third felt heavy."],
  ["Sleep average?", "6h 20m — two late nights."],
  ["Steps per day?", "About 7,500 on average."],
  ["Anything hurt?", "Left knee a little sore after squats."],
  ["How was the diet adherence?", "Good, except Saturday dinner out."],
] as const;

export const CHECK_INS: CheckIn[] = CLIENTS.filter((c) => c.lastCheckIn).map((c, i) => ({
  id: `k${String(i + 1).padStart(2, "0")}`,
  clientId: c.id,
  clientName: c.name,
  week: between(3, 12),
  submittedAt: c.lastCheckIn as string,
  reviewed: c.reviewed,
  photos: between(0, 3),
  weightKg: c.weights[c.weights.length - 1] ?? null,
  answers: QUESTIONS.slice(0, between(3, 5)).map(([question, answer]) => ({ question, answer })),
}));

const CLIENT_LINES = [
  "Sent my check-in — knee felt better this week.",
  "Can we swap Thursday to Friday? Work travel.",
  "Hit 100 kg for 5 today. Felt solid.",
  "Struggling with the evening meals, any ideas?",
  "Missed yesterday, long shift. Back today.",
  "Weight is stuck at 78 for ten days now.",
  "Photos uploaded. Do I look leaner?",
];
const COACH_LINES = [
  "Got it. Keep the squat depth where it is, we'll push next week.",
  "Moved Thursday to Friday. Keep the same order.",
  "Nice work. Add 2.5 kg next session.",
  "Let's simplify dinners: protein plus one carb, no cooking marathon.",
  "No stress. Do the short version today.",
  "Hold calories this week, we'll reassess on Monday.",
  "Definitely leaner through the waist. Keep going.",
];

export const MESSAGES: Message[] = CLIENTS.slice(0, 14).flatMap((c, i) => [
  {
    id: `m${i}-1`,
    clientId: c.id,
    clientName: c.name,
    from: "client" as const,
    at: isoDaysAgo(between(0, 3)),
    text: CLIENT_LINES[i % CLIENT_LINES.length] as string,
    unread: c.unread > 0,
  },
  {
    id: `m${i}-2`,
    clientId: c.id,
    clientName: c.name,
    from: "coach" as const,
    at: isoDaysAgo(between(0, 2)),
    text: COACH_LINES[i % COACH_LINES.length] as string,
    unread: false,
  },
]);

const POOL = [
  { name: "Back squat", sets: 4, reps: "6-8", restSec: 150 },
  { name: "Romanian deadlift", sets: 3, reps: "8-10", restSec: 120 },
  { name: "Bench press", sets: 4, reps: "6-8", restSec: 150 },
  { name: "Weighted pull-up", sets: 3, reps: "5-6", restSec: 120 },
  { name: "Walking lunge", sets: 3, reps: "10/leg", restSec: 90 },
  { name: "Overhead press", sets: 3, reps: "8-10", restSec: 120 },
  { name: "Cable row", sets: 3, reps: "10-12", restSec: 90 },
  { name: "Hanging leg raise", sets: 3, reps: "12-15", restSec: 60 },
];

export const PLANS: Plan[] = CLIENTS.map((c, i) => {
  const status = i % 11 === 0 ? "none" : i % 9 === 0 ? "ending" : "active";
  const days: PlanDay[] = ["Day 1 — Lower", "Day 2 — Upper", "Day 3 — Lower", "Day 4 — Upper"].map(
    (name, d) => ({ name, exercises: POOL.slice(d, d + 4) }),
  );
  return {
    clientId: c.id,
    clientName: c.name,
    status: status as Plan["status"],
    week: between(1, 8),
    weeks: 8,
    days,
  };
});

/** Starting points offered when a coach builds a first week. Copied, never edited in place. */
export type PlanTemplate = { id: string; name: string; summary: string; days: PlanDay[] };

const ex = (name: string, sets: number, reps: string, restSec: number) => ({ name, sets, reps, restSec });

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: "full-body-3",
    name: "Full body, 3 days",
    summary: "For beginners and busy clients. Every session trains the whole body.",
    days: [
      { name: "Day 1 — Full body A", exercises: [ex("Back squat", 3, "8-10", 120), ex("Bench press", 3, "8-10", 120), ex("Cable row", 3, "10-12", 90)] },
      { name: "Day 2 — Full body B", exercises: [ex("Romanian deadlift", 3, "8-10", 120), ex("Overhead press", 3, "8-10", 90), ex("Lat pulldown", 3, "10-12", 90)] },
      { name: "Day 3 — Full body C", exercises: [ex("Walking lunge", 3, "10/leg", 90), ex("Incline dumbbell press", 3, "10-12", 90), ex("Hanging leg raise", 3, "12-15", 60)] },
    ],
  },
  {
    id: "upper-lower-4",
    name: "Upper / lower, 4 days",
    summary: "For intermediate clients building strength and muscle.",
    days: ["Day 1 — Lower", "Day 2 — Upper", "Day 3 — Lower", "Day 4 — Upper"].map((name, d) => ({
      name,
      exercises: POOL.slice(d, d + 4).map((e) => ({ ...e })),
    })),
  },
];

export const GOAL_SUGGESTIONS: readonly string[] = GOALS;

export type Exercise = {
  name: string;
  muscle: string;
  equipment: string;
  /** Whether a demo video is attached. */
  demo: boolean;
  cues: string[];
  custom?: boolean;
  videoUrl?: string;
};

const exr = (name: string, muscle: string, equipment: string, demo: boolean, cues: string[]): Exercise => ({ name, muscle, equipment, demo, cues });

export const LIBRARY: Exercise[] = [
  exr("Back squat", "Quadriceps", "Barbell", true, ["Brace before you descend", "Knees track over toes", "Hips and chest rise together"]),
  exr("Romanian deadlift", "Hamstrings", "Barbell", true, ["Soft knees, push hips back", "Bar stays against the thighs", "Stop when the hamstrings are tight"]),
  exr("Bench press", "Chest", "Barbell", true, ["Shoulder blades pinned back", "Bar to the lower chest", "Feet drive into the floor"]),
  exr("Weighted pull-up", "Lats", "Bodyweight", true, ["Start from a dead hang", "Pull elbows to the ribs", "Chin clears the bar"]),
  exr("Overhead press", "Shoulders", "Barbell", false, ["Squeeze glutes, ribs down", "Press the bar back over the head", "Lock out with biceps by the ears"]),
  exr("Cable row", "Upper back", "Cable", true, ["Tall chest", "Pull to the belly button", "Pause with shoulder blades squeezed"]),
  exr("Walking lunge", "Glutes", "Dumbbell", false, ["Long stride", "Back knee kisses the floor", "Push through the front heel"]),
  exr("Hanging leg raise", "Abdominals", "Bodyweight", true, ["No swinging", "Curl the pelvis up", "Lower slowly"]),
  exr("Leg press", "Quadriceps", "Machine", true, ["Feet shoulder width", "Lower until the hips start to tuck", "Don't lock the knees"]),
  exr("Face pull", "Traps", "Cable", false, ["Rope to the eyebrows", "Elbows high", "Thumbs point back at the end"]),
  exr("Lat pulldown", "Lats", "Cable", true, ["Lean back slightly", "Bar to the upper chest", "Control the return"]),
  exr("Incline dumbbell press", "Chest", "Dumbbell", true, ["Bench at 30 degrees", "Elbows at 45 degrees", "Press up and slightly in"]),
  exr("Goblet squat", "Quadriceps", "Kettlebell", true, ["Hold the bell at the chest", "Elbows inside the knees", "Sit between the heels"]),
  exr("Hip thrust", "Glutes", "Barbell", true, ["Upper back on the bench", "Chin tucked", "Squeeze at the top for a second"]),
  exr("Bulgarian split squat", "Glutes", "Dumbbell", true, ["Rear foot laces down", "Torso leans slightly forward", "Drive through the front foot"]),
  exr("Push-up", "Chest", "Bodyweight", true, ["Body in one straight line", "Hands under shoulders", "Chest to a fist from the floor"]),
  exr("Dumbbell row", "Upper back", "Dumbbell", true, ["Flat back", "Pull the dumbbell to the hip", "No twisting"]),
  exr("Lateral raise", "Shoulders", "Dumbbell", false, ["Slight bend in the elbows", "Lead with the elbows", "Stop at shoulder height"]),
  exr("Plank", "Abdominals", "Bodyweight", true, ["Elbows under shoulders", "Squeeze glutes", "Breathe without sagging"]),
  exr("Kettlebell swing", "Hamstrings", "Kettlebell", true, ["Hinge, don't squat", "Snap the hips", "Bell floats to chest height"]),
  exr("Farmer's carry", "Grip", "Dumbbell", false, ["Stand tall", "Short, quick steps", "Shoulders down and back"]),
  exr("Surya namaskar", "Full body", "Bodyweight", true, ["Move with the breath", "Hands stay planted", "Twelve positions, one flow"]),
];


export type LeadStage = "New" | "Contacted" | "Call booked" | "Trial" | "Converted" | "Lost";

export type Lead = {
  id: string;
  name: string;
  source: string;
  stage: LeadStage;
  /** Next follow-up date. */
  due: string;
  goal: string;
  /** Every touch, oldest first. Kept when the lead converts. */
  history: { date: string; text: string }[];
  lostReason?: string;
};

export const LEADS: Lead[] = [
  { id: "l1", name: "Rohan Kapoor", source: "Instagram", stage: "Call booked", due: isoDaysAhead(1), goal: "Lose 12 kg", history: [{ date: isoDaysAgo(6), text: "DM from the transformation reel" }, { date: isoDaysAgo(3), text: "Sent pricing on WhatsApp" }, { date: isoDaysAgo(1), text: "Call booked for tomorrow 7 pm" }] },
  { id: "l2", name: "Simran Kaur", source: "Referral", stage: "Contacted", due: isoDaysAhead(0), goal: "Post-pregnancy strength", history: [{ date: isoDaysAgo(4), text: "Referred by Priya Nair" }, { date: isoDaysAgo(2), text: "Intro message sent" }] },
  { id: "l3", name: "Abhishek Rao", source: "LinkedIn", stage: "New", due: isoDaysAhead(3), goal: "Build muscle", history: [{ date: isoDaysAgo(1), text: "Filled the website form" }] },
  { id: "l4", name: "Tara Menon", source: "Website", stage: "Trial", due: isoDaysAhead(2), goal: "Run a half marathon", history: [{ date: isoDaysAgo(12), text: "Filled the website form" }, { date: isoDaysAgo(9), text: "Discovery call" }, { date: isoDaysAgo(5), text: "Started a one-week trial" }] },
  { id: "l5", name: "Yash Patel", source: "Instagram", stage: "Contacted", due: isoDaysAhead(5), goal: "Fat loss", history: [{ date: isoDaysAgo(3), text: "Story reply" }, { date: isoDaysAgo(2), text: "Sent the intake form" }] },
  { id: "l6", name: "Neeraj Sinha", source: "Referral", stage: "New", due: isoDaysAgo(1), goal: "Back pain, get stronger", history: [{ date: isoDaysAgo(2), text: "Referred by Arjun Mehta" }] },
  { id: "l7", name: "Pallavi Deshmukh", source: "Website", stage: "Trial", due: isoDaysAhead(1), goal: "Lose 6 kg before a wedding", history: [{ date: isoDaysAgo(14), text: "Filled the website form" }, { date: isoDaysAgo(8), text: "Discovery call" }, { date: isoDaysAgo(6), text: "Started a one-week trial" }] },
  { id: "l8", name: "Karan Oberoi", source: "Instagram", stage: "Converted", due: isoDaysAgo(10), goal: "HYROX prep", history: [{ date: isoDaysAgo(30), text: "DM from a HYROX post" }, { date: isoDaysAgo(20), text: "Trial week" }, { date: isoDaysAgo(12), text: "Paid the first month" }] },
  { id: "l9", name: "Fatima Sheikh", source: "Website", stage: "Lost", due: isoDaysAgo(15), goal: "Fat loss", lostReason: "Price", history: [{ date: isoDaysAgo(25), text: "Filled the website form" }, { date: isoDaysAgo(18), text: "Discovery call" }, { date: isoDaysAgo(15), text: "Chose a cheaper app" }] },
];


export const REVENUE = [
  { month: "Jun", inr: 42000 },
  { month: "Jul", inr: 48500 },
  { month: "Aug", inr: 51000 },
  { month: "Sep", inr: 57500 },
  { month: "Oct", inr: 61000 },
  { month: "Nov", inr: 68000 },
];

export const COACH = {
  name: "Anjali Rao",
  email: "anjali@arcwell.test",
  plan: "Coach",
  clientLimit: 25,
  nextCharge: isoDaysAhead(12),
  feeInr: 999,
};

/** Sample week for the nutrition and recovery tabs until food and sleep logs are wired. */
export const SAMPLE_WEEK = {
  days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  caloriesKcal: [2100, 1950, 2200, 2050, 1800, 2300, 2150],
  calorieTargetKcal: 2000,
  sleepHours: [7.5, 6.2, 8, 7.1, 6.8, 7.9, 7.4],
  sleepTargetHours: 7,
};

/** Clients who have left, with the stage they were in and why. Feeds the journey board and churn. */
export type FormerClient = {
  id: string;
  name: string;
  goal: string;
  joined: string;
  left: string;
  stageAtExit: JourneyStage;
  reason: ChurnReason;
};

export type ChurnReason = "Budget" | "Moved city" | "Injury" | "Lost motivation" | "Reached goal, training alone" | "Switched coach";

export const FORMER_CLIENTS: FormerClient[] = [
  { id: "f01", name: "Rohan Bhatia", goal: "Lose 10 kg", joined: isoDaysAgo(320), left: isoDaysAgo(150), stageAtExit: "ongoing", reason: "Reached goal, training alone" },
  { id: "f02", name: "Meghna Iyer", goal: "Build muscle", joined: isoDaysAgo(210), left: isoDaysAgo(160), stageAtExit: "transformation", reason: "Budget" },
  { id: "f03", name: "Prakash Kumar", goal: "Run 10 km", joined: isoDaysAgo(260), left: isoDaysAgo(120), stageAtExit: "maintenance", reason: "Moved city" },
  { id: "f04", name: "Zoya Mirza", goal: "Fat loss + tone", joined: isoDaysAgo(140), left: isoDaysAgo(125), stageAtExit: "onboarding", reason: "Lost motivation" },
  { id: "f05", name: "Tushar Agarwal", goal: "Post-injury return", joined: isoDaysAgo(190), left: isoDaysAgo(110), stageAtExit: "transformation", reason: "Injury" },
  { id: "f06", name: "Kritika Saini", goal: "Recomposition", joined: isoDaysAgo(300), left: isoDaysAgo(60), stageAtExit: "maintenance", reason: "Reached goal, training alone" },
  { id: "f07", name: "Imran Qureshi", goal: "Get stronger", joined: isoDaysAgo(120), left: isoDaysAgo(70), stageAtExit: "transformation", reason: "Switched coach" },
  { id: "f08", name: "Ankita Joshi", goal: "Lose 8 kg", joined: isoDaysAgo(400), left: isoDaysAgo(30), stageAtExit: "ongoing", reason: "Budget" },
];

/* --------------------------------------------------------------- progress */

/** One body measurement tracked over time: one dated entry per check. */
export type Measurement = { label: string; unit: string; entries: { date: string; value: number }[] };

/** A set of progress photos taken on one day, from the client's app. */
export type PhotoSet = { date: string; angles: string[] };

/**
 * Measurements every three weeks since the transformation began, drifting by a small, client-
 * specific amount so trends differ. Clients still onboarding have none yet.
 */
function sampleMeasurements(c: Client, i: number): Measurement[] {
  if (!c.journey.started.transformation) return [];
  const base = [
    { label: "Waist", unit: "cm", start: 82 + (i % 9) * 2, step: -0.6 - (i % 4) * 0.3 },
    { label: "Hips", unit: "cm", start: 96 + (i % 7) * 2, step: -0.4 - (i % 3) * 0.2 },
    { label: "Chest", unit: "cm", start: 92 + (i % 8) * 2, step: (i % 2 ? 0.3 : -0.2) },
    { label: "Upper arm", unit: "cm", start: 30 + (i % 5), step: (i % 3 ? 0.2 : -0.1) },
  ];
  const count = 5;
  return base.map((m) => ({
    label: m.label,
    unit: m.unit,
    entries: Array.from({ length: count }, (_, k) => ({
      date: isoDaysAgo((count - 1 - k) * 21),
      value: Math.round((m.start + m.step * k + ((i + k) % 3) * 0.2) * 10) / 10,
    })),
  }));
}

export const MEASUREMENTS: Record<string, Measurement[]> = Object.fromEntries(CLIENTS.map((c, i) => [c.id, sampleMeasurements(c, i)]));

/** Progress photos roughly every four weeks, front, side and back. */
export const PHOTO_SETS: Record<string, PhotoSet[]> = Object.fromEntries(
  CLIENTS.map((c, i) => [
    c.id,
    c.journey.started.transformation
      ? Array.from({ length: 2 + (i % 4) }, (_, k) => ({ date: isoDaysAgo(k * 28 + (i % 6)), angles: ["Front", "Side", "Back"] })).reverse()
      : [],
  ]),
);

/* ---------------------------------------------------------------- pricing */

/** Arcwell's plans for coaches. Yearly is monthly × 10. No per-client fees. */
export type Tier = {
  id: "free" | "solo" | "coach" | "business" | "elite";
  name: string;
  clients: string;
  maxClients: number | null;
  monthlyInr: number;
  includes: string[];
};

export const TIERS: Tier[] = [
  { id: "free", name: "Free", clients: "1–3 clients", maxClients: 3, monthlyInr: 0, includes: ["Arcwell mobile app", "3 plan types"] },
  { id: "solo", name: "Solo", clients: "4–7 clients", maxClients: 7, monthlyInr: 499, includes: ["Arcwell mobile app", "All plan types", "Check-ins and messaging"] },
  { id: "coach", name: "Coach", clients: "8–25 clients", maxClients: 25, monthlyInr: 999, includes: ["Everything in Solo", "Web dashboard", "Journey board and business CRM"] },
  { id: "business", name: "Business", clients: "26–40 clients", maxClients: 40, monthlyInr: 1999, includes: ["Everything in Coach", "White-label web workspace", "Assistant coaches"] },
  { id: "elite", name: "Elite", clients: "41+ clients", maxClients: null, monthlyInr: 4999, includes: ["Everything in Business", "AI program assistant", "Unlimited clients"] },
];

export const GST_RATE = 0.18;

export type Invoice = { id: string; date: string; plan: string; period: string; amountInr: number; status: "Paid" | "Due" };

export const INVOICES: Invoice[] = [0, 1, 2, 3, 4, 5].map((k) => ({
  id: `AW-2026-${String(118 - k).padStart(4, "0")}`,
  date: isoDaysAgo(18 + k * 30),
  plan: "Coach, monthly",
  period: `${isoDaysAgo(18 + k * 30)} to ${isoDaysAgo(18 + (k - 1) * 30)}`,
  amountInr: 999,
  status: "Paid",
}));

/* -------------------------------------------------------------- food data */

/**
 * Indian foods by household measure. These are sample values for building the screens; the
 * licensed food database replaces them, and its source and licence are recorded with it.
 */
export type Food = {
  id: string;
  name: string;
  /** Other names people search by: regional and Hindi names. */
  aka: string[];
  category: "Grains" | "Dal and legumes" | "Vegetables" | "Dairy" | "Eggs, meat and fish" | "Snacks" | "Fruit" | "Drinks";
  measure: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  custom?: boolean;
};

const fd = (id: string, name: string, aka: string[], category: Food["category"], measure: string, grams: number, kcal: number, protein: number, carbs: number, fat: number): Food => ({ id, name, aka, category, measure, grams, kcal, protein, carbs, fat });

export const FOODS: Food[] = [
  fd("roti", "Whole wheat roti", ["chapati", "phulka", "rotli"], "Grains", "1 roti", 40, 120, 3.6, 20, 3),
  fd("rice", "Steamed rice", ["chawal", "annam", "bhaat"], "Grains", "1 katori", 150, 195, 4, 42, 0.5),
  fd("jeera-rice", "Jeera rice", ["cumin rice"], "Grains", "1 katori", 150, 230, 4, 40, 6),
  fd("idli", "Idli", ["iddli"], "Grains", "1 piece", 40, 58, 2, 12, 0.2),
  fd("dosa", "Plain dosa", ["dosai", "dosey"], "Grains", "1 piece", 80, 168, 4, 28, 4),
  fd("poha", "Poha", ["aval", "chivda", "atukulu"], "Grains", "1 katori", 150, 250, 4.5, 40, 8),
  fd("upma", "Rava upma", ["uppittu", "kharabath"], "Grains", "1 katori", 150, 240, 5, 36, 8),
  fd("oats", "Oats porridge with milk", ["daliya"], "Grains", "1 katori", 200, 230, 9, 32, 7),
  fd("dal", "Toor dal", ["arhar dal", "tuvar", "paruppu", "pappu"], "Dal and legumes", "1 katori", 150, 150, 9, 22, 3),
  fd("moong", "Moong dal", ["pesarapappu", "hesaru bele"], "Dal and legumes", "1 katori", 150, 140, 9.5, 20, 2.5),
  fd("rajma", "Rajma curry", ["kidney beans"], "Dal and legumes", "1 katori", 150, 210, 10, 28, 6),
  fd("chole", "Chole", ["chana masala", "kabuli chana"], "Dal and legumes", "1 katori", 150, 230, 10, 30, 8),
  fd("sambar", "Sambar", ["sambhar", "kuzhambu"], "Dal and legumes", "1 katori", 150, 130, 6, 18, 4),
  fd("paneer", "Paneer", ["cottage cheese", "chhena"], "Dairy", "100 g", 100, 265, 18, 3.5, 20),
  fd("curd", "Curd", ["dahi", "thayir", "perugu", "mosaru"], "Dairy", "1 katori", 150, 90, 5, 7, 4.5),
  fd("milk", "Toned milk", ["doodh", "paal"], "Dairy", "1 glass", 250, 145, 8, 12, 7.5),
  fd("buttermilk", "Buttermilk", ["chaas", "majjige", "mor"], "Drinks", "1 glass", 250, 40, 2.5, 4, 1.5),
  fd("whey", "Whey protein in water", ["protein shake"], "Drinks", "1 scoop", 30, 120, 24, 3, 1.5),
  fd("egg", "Boiled egg", ["anda", "muttai"], "Eggs, meat and fish", "1 piece", 50, 72, 6.3, 0.4, 5),
  fd("egg-white", "Egg white", ["anda safedi"], "Eggs, meat and fish", "1 piece", 33, 17, 3.6, 0.2, 0),
  fd("chicken-curry", "Chicken curry", ["murgh", "kozhi curry"], "Eggs, meat and fish", "1 katori", 150, 245, 24, 6, 14),
  fd("chicken-breast", "Grilled chicken breast", ["tandoori chicken breast"], "Eggs, meat and fish", "100 g", 100, 165, 31, 0, 3.6),
  fd("fish-curry", "Fish curry", ["meen kuzhambu", "machher jhol"], "Eggs, meat and fish", "1 katori", 150, 200, 20, 6, 10),
  fd("bhindi", "Bhindi sabzi", ["okra", "vendakkai", "bendakaya"], "Vegetables", "1 katori", 150, 120, 3, 12, 7),
  fd("palak", "Palak sabzi", ["spinach", "keerai"], "Vegetables", "1 katori", 150, 100, 4, 8, 6),
  fd("mixed-veg", "Mixed vegetable sabzi", ["sabzi", "poriyal", "thoran"], "Vegetables", "1 katori", 150, 130, 3.5, 14, 7),
  fd("salad", "Cucumber tomato salad", ["kachumber"], "Vegetables", "1 katori", 150, 30, 1.2, 6, 0.3),
  fd("banana", "Banana", ["kela", "vazhaipazham"], "Fruit", "1 piece", 120, 105, 1.3, 27, 0.4),
  fd("apple", "Apple", ["seb"], "Fruit", "1 piece", 180, 95, 0.5, 25, 0.3),
  fd("sprouts", "Sprouts chaat", ["moong sprouts", "mulaikattiya payaru"], "Snacks", "1 katori", 100, 110, 8, 18, 1),
  fd("chana", "Roasted chana", ["bhuna chana", "putani"], "Snacks", "1 handful", 30, 110, 6, 17, 2),
  fd("peanuts", "Peanuts", ["moongphali", "kadalai", "shenga"], "Snacks", "1 handful", 30, 170, 7.5, 5, 14),
  fd("samosa", "Samosa", ["singara"], "Snacks", "1 piece", 60, 260, 4, 24, 17),
  fd("chai", "Masala chai with sugar", ["tea", "chaha"], "Drinks", "1 cup", 150, 90, 2.5, 13, 3),
];

export type Recipe = { id: string; name: string; region: string; serving: string; kcal: number; protein: number; carbs: number; fat: number; ingredients: string[]; tags: string[] };

export const RECIPES: Recipe[] = [
  { id: "r1", name: "Paneer bhurji", region: "North India", serving: "1 katori", kcal: 290, protein: 19, carbs: 8, fat: 20, ingredients: ["Paneer 100 g", "Onion", "Tomato", "Capsicum", "1 tsp oil"], tags: ["High protein", "Vegetarian"] },
  { id: "r2", name: "Moong dal chilla", region: "North India", serving: "2 pieces", kcal: 240, protein: 14, carbs: 32, fat: 6, ingredients: ["Moong dal 60 g soaked", "Ginger", "Green chilli", "Coriander"], tags: ["Vegetarian", "Breakfast"] },
  { id: "r3", name: "Egg bhurji", region: "Pan-India", serving: "3 eggs", kcal: 260, protein: 19, carbs: 5, fat: 18, ingredients: ["3 eggs", "Onion", "Tomato", "1 tsp oil"], tags: ["High protein"] },
  { id: "r4", name: "Chicken tikka", region: "Punjab", serving: "150 g", kcal: 250, protein: 38, carbs: 5, fat: 8, ingredients: ["Chicken breast 150 g", "Hung curd", "Tikka masala", "Lemon"], tags: ["High protein", "Low carb"] },
  { id: "r5", name: "Ragi dosa", region: "Karnataka", serving: "2 pieces", kcal: 220, protein: 6, carbs: 40, fat: 4, ingredients: ["Ragi flour 50 g", "Rice flour 20 g", "Curd"], tags: ["Vegetarian", "High fibre"] },
  { id: "r6", name: "Soya chunk pulao", region: "Pan-India", serving: "1 plate", kcal: 380, protein: 22, carbs: 52, fat: 9, ingredients: ["Soya chunks 40 g", "Rice 60 g raw", "Peas", "Whole spices"], tags: ["Vegetarian", "High protein"] },
  { id: "r7", name: "Fish curry with rice", region: "Kerala", serving: "1 plate", kcal: 450, protein: 28, carbs: 50, fat: 14, ingredients: ["Fish 120 g", "Coconut milk", "Kudampuli", "Rice 1 katori"], tags: ["High protein"] },
  { id: "r8", name: "Besan cheela", region: "Rajasthan", serving: "2 pieces", kcal: 230, protein: 11, carbs: 28, fat: 8, ingredients: ["Besan 60 g", "Onion", "Tomato", "Ajwain"], tags: ["Vegetarian", "Breakfast"] },
];

export const MEAL_SLOTS = ["Breakfast", "Lunch", "Evening snack", "Dinner"] as const;
