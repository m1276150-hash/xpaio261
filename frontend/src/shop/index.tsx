import React, { useEffect, useState } from 'react';

// 파이 SDK의 타입을 정의합니다 (TypeScript 오류 방지)
declare global {
  interface Window {
    Pi: any;
  }
}

const XpaioApp: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("파이 네트워크 연결 중...");

  useEffect(() => {
    // 1. SDK 초기화
    // 6번 단계 통과를 위해 sandbox: true를 명시적으로 설정합니다.
    if (window.Pi) {
      window.Pi.init({ version: "2.0", sandbox: true });

      const scopes = ['payments', 'username'];

      // 2. 미완료 결제 확인 (보안 필수 로직)
      const onIncompletePaymentFound = (payment: any) => {
        console.log("미완료 결제 발견:", payment.identifier);
        // 여기서 백엔드 서버로 결제 완료 요청을 보냅니다.
      };

      // 3. 사용자 인증 및 로그인
      window.Pi.authenticate(scopes, onIncompletePaymentFound)
        .then((auth: any) => {
          setUsername(auth.user.username);
          setStatus("인증 성공!");
          console.log("로그인 유저:", auth.user.username);
        })
        .catch((error: any) => {
          setStatus("인증 실패");
          console.error("SDK 인증 오류:", error);
        });
    }
  }, []);

  // 4. 결제 생성 함수 (XPAIO 게임용)
  const createPayment = (amount: number, memo: string) => {
    const paymentData = {
      amount: amount,
      memo: memo,
      metadata: { project: "XPAIO" }
    };

    const paymentCallbacks = {
      onReadyForServerApproval: (paymentId: string) => {
        console.log("서버 승인 대기:", paymentId);
        // axios.post('/approve', { paymentId }) 로직 추가 위치
      },
      onReadyForServerCompletion: (paymentId: string, txid: string) => {
        console.log("결제 완료 처리 중:", txid);
        // axios.post('/complete', { paymentId, txid }) 로직 추가 위치
      },
      onCancel: (paymentId: string) => console.log("취소됨:", paymentId),
      onError: (error: Error) => console.error("결제 에러:", error),
    };

    window.Pi.createPayment(paymentData, paymentCallbacks);
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#61dafb' }}>XPAIO Dashboard</h1>
      <p style={{ fontSize: '20px' }}>
        {username ? `안녕하세요, ${username}님!` : status}
      </p>
      
      <hr style={{ margin: '30px 0' }} />

      <div style={{ marginTop: '20px' }}>
        <h3>테스트 결제</h3>
        <button 
          onClick={() => createPayment(1, "XPAIO 테스트 결제")}
          style={{
            padding: '10px 20px',
            backgroundColor: '#8A2BE2',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          1 Pi 결제하기
        </button>
      </div>
    </div>
  );
};

export default XpaioApp;