'use client';

export default function TopStateCenterResult() {
  return (
    <div className="resultArea">
      <div className="innerCont" data-state="fire">
        <h4 className="tit">화재위험감지</h4>
        <div className="desc">
          충방전기 #4의 채널 12에서 온도 이상이 감지되었습니다.
          <br />
          즉시 확인이 필요합니다.
        </div>
        <div className="info">
          <dl>
            <dt>위치</dt>
            <dd>B1-테스트룸 3</dd>
          </dl>
          <dl>
            <dt>담당</dt>
            <dd>김엔지니어</dd>
          </dl>
          <dl>
            <dt>조치</dt>
            <dd>전원차단완료</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
