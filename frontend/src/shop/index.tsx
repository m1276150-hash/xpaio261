import React, { useState, useEffect } from 'react';
import axios from 'axios';

const XpaioApp: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("준비 중...");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (window.Pi) {
      // 1. SDK 초기화 및 권한 요청 (핵심!)
      window.Pi.init({ version: "2.0", sandbox: true });
      
      const scopes = ['payments', 'username'];
      
      const onIncompletePaymentFound = (payment: any) => {
        console.log("미완료 결제 발견:", payment.identifier);
      };

      window.Pi.authenticate(scopes, onIncompletePaymentFound)
        .then((auth: any) => {
          if (auth.scopes.includes('payments')) {
            setUsername(auth.user.username);
            setStatus("결제 준비 완료!");
          } else {
            setStatus("결제 권한이 필요합니다. 다시 접속해 주세요.");
          }
        })
        .catch((err: any) => {
          console.error("인증 실패:", err);
          setStatus("파이 브라우저 인증에 실패했습니다.");
        });
    }
  }, []);

  const createPayment = async () => {
    if (isProcessing) return; // 중복 클릭 방지 (499 에러 예방)
    
    setIsProcessing(true);
    setStatus("결제창을 띄우는 중...");

    try {
      window.Pi.createPayment({
        amount: 1.0,
        memo: "XPAIO 10단계 테스트 결제",
        metadata: { productId: "xpaio_test_001" }
      }, {
        onReadyForServerApproval: async (paymentId: string) => {
          setStatus("서버 승인 대기 중...");
          await axios.post('/.netlify/functions/payment', { paymentId });
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          setStatus("결제 완료 보고 중...");
          await axios.post('/.netlify/functions/payment', { paymentId, txid });
        },
        onCancel: (paymentId: string) => {
          setIsProcessing(false);
          setStatus("결제가 취소되었습니다.");
        },
        onError: (error: Error, payment?: any) => {
          setIsProcessing(false);
          setStatus("결제 중 오류가 발생했습니다.");
          console.error("결제 에러:", error);
        }
      });
    } catch (err) {
      setIsProcessing(false);
      setStatus("결제 생성 실패");
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh' }}>
      <h1>XPAIO Dashboard</h1>
      <p style={{ fontSize: '20px', color: '#8A2BE2' }}>{status}</p>
      
      <div style={{ marginTop: '40px', padding: '20px', border: '1px solid #333', borderRadius: '15px' }}>
        <h3>10단계 테스트 결제 (1 Pi)</h3>
        <button 
          onClick={createPayment}
          disabled={!username || isProcessing}
          style={{
            padding: '15px 40px',
            backgroundColor: (!username || isProcessing) ? '#555' : '#8A2BE2',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: (!username || isProcessing) ? 'not-allowed' : 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            transition: '0.3s'
          }}
        >
          {isProcessing ? "처리 중 (기다려 주세요)" : "1 Pi 결제하기"}
        </button>
        {username && <p style={{ marginTop: '10px' }}>반갑습니다, {username}님!</p>}
      </div>
    </div>
  );
};

export default XpaioApp;