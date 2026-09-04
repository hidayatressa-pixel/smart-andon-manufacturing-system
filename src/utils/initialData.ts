import { AndonLine, AndonCall, SoundConfig, MasterMachine, UserProfile } from "../types";

export const INITIAL_CALLS: AndonCall[] = [];

// Master Line is database-managed. Admin can log in without a Line and provision it first.
// Demo/local storage also starts empty after a clean installation.
export const INITIAL_LINES: AndonLine[] = [];

// Master Machine is database-managed and never bundled into source.
export const INITIAL_MACHINES: MasterMachine[] = [];

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
