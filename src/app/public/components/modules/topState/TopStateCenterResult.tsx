'use client';

import type { AlarmItem } from './TopStateCenterList';

interface Props {
  item?: AlarmItem | null;   // 전체 아이템 전달
}

export default function TopStateCenterResult({ item }: Props) {
  // 선택 전에는 표시하지 않음 (컨테이너에서 조건부 렌더링해도 안전망으로 한 번 더)
  if (!item) return null;

  // desc를 두 줄로 나눠 기존 <br /> 구조 유지
  const rawDesc = (item.desc ?? '').replace(/\r\n/g, '\n');
  const [line1, line2] = rawDesc
    ? rawDesc.split('\n', 2).concat(['', '']).slice(0, 2)
    : ['충방전기 #4의 채널 12에서 온도 이상이 감지되었습니다.', '즉시 확인이 필요합니다.'];

  const troubleshooting =
    item.troubleshooting && item.troubleshooting.trim()
      ? item.troubleshooting
      : '';

  // ✅ 제목 텍스트에 level 그대로 표시 (마크업/클래스/순서 변경 없음)
  const titleText = item.level || '';

  return (
    <div className="resultArea">
      {/* 디자인 유지: data-state, 제목, dl 순서/클래스 변경 없음 */}
      <div className="innerCont" data-state="fire">
        <h4 className="tit">{titleText}</h4>
        <div className="desc">
          {line1}
          <br />
          {line2}
        </div>
        <div className="info">
          <dl>
            <dt>위치</dt>
            <dd></dd>
          </dl>
          <dl>
            <dt>담당</dt>
            <dd></dd>
          </dl>
          <dl>
            <dt>조치</dt>
            <dd>{troubleshooting}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
