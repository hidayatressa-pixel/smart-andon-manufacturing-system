export type UserRole = "operator" | "leader" | "supervisor" | "manager" | "admin";

export interface UserProfile {
  id: string;
  name: string;
  badgeId: string;
  role: UserRole;
  department: string;
  lineAccess?: string[]; // All lines if empty or includes "*"
  email?: string;
  pin?: string;
}

export type CallCategory = 
  | 'abnormal_machine' 
  | 'leader_call' 
  | 'material_support' 
  | 'machine_breakdown' 
  | 'material_shortage' 
  | 'quality_defect' 
  | 'maintenance_tooling' 
  | 'supervisor_call' 
  | 'safety_alert';

export type CallSeverity = 'minor' | 'major' | 'critical_line_stop';

export type CallStatus = 'calling' | 'acknowledged' | 'in_progress' | 'resolved';

export interface AndonCall {
  id: string;
  ticketNo?: string;
  lineId: string;
  lineName: string;
  workstation: string;
  category: CallCategory;
  severity: CallSeverity;
  status: CallStatus;
  timestamp: number;
  operatorName: string;
  operatorId: string;
  machineId?: string;
  partNumber?: string;
  description?: string;
  isLineStopped: boolean;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  acknowledgedById?: string;
  inProgressAt?: number;
  resolvedAt?: number;
  resolvedBy?: string;
  resolutionNotes?: string;
  rootCause?: string;
  countermeasure?: string;
  escalated?: boolean;
  escalationLevel?: number;
}

export interface AndonLine {
  id: string;
  name: string;
  shortCode: string;
  department: string;
  workstations: string[];
  targetDaily: number;
  leaderName: string;
  status: 'running' | 'warning' | 'critical';
  activeCallsCount: number;
  actualOutput: number;
  efficiency: number;
}

export interface MasterMachine {
  id: string;
  name: string;
  lineId: string;
  workstation?: string;
  type?: string;
  model?: string;
  serialNumber?: string;
  status?: string;
  department?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: number;
  action: 'login' | 'create_call' | 'acknowledge_call' | 'in_progress_call' | 'resolve_call' | 'delete_call' | 'update_master' | 'upload_master' | 'config_change';
  title: string;
  details: string;
  userId: string;
  userName: string;
  userRole: string;
  callId?: string;
  lineId?: string;
  ticketNo?: string;
}

export type ActiveTab = 'main_board' | 'operator_call' | 'responder_terminal' | 'plant_map' | 'analytics_reports' | 'master_data' | 'activity_logs' | 'admin_dashboard';

export interface SoundConfig {
  soundEnabled: boolean;
  voiceAnnouncement: boolean;
  volume: number;
  alarmType: string;
  voiceLanguage: string;
}

export type AppTheme = 'light' | 'dark';
export type AppLanguage = 'id' | 'en';

export interface BrandConfig {
  customAppName?: string;
  customAppSubtitle?: string;
  logoDataUrl?: string;
  logoHeight?: number;
  companyName?: string;
}
