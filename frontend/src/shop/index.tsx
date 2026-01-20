import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

declare global {
  interface window {
    Pi: any;
  }
}

const XpaioApp: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("파이 네트워크 연결 중...");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const createPayment = useCallback(() => {
    if (!window.Pi) {
      alert("파이 브라우저에서 접속해 주세요.");
      return;
    }

    setIsProcessing(true);
    setStatus("결제 생성 중...");

    const paymentData = {
      amount: 1, // 10단계 테스트를 위한 1 Pi 설정
      memo: "XPAIO 10단계 테스트 결제",
      metadata: { project: "XPAIO" }
    };

    const paymentCallbacks = {
      onReadyForServerApproval: async (paymentId: string) => {
        setStatus("서버 승인 대기 중...");
        try {
          // Netlify 함수 경로를 명확히 지정합니다.
          await axios.post('/.netlify/functions/payment', { paymentId }); 
          console.log("서버 승인 완료:", paymentId);
        } catch (err: any) {
          console.error("승인 에러:", err.response?.data || err.message);
          setStatus("승인 실패: 서버 설정을 확인하세요.");
          setIsProcessing(false);
        }
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        setStatus("결제 최종 완료 중...");
        try {
          await axios.post('/.netlify/functions/payment', { paymentId, txid });
          setStatus("결제 성공!");
          alert("결제가 완료되었습니다! 이제 개발자 포털 10단계를 확인하세요.");
          setIsProcessing(false);
        } catch (err: any) {
          console.error("완료 에러:", err.response?.data || err.message);
          setStatus("완료 처리 중 오류 발생");
          setIsProcessing(false);
        }
      },
      onCancel: (paymentId: string) => {
        console.log("결제 취소:", paymentId);
        setStatus("결제가 취소되었습니다.");
        setIsProcessing(false);
      },
      onError: (error: Error) => {
        console.error("결제 에러:", error);
        setStatus("결제 중 오류가 발생했습니다.");
        setIsProcessing(false);
      },
    };

    window.Pi.createPayment(paymentData, paymentCallbacks);
  }, []);

  useEffect(() => {
    if (window.Pi) {
      // 샌드박스 모드 필수 활성화
      window.Pi.init({ version: "2.0", sandbox: true });

      const scopes = ['payments', 'username'];

      window.Pi.authenticate(scopes, (payment: any) => {
        console.log("미완료 결제 발견:", payment.identifier);
      })
      .then((auth: any) => {
        setUsername(auth.user.username);
        setStatus("결제 준비 완료");
      })
      .catch((error: any) => {
        setStatus("인증 실패");
        console.error("SDK 인증 오류:", error);
      });
    }
  }, []);

  return (
    <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh' }}>
      <h1>XPAIO Dashboard</h1>
      <p style={{ fontSize: '20px', color: '#8A2BE2' }}>
        {username ? `환영합니다, ${username}님!` : status}
      </p>
      
      <div style={{ marginTop: '40px', padding: '20px', border: '1px solid #333', borderRadius: '15px' }}>
        <h3>10단계 테스트 결제 (1 Pi)</h3>
        <button 
          onClick={createPayment}
          disabled={isProcessing}
          style={{
            padding: '15px 40px',
            backgroundColor: isProcessing ? '#555' : '#8A2BE2',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            transition: '0.3s'
          }}
        >
          {isProcessing ? "처리 중..." : "1 Pi 결제하기"}
        </button>
        <p style={{ marginTop: '15px', fontSize: '14px', color: '#aaa' }}>
          * 테스트 파이가 소모됩니다. (지갑 잔액 확인 필수)
        </p>
      </div>
    </div>
  );
};

export default XpaioApp;