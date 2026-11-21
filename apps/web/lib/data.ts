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
  exercises: { name: string; sets: number; reps: string; restSec: number }[];
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

export const LIBRARY = [
  { name: "Back squat", muscle: "Quadriceps", equipment: "Barbell", demo: true },
  { name: "Romanian deadlift", muscle: "Hamstrings", equipment: "Barbell", demo: true },
  { name: "Bench press", muscle: "Chest", equipment: "Barbell", demo: true },
  { name: "Weighted pull-up", muscle: "Lats", equipment: "Bodyweight", demo: true },
  { name: "Overhead press", muscle: "Shoulders", equipment: "Barbell", demo: false },
  { name: "Cable row", muscle: "Upper back", equipment: "Cable", demo: true },
  { name: "Walking lunge", muscle: "Glutes", equipment: "Dumbbell", demo: false },
  { name: "Hanging leg raise", muscle: "Abdominals", equipment: "Bodyweight", demo: true },
  { name: "Leg press", muscle: "Quadriceps", equipment: "Machine", demo: true },
  { name: "Face pull", muscle: "Traps", equipment: "Cable", demo: false },
];

export const LEADS = [
  { name: "Rohan Kapoor", source: "Instagram", stage: "Call booked", due: isoDaysAhead(1) },
  { name: "Simran Kaur", source: "Referral", stage: "Contacted", due: isoDaysAhead(0) },
  { name: "Abhishek Rao", source: "LinkedIn", stage: "New", due: isoDaysAhead(3) },
  { name: "Tara Menon", source: "Website", stage: "Trial", due: isoDaysAhead(2) },
  { name: "Yash Patel", source: "Instagram", stage: "Contacted", due: isoDaysAhead(5) },
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
