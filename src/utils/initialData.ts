import { AndonLine, AndonCall, SoundConfig, MasterMachine, UserProfile } from "../types";

// Operational data starts clean. Production master data must come from Firestore.
export const INITIAL_CALLS: AndonCall[] = [];

// IMPORTANT:
// Master Line is no longer seeded from source code.
// - Production: Firestore is the single source of truth.
// - Demo: localStorage starts empty and is managed by the demo admin/user flow.
// This guarantees Factory Clean cannot repopulate deleted production lines from bundled source data.
export const INITIAL_LINES: AndonLine[] = [];

// Master Machine follows the same rule as Master Line.
// No machine master is bundled into the application source.
export const INITIAL_MACHINES: MasterMachine[] = [];

// Legacy export retained only for compatibility with modules that still import INITIAL_OPERATORS.
// Authentication/demo defaults are defined in utils/auth.ts (DEFAULT_USERS), not here.
export const INITIAL_OPERATORS: UserProfile[] = [];

export const DEFAULT_SOUND_CONFIG: SoundConfig = {
  soundEnabled: true,
  volume: 0.8,
  alarmType: "industrial_siren",
  voiceAnnouncement: true,
  voiceLanguage: "en-US",
  escalationMinutes: 5
};
