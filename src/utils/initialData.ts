import { AndonLine, AndonCall, SoundConfig, MasterMachine, UserProfile } from "../types";

// Operational data starts clean.
export const INITIAL_CALLS: AndonCall[] = [];

// Single bootstrap/sample line.
// This exists only so a fresh/demo installation can pass the line-selection login flow.
// Production master data remains managed in Firestore by Admin.
export const INITIAL_LINES: AndonLine[] = [
  {
    id: "ASSY1",
    name: "ASSY1",
    shortCode: "ASSY1",
    department: "Assembly",
    status: "running",
    workstations: ["Station 1"],
    activeCallsCount: 0,
    targetDaily: 0,
    actualOutput: 0,
    efficiency: 100,
    leaderName: "Leader / PIC",
    currentShift: "Shift 1"
  }
];

// Machines are never bundled. Admin creates/imports them into Firestore or demo storage.
export const INITIAL_MACHINES: MasterMachine[] = [];

// Legacy export retained only for compatibility.
// Authentication/demo defaults are defined in utils/auth.ts (DEFAULT_USERS).
export const INITIAL_OPERATORS: UserProfile[] = [];

export const DEFAULT_SOUND_CONFIG: SoundConfig = {
  soundEnabled: true,
  volume: 0.8,
  alarmType: "industrial_siren",
  voiceAnnouncement: true,
  voiceLanguage: "en-US",
  escalationMinutes: 5
};
