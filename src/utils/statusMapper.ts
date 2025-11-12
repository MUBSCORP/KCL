export type UiStatus = 'rest' | 'run' | 'pause' | 'alarm';

export interface UiStatusInfo {
  status: UiStatus;        // CSS data-status
  statusLabel: string;     // 화면에 보이는 한글
}

// 각 코드가 어떤 그룹인지 묶어두기
const REST_CODES = new Set<number>([
  0,   // Ready
  8,   // User termination
]);

const RUN_CODES = new Set<number>([
  1,   // Charge
  2,   // Discharge
  3,   // Standing
  4,   // Working simulation
  5,   // End OK
  6,   // End NG
  17,  // Pulse
  18,  // DCIR
  27,  // Starting
  35,  // Insulate
  39,  // Channel linkage
  40,  // Starting insulation voltage
  41,  // Ending insulation voltage
  42,  // Power sharing
]);

const PAUSE_CODES = new Set<number>([
  12, // Pause
  13, // Appoint time pause
  14, // Appoint step pause
  15, // Appoint loop pause
  19, // Appoint step loop pause
  38, // Special pause
]);

const ALARM_CODES = new Set<number>([
  7,   // Device alarm
  9,   // Comm error
  10,  // No connected battery
  11,  // Disable
  16,  // Extern comm error
]);

export function mapOperationStatus(code: number | null | undefined): UiStatusInfo {
  const c = typeof code === 'number' ? code : -1;

  if (REST_CODES.has(c)) {
    return { status: 'rest', statusLabel: '대기' };
  }
  if (RUN_CODES.has(c)) {
    return { status: 'run', statusLabel: '진행중' };
  }
  if (PAUSE_CODES.has(c)) {
    return { status: 'pause', statusLabel: '일시정지' };
  }
  if (ALARM_CODES.has(c)) {
    return { status: 'alarm', statusLabel: '알람' };
  }

  // 혹시 정의 안 된 코드 들어오면 일단 알람으로
  return { status: 'alarm', statusLabel: '알람' };
}
