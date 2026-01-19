import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

// 1. 전역 window 객체 타입 정의 (밑줄 경고 방지)
declare global {
  interface Window {
    Pi: any;
  }
}

const XpaioApp: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("파이 네트워크 연결 중...");

  // 2. 결제 생성 함수를 useCallback으로 감싸서 무한 루프 및 경고 방지
  const createPayment = useCallback(() => {
    if (!window.Pi) {
      alert("파이 브라우저에서 접속해 주세요.");
      return;
    }

    const paymentData = {
      amount: 1, 
      memo: "XPAIO 10단계 테스트 결제",
      metadata: { project: "XPAIO" }
    };

    const paymentCallbacks = {
      onReadyForServerApproval: async (paymentId: string) => {
        try {
          await axios.post('/api/payment', { paymentId });
          console.log("서버 승인 완료");
        } catch (err) {
          console.error("승인 에러:", err);
        }
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        try {
          await axios.post('/api/payment', { paymentId, txid });
          alert("결제가 완료되었습니다! 10단계를 확인하세요.");
        } catch (err) {
          console.error("완료 에러:", err);
        }
      },
      onCancel: (paymentId: string) => console.log("결제 취소:", paymentId),
      onError: (error: Error) => console.error("결제 에러:", error),
    };

    window.Pi.createPayment(paymentData, paymentCallbacks);
  }, []);

  useEffect(() => {
    if (window.Pi) {
      // SDK 초기화 (6번 단계 통과용)
      window.Pi.init({ version: "2.0", sandbox: true });

      const scopes = ['payments', 'username'];

      const onIncompletePaymentFound = (payment: any) => {
        console.log("미완료 결제 발견:", payment.identifier);
      };

      window.Pi.authenticate(scopes, onIncompletePaymentFound)
        .then((auth: any) => {
          setUsername(auth.user.username);
          setStatus("인증 성공!");
        })
        .catch((error: any) => {
          setStatus("인증 실패");
          console.error("SDK 인증 오류:", error);
        });
    }
  }, []); // 의존성 배열을 비워두어 한 번만 실행되게 설정

  return (
    <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh' }}>
      <h1>XPAIO Dashboard</h1>
      <p>{username ? `안녕하세요, ${username}님!` : status}</p>
      
      <hr style={{ border: '0.5px solid #333', margin: '30px 0' }} />

      <div style={{ marginTop: '20px' }}>
        <h3>10단계 테스트 결제</h3>
        {/* 직접 함수를 연결하여 경고 해결 */}
        <button 
          onClick={createPayment}
          style={{
            padding: '15px 30px',
            backgroundColor: '#8A2BE2',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          1 Pi 결제하기
        </button>
      </div>
    </div>
  );
};

export default XpaioApp;