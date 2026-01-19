import React from 'react';
import ReactDOM from 'react-dom';
// 1. normalize.css가 설치되어 있지 않다면 에러가 날 수 있으므로 확인이 필요합니다.
// 설치되지 않았다면 터미널에서 'npm install normalize.css'를 실행하세요.
import 'normalize.css'; 
import './defaults.css'; // 파일명이 정확히 defaults.css인지 확인 (D가 대문자인지 등)
import Shop from './Shop'; 

// 파이 SDK 및 전역 타입 정의 보완
declare global {
  interface Window {
    Pi: any;
    // 샌드박스 환경 등을 위한 추가 정의
    PiDocs: any;
  }
}

// React 17 이하 버전에서 사용하는 ReactDOM.render 방식입니다.
// 만약 React 18을 사용 중이라면 createRoot 방식으로 변경이 필요할 수 있습니다.
ReactDOM.render(
  <React.StrictMode>
    <Shop />
  </React.StrictMode>,
  document.getElementById('root')
);