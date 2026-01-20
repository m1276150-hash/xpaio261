import React, { useState, useEffect } from 'react';
import axios from 'axios';

const XpaioApp: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (window.Pi) {
      window.Pi.init({ version: "2.0", sandbox: true });
      
      // 가이드 1번: 인증 및 미완료 결제 처리
      const onIncompletePaymentFound = async (payment: any) => {
        console.log("미완료 결제 처리 중...", payment.identifier);
        await axios.post('/.netlify/functions/payment', { 
          paymentId: payment.identifier, 
          txid: payment.transaction?.txid,
          status: 'incomplete' 
        });
      };

      window.Pi.authenticate(["username", "payments"], onIncompletePaymentFound)
        .then((auth: any) => setUsername(auth.user.username))
        .catch((err: any) => console.error(err));
    }
  }, []);

  const handlePayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    // 가이드 결제 섹션: Pi.createPayment() 호출
    window.Pi.createPayment({
      amount: 1.0,
      memo: "XPAIO 10단계 테스트",
      metadata: { productId: "test_001" }
    }, {
      // 가이드 1번 콜백: 서버 승인 요청
      onReadyForServerApproval: async (paymentId: string) => {
        await axios.post('/.netlify/functions/payment', { paymentId, action: 'approve' });
      },
      // 가이드 2번 콜백: 서버 완료 보고
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        await axios.post('/.netlify/functions/payment', { paymentId, txid, action: 'complete' });
      },
      onCancel: () => setIsProcessing(false),
      onError: () => setIsProcessing(false)
    });
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px', background: '#1a1a1a', color: 'white' }}>
      <h2>{username ? `${username}님 환영합니다!` : "로그인 중..."}</h2>
      <button 
        onClick={handlePayment} 
        disabled={!username || isProcessing}
        style={{ padding: '15px 30px', backgroundColor: '#8A2BE2', color: 'white', borderRadius: '10px' }}
      >
        {isProcessing ? "처리 중..." : "1 Pi 결제하기 (10단계 테스트)"}
      </button>
    </div>
  );
};

export default XpaioApp;