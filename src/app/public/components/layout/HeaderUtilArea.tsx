'use client';

import { useEffect, useState, useRef } from 'react';
import { Button, TextField } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import icon from '@/assets/images/icon/arrow_right3.png';
import { login } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

export default function HeaderUtilArea() {
  const [date, setDate] = useState('');
  const [week, setWeek] = useState('');
  const [time, setTime] = useState('');

  // 🔐 로그인 폼 상태
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // input ref (빈 값일 때 focus 주기)
  const idInputRef = useRef<HTMLInputElement | null>(null);
  const pwInputRef = useRef<HTMLInputElement | null>(null);

  // 🔐 전역 인증 상태
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clear = useAuthStore((s) => s.clear);

  const router = useRouter();

  // 시계
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');

      const weekNames = ['일', '월', '화', '수', '목', '금', '토'];
      const weekDay = weekNames[now.getDay()];

      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      setDate(`${year}. ${month}. ${day}`);
      setWeek(weekDay);
      setTime(`${hours} : ${minutes} : ${seconds}`);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // 🔐 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const idTrim = username.trim();
    const pwTrim = password.trim();

    // 기본 입력 체크
    if (!idTrim) {
      alert('아이디를 입력해주세요.');
      idInputRef.current?.focus();
      return;
    }
    if (!pwTrim) {
      alert('비밀번호를 입력해주세요.');
      pwInputRef.current?.focus();
      return;
    }

    setErr(null);
    setLoading(true);

    try {
      const res = await login({ username: idTrim, password: pwTrim });

      // 실패 케이스
      if (!res.ok) {
        alert(res.message);
        setErr(res.message);
        return;
      }

      // 성공 케이스
      const data = res.data; // LoginRes

      const userInfo = {
        username: data.username,      // 로그인 ID
        memId: data.memId,           // 서버 memId (같으면 username과 동일)
        dept: data.dept,
        displayName: data.displayName,
      };

      setAuth(data.accessToken, userInfo);
      setUsername('');
      setPassword('');
      // 필요하면 대시보드로 이동
      // router.replace('/dashboard');
    } catch (e) {
      console.error(e);
      const msg = '로그인 중 오류가 발생했습니다.';
      alert(msg);
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  // 🔐 로그아웃 처리
  const handleLogout = () => {
    clear();
    // 필요 시 라우팅
    // router.replace('/login');
  };

  const isLoggedIn = !!token && !!user;
  const displayName = user?.displayName || user?.username || '사용자';
  const dept = user?.dept || '';

  return (
    <div className="utilArea">
      <div className="left">
        <div className="watch">
          <div className="date">{date}</div>
          <div className="week">{week}</div>
          <div className="time">{time}</div>
        </div>
      </div>

      <div className="right">
        {isLoggedIn ? (
          <>
            <span className="tag">온라인</span>
            <p className="user">
              <strong>{displayName}</strong>
              {/*{dept && <span className="dept"> {dept}</span>}*/}
            </p>
            {dept && <p className="position">{dept}</p>}
            <div className="btn">
              <Button className="customBtn" onClick={handleLogout}>
                <span>로그아웃</span>
                <Image src={icon} alt="" />
              </Button>
            </div>
          </>
        ) : (
          <form
            onSubmit={handleLogin}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem', // 🔹 폼 전체 간격 넓게
            }}
          >
            <div
              className="loginFields"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem', // 🔹 아이디/비번 사이 간격
              }}
            >
              <TextField
                inputRef={idInputRef}
                size="small"
                variant="outlined"
                placeholder="아이디"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{ minWidth: 160 }}
              />
              <TextField
                inputRef={pwInputRef}
                size="small"
                variant="outlined"
                placeholder="비밀번호"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ minWidth: 160 }}
              />
            </div>

            <div className="btn">
              <Button
                type="submit"
                className="customBtn"
                variant="contained"
                disabled={loading}
              >
                <span>{loading ? '로그인 중…' : '로그인'}</span>
                <Image src={icon} alt="" />
              </Button>
            </div>

            {/* 아래 텍스트 에러는 남겨두고 싶으면 유지, 아니면 삭제 가능 */}
            {err && (
              <p
                className="loginError"
                style={{ color: '#ff4d4f', fontSize: '0.75rem' }}
              >
                {err}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
