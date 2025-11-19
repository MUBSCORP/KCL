// types/cell.ts 등
export type CellStatus = 'rest' | 'ongoing' | 'stop' | 'alarm' | 'completion';
export type CellOperation = 'ongoing' | 'stop' | 'completion' | 'available';

export type CellUiItem = {
  id: string;                // eqpid + chamberIndex 등 유니크 키
  title: string;             // "300A-1 / CH1" 같은 타이틀
  status: CellStatus;        // 로직으로 계산된 실제 상태
  operation: CellOperation;  // 진행/정지/완료/유휴
  shutdown: boolean;         // shutdown=true → 깜빡임
  memo: boolean;
  memoText?: string;
  // 필요하면 채널 수, 시간 등 추가
  runCount?: number;
  alarmCount?: number;
  completeCount?: number;
};
