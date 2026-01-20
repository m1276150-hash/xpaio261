import axios from 'axios';
import StellarSdk from 'stellar-sdk';

export default async function handler(req, res) {
  // 1. CORS 및 헤더 설정
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://xpaio-token.netlify.app',
    'https://eclectic-puppy-b4e8ed.netlify.app',
    'https://sandbox.minepi.com',
    'https://pinet.com'
  ];

  if (origin && (allowedOrigins.includes(origin) || origin.includes('minepi.com'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  // 2. 환경 변수 확인 (에러 방지용)
  const { paymentId, txid: clientTxid } = req.body;
  const PI_API_KEY = process.env.PI_API_KEY;
  const WALLET_A_SECRET = process.env.WALLET_A_SECRET;
  
  // 지갑 주소 고정 (오타 방지)
  const WALLET_A_PUBLIC = "GD5SQ6SBXCIPS634QWXOFXAEWT233V4CE4JSXLXPODS5C5RTG2IGKAXW";
  const WALLET_B_PUBLIC = "GBHTFWWGGOEWEKKJ5CKNOLATAGGD6ZXWXIN3RG774VIB2GGBSAE5XQX3";

  if (!PI_API_KEY) {
    return res.status(500).json({ error: "서버 설정 에러: PI_API_KEY가 없습니다." });
  }

  try {
    // [1단계: Approve] 파이 서버 승인 (onReadyForServerApproval 대응)
    if (paymentId && !clientTxid) {
      console.log(`[Approve] 파이 서버 승인 요청: ${paymentId}`);
      
      const response = await axios.post(
        `https://api.minepi.com/v2/payments/${paymentId}/approve`, 
        {}, 
        { headers: { Authorization: `Key ${PI_API_KEY}` }, timeout: 15000 }
      );
      
      console.log(`[Approve] 승인 완료: ${paymentId}`);
      return res.status(200).json({ success: true, message: "Approved" });
    }

    // [2단계: Complete & Token Transfer] 결제 완료 및 토큰 전송
    if (paymentId && clientTxid) {
      console.log(`[Complete] 파이 서버 완료 보고: ${paymentId}`);
      
      // 파이 서버에 완료 보고
      const piRes = await axios.post(
        `https://api.minepi.com/v2/payments/${paymentId}/complete`, 
        { txid: clientTxid }, 
        { headers: { Authorization: `Key ${PI_API_KEY}` }, timeout: 15000 }
      );

      console.log(`[Complete] 파이 결제 최종 완료 확인: ${paymentId}`);

      // [3단계: XPAIO 토큰 전송 로직]
      if (WALLET_A_SECRET) {
        try {
          console.log(`[XPAIO] 스텔라망 토큰 전송 시작...`);
          const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
          const sourceKeypair = StellarSdk.Keypair.fromSecret(WALLET_A_SECRET);
          
          const account = await server.loadAccount(sourceKeypair.publicKey());
          const transaction = new StellarSdk.TransactionBuilder(account, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET,
          })
          .addOperation(StellarSdk.Operation.payment({
            destination: WALLET_B_PUBLIC,
            asset: new StellarSdk.Asset('XPAIO', WALLET_A_PUBLIC),
            amount: '10.0', 
          }))
          .setTimeout(30)
          .build();

          transaction.sign(sourceKeypair);
          await server.submitTransaction(transaction);
          console.log(`[XPAIO] 토큰 전송 성공: A -> B (10 XPAIO)`);
        } catch (tokenErr) {
          console.error("⚠️ 파이 결제는 성공했으나 토큰 전송 중 오류:", tokenErr.message);
          // 파이 결제는 완료되었으므로 성공 응답을 보냅니다.
        }
      }

      return res.status(200).json({ success: true, txid: clientTxid });
    }

    return res.status(400).json({ error: "잘못된 요청입니다." });

  } catch (e) {
    const errorDetail = e.response?.data || e.message;
    console.error("❌ 처리 실패 상세:", errorDetail);
    return res.status(500).json({ success: false, error: errorDetail });
  }
}