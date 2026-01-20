import axios from 'axios';
import StellarSdk from 'stellar-sdk';

export default async function handler(req, res) {
  // 1. CORS 설정 (데모 앱 및 파이 환경 허용)
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

  // 2. 변수 및 환경 설정
  const { paymentId, txid: clientTxid } = req.body; // 프론트엔드에서 보낸 txid 수신
  const PI_API_KEY = process.env.PI_API_KEY;
  const WALLET_A_SECRET = process.env.WALLET_A_SECRET;
  const WALLET_A_PUBLIC = "GD5SQ6SBXCIPS634QWXOFXAEWT233V4CE4JSXLXPODS5C5RTG2IGKAXW";
  const WALLET_B_PUBLIC = "GBHTFWWGGOEWEKKJ5CKNOLATAGGD6ZXWXIN3RG774VIB2GGBSAE5XQX3";

  try {
    // [1단계: Approve] 파이 서버에 결제 승인 보고 (데모 payments.ts 방식)
    if (paymentId && !clientTxid) {
      console.log(`[Approve] 결제 승인 시작: ${paymentId}`);
      await axios.post(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {}, {
        headers: { Authorization: `Key ${PI_API_KEY}` }
      });
      return res.status(200).json({ message: "Approved" });
    }

    // [2단계: Complete] 파이 서버에 결제 완료 보고 및 txid 검증
    if (paymentId && clientTxid) {
      console.log(`[Complete] 결제 완료 보고 시작: ${paymentId}`);
      const piRes = await axios.post(`https://api.minepi.com/v2/payments/${paymentId}/complete`, 
        { txid: clientTxid }, // 블록체인 거래 번호 포함
        { headers: { Authorization: `Key ${PI_API_KEY}` } }
      );

      const finalTxid = piRes.data.transaction?.txid || clientTxid;

      // [3단계: XPAIO 토큰 전송] 결제 완료가 확인된 후 토큰 전송 진행
      if (WALLET_A_SECRET) {
        console.log(`[XPAIO] 토큰 전송 프로세스 시작...`);
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
      }

      return res.status(200).json({ success: true, txid: finalTxid });
    }

  } catch (e) {
    const errorDetail = e.response?.data || e.message;
    console.error("❌ 결제/토큰 처리 실패:", errorDetail);
    return res.status(500).json({ success: false, error: errorDetail });
  }
}