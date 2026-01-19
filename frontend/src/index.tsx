import React from 'react';
import ReactDOM from 'react-dom';
import 'normalize.css';
import './defaults.css';
import Shop from './Shop'; // Shop 폴더의 index.tsx를 자동으로 불러옵니다.

// 파이 SDK 타입 정의 (TypeScript 환경에서 전역 window.Pi를 인식하게 합니다.)
declare global {
  interface Window {
    Pi: any;
  }
}

ReactDOM.render(
  <React.StrictMode>
    {/* Shop 컴포넌트가 실제 파이 SDK 초기화와 결제 로직을 담당합니다. */}
    <Shop />
  </React.StrictMode>,
  document.getElementById('root')
);