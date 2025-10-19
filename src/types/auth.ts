export type LoginReq = { username: string; password: string };
export type LoginRes = {
    accessToken: string;
    name: string;
    department: string;
    // 백엔드에서 주지 않지만 토큰의 sub(=username)를 디코드해서 채울 예정
};
