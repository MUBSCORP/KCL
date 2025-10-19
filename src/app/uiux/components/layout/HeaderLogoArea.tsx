'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@mui/material';
import logo from '@/assets/images/common/logo_w.png';

export default function HeaderLogoArea() {
  const [date, setDate] = useState('');
  const [week, setWeek] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      // 날짜
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');

      // 요일 (0=일, 1=월, ...)
      const weekNames = ['일', '월', '화', '수', '목', '금', '토'];
      const weekDay = weekNames[now.getDay()];

      // 시간
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      setDate(`${year}. ${month}. ${day}`);
      setWeek(weekDay);
      setTime(`${hours} : ${minutes} : ${seconds}`);
    };

    updateClock(); // 초기 1회 실행
    const timer = setInterval(updateClock, 1000); // 1초마다 갱신

    return () => clearInterval(timer); // 언마운트 시 정리
  }, []);

  return (
    <div className="logoArea">
      <h1 className="logo">
        <Button className="customBtn">
          <Image src={logo} alt="KCL Cell/Pack 통합 모니터링 Korea Conformity Laboratories" />
        </Button>
      </h1>

      <div className="watch">
        <div className="date">{date}</div>
        <div className="week">{week}</div>
        <div className="time">{time}</div>
      </div>
    </div>
  );
}
