import axios from 'axios';
import StellarSdk from 'stellar-sdk';

export default async function handler(req, res) {
  // 1. CORS 설정 (이미지 1-3의 Netlify 주소 및 파이 시스템 허용)
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

  // 2. 변수 설정 (새로운 지갑 주소 적용)
  const { paymentId } = req.body;
  const PI_API_KEY = process.env.PI_API_KEY || "3zjf0ud9jc76303smkqmq1au5hw0coy9tfd6esw12irh471bmwrjtqd8oaig5rkk3gm";
  
  // 은하수님이 새로 주신 지갑 정보
  const WALLET_A_SECRET = process.env.WALLET_A_SECRET; // A지갑의 비밀키(S...)는 환경변수에 꼭 넣으세요!
  const WALLET_A_PUBLIC = "GD5SQ6SBXCIPS634QWXOFXAEWT233V4CE4JSXLXPODS5C5RTG2IGKAXW"; // 발행자
  const WALLET_B_PUBLIC = "GBHTFWWGGOEWEKKJ5CKNOLATAGGD6ZXWXIN3RG774VIB2GGBSAE5XQX3"; // 유통자

  try {
    // [1단계] 파이 서버 결제 승인(Approve) 요청
    await axios.post(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {}, {
      headers: { Authorization: `Key ${PI_API_KEY}` }
    });

    // [2단계] 파이 서버 결제 완료(Complete) 요청
    const piRes = await axios.post(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {}, {
      headers: { Authorization: `Key ${PI_API_KEY}` }
    });

    const txid = piRes.data.transaction?.txid;

    // [3단계] 스텔라(파이) 네트워크를 통한 XPAIO 토큰 전송 (A -> B)
    if (WALLET_A_SECRET) {
      const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
      const sourceKeypair = StellarSdk.Keypair.fromSecret(WALLET_A_SECRET);
      
      const account = await server.loadAccount(sourceKeypair.publicKey());
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
      .addOperation(StellarSdk.Operation.payment({
        destination: WALLET_B_PUBLIC,
        asset: new StellarSdk.Asset('XPAIO', WALLET_A_PUBLIC), // A지갑이 토큰 발행자
        amount: '10.0', 
      }))
      .setTimeout(30)
      .build();

      transaction.sign(sourceKeypair);
      await server.submitTransaction(transaction);
      console.log(`[XPAIO] 토큰 전송 성공: A -> B`);
    }

    return res.status(200).json({ success: true, txid: txid });

  } catch (e) {
    const errorDetail = e.response?.data || e.message;
    console.error("❌ 결제 처리 실패:", errorDetail);
    return res.status(500).json({ success: false, error: errorDetail });
  }
}