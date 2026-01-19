import React from 'react';
import ReactDOM from 'react-dom';
// normalize.css가 설치되어 있어야 합니다 (npm install normalize.css)
import 'normalize.css'; 
import './defaults.css'; 

// 1. 밑줄 해결: 파일 확장자(.tsx)를 명시하지 않아도 되지만, 
// 실제 폴더에 'Shop.tsx' 또는 'Shop/index.tsx'가 있는지 반드시 확인하세요.
import Shop from './Shop'; 

// 2. 밑줄 해결: 전역 타입 정의를 최상단이나 별도 d.ts 파일로 빼는 것이 좋지만, 
// 일단 여기서 경고가 난다면 'any'를 사용하여 타입을 유연하게 열어줍니다.
declare global {
  interface Window {
    Pi: any;
    PiDocs: any;
  }
}

// 3. 밑줄 해결: React 17 방식을 유지하되, 
// 만약 'Shop'이 default export가 아닐 경우 에러가 날 수 있으니 확인이 필요합니다.
ReactDOM.render(
  <React.StrictMode>
    <Shop />
  </React.StrictMode>,
  document.getElementById('root')
);