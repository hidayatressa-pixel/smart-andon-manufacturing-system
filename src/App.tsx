import React, { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { OperatorTerminal } from "./components/OperatorTerminal";
import { MainBoard } from "./components/MainBoard";
import { PlantLayoutMap } from "./components/PlantLayoutMap";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { ReportsView } from "./components/ReportsView";
import { AdminDashboard } from "./components/AdminDashboard";
import { ConfigModal } from "./components/ConfigModal";
import { MasterDataManager } from "./components/MasterDataManager";
import { LoginScreen } from "./components/LoginScreen";
import { LoginModal } from "./components/LoginModal";
import { AndonCall, AppTheme, AppLanguage, SoundConfig, UserProfile } from "./types";
import { subscribeToCalls, createCall as createCallInDb, updateCall as updateCallInDb, subscribeToLines, subscribeToMachines, subscribeToOperators, subscribeToSoundConfig, saveSoundConfig, logActivity, saveMasterLine as saveMasterLineInDb, saveMasterMachine as saveMasterMachineInDb, saveMasterOperator as saveMasterOperatorInDb, deleteMasterLine as deleteMasterLineInDb, deleteMasterMachine as deleteMasterMachineInDb, deleteMasterOperator as deleteMasterOperatorInDb } from "./lib/firestoreService";
import { clearSession } from "./lib/authService";
import { canManageMasterData, canResolveAndon, canViewReports } from "./utils/permissions";

const secureRandomIndex = (length: number): number => {
  if (length <= 1) return 0;
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % length;
};

export default function App() {
  const [calls, setCalls] = useState<AndonCall[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [operators, setOperators] = useState<UserProfile[]>([]);
  const [soundConfig, setSoundConfigState] = useState<SoundConfig>({ enabled: true, volume: 0.5, repeatInterval: 5 });
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState("main_board");
  const [selectedLineId, setSelectedLineId] = useState("");
  const [theme, setTheme] = useState<AppTheme>("dark");
  const [language, setLanguage] = useState<AppLanguage>("id");
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => subscribeToCalls(setCalls), []);
  useEffect(() => subscribeToLines(setLines), []);
  useEffect(() => subscribeToMachines(setMachines), []);
  useEffect(() => subscribeToOperators(setOperators), []);
  useEffect(() => subscribeToSoundConfig(setSoundConfigState), []);

  const isAdmin = currentUser?.role === "admin";
  const canManageMaster = canManageMasterData(currentUser);
  const canResolve = canResolveAndon(currentUser);
  const canReports = canViewReports(currentUser);

  const handleCreateCall = async (call: Omit<AndonCall, "id" | "timestamp" | "status">) => {
    await createCallInDb(call);
  };

  const handleUpdateCall = async (id: string, updates: Partial<AndonCall>) => {
    if (!canResolve) throw new Error("PERMISSION_DENIED: responder privileges required");
    await updateCallInDb(id, updates, currentUser ? { name: currentUser.name, id: currentUser.badgeId, role: currentUser.role } : undefined);
  };

  const setSoundConfig = async (config: SoundConfig) => {
    setSoundConfigState(config);
    await saveSoundConfig(config, currentUser ? { name: currentUser.name, id: currentUser.badgeId, role: currentUser.role } : undefined);
  };

  const handleSaveLine = async (line: any) => {
    if (!canManageMaster) throw new Error("PERMISSION_DENIED: administrator privileges required");
    await saveMasterLineInDb(line, currentUser ? { name: currentUser.name, id: currentUser.badgeId, role: currentUser.role } : undefined);
  };
  const handleSaveMachine = async (machine: any) => {
    if (!canManageMaster) throw new Error("PERMISSION_DENIED: administrator privileges required");
    await saveMasterMachineInDb(machine, currentUser ? { name: currentUser.name, id: currentUser.badgeId, role: currentUser.role } : undefined);
  };
  const handleSaveOperator = async (operator: UserProfile) => {
    if (!canManageMaster) throw new Error("PERMISSION_DENIED: administrator privileges required");
    await saveMasterOperatorInDb(operator, currentUser ? { name: currentUser.name, id: currentUser.badgeId, role: currentUser.role } : undefined);
  };
  const handleDeleteLine = async (id: string) => { if (!canManageMaster) throw new Error("PERMISSION_DENIED"); await deleteMasterLineInDb(id, currentUser ? { name: currentUser.name, id: currentUser.badgeId, role: currentUser.role } : undefined); };
  const handleDeleteMachine = async (id: string) => { if (!canManageMaster) throw new Error("PERMISSION_DENIED"); await deleteMasterMachineInDb(id, currentUser ? { name: currentUser.name, id: currentUser.badgeId, role: currentUser.role } : undefined); };
  const handleDeleteOperator = async (id: string) => { if (!canManageMaster) throw new Error("PERMISSION_DENIED"); await deleteMasterOperatorInDb(id, currentUser ? { name: currentUser.name, id: currentUser.badgeId, role: currentUser.role } : undefined); };

  const handleUpdateLineTarget = async (lineId: string, targetDaily: number) => {
    if (!canManageMasterData(currentUser)) throw new Error("PERMISSION_DENIED: administrator privileges required");
    const targetLine = lines.find((l) => l.id === lineId);
    if (targetLine) await saveMasterLineInDb({ ...targetLine, targetDaily }, { name: currentUser!.name, id: currentUser!.badgeId, role: currentUser!.role });
  };

  const handleLogout = () => {
    if (currentUser) void logActivity("login", `User Logout: ${currentUser.name}`, "User session logged out.", { name: currentUser.name, id: currentUser.badgeId, role: currentUser.role });
    clearSession(); setCurrentUser(null);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    const storedLineId = localStorage.getItem("andon_active_login_line_id");
    if (storedLineId) setSelectedLineId(storedLineId);
    setActiveTab(user.role === "operator" ? "operator_call" : "main_board");
  };

  const handleSimulateEmergency = () => {
    const randomLine = lines[secureRandomIndex(lines.length)] || lines[0];
    if (!randomLine) return;
    const randomStation = randomLine.workstations[secureRandomIndex(randomLine.workstations.length)] || "OP-20 Station";
    void handleCreateCall({ lineId: randomLine.id, lineName: randomLine.name, workstation: randomStation, category: "machine_breakdown", severity: "critical_line_stop", isLineStopped: true, operatorName: currentUser ? currentUser.name : "Alex Operator (Demo)", operatorId: currentUser ? currentUser.badgeId : "OP-9901", machineId: "ROBOT-SIM-01", partNumber: "DEMO-PART-2026", description: "Optical sensor detects clamping position deviation. Conveyor auto line stop." });
  };

  const isLight = theme === "light";
  if (!currentUser) return <LoginScreen onLoginSuccess={handleLoginSuccess} theme={theme} language={language} setLanguage={setLanguage} lines={lines} />;

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-200 ${isLight ? "bg-slate-100 text-slate-900" : "bg-neutral-950 text-neutral-100"}`}>
      {!isAdmin && <style>{`#btn-settings{display:none!important}`}</style>}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} activeCalls={calls} soundConfig={soundConfig} setSoundConfig={setSoundConfig} currentUser={currentUser} onOpenLogin={() => setIsLoginModalOpen(true)} onLogout={handleLogout} onOpenConfig={() => { if (isAdmin) setIsConfigOpen(true); }} onSimulateEmergency={handleSimulateEmergency} theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === "operator_call" && <OperatorTerminal lines={lines} machines={machines} calls={calls} currentUser={currentUser} selectedLineId={selectedLineId} onSelectedLineChange={setSelectedLineId} onCreateCall={handleCreateCall} theme={theme} language={language} />}
        {activeTab === "main_board" && <MainBoard calls={calls} lines={lines} onUpdateCall={handleUpdateCall} currentUser={currentUser} theme={theme} language={language} />}
        {activeTab === "plant_layout" && <PlantLayoutMap calls={calls} lines={lines} theme={theme} language={language} />}
        {activeTab === "analytics" && <AnalyticsDashboard calls={calls} lines={lines} theme={theme} language={language} />}
        {activeTab === "reports" && canReports && <ReportsView calls={calls} lines={lines} theme={theme} language={language} />}
        {activeTab === "admin_dashboard" && isAdmin && <AdminDashboard calls={calls} lines={lines} machines={machines} operators={operators} theme={theme} language={language} />}
        {activeTab === "master_data" && canManageMaster && <MasterDataManager lines={lines} machines={machines} operators={operators} currentUser={currentUser} onSaveLine={handleSaveLine} onSaveMachine={handleSaveMachine} onSaveOperator={handleSaveOperator} onDeleteLine={handleDeleteLine} onDeleteMachine={handleDeleteMachine} onDeleteOperator={handleDeleteOperator} onUpdateLineTarget={handleUpdateLineTarget} theme={theme} language={language} />}
      </main>

      {isAdmin && <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} soundConfig={soundConfig} setSoundConfig={setSoundConfig} theme={theme} language={language} />}
      {isLoginModalOpen && <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} currentUser={currentUser} theme={theme} language={language} />}
    </div>
  );
}
