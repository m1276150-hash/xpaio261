import React from 'react';
import ReactDOM from 'react-dom/client'; // '/client'를 반드시 추가해야 합니다.
import 'normalize.css'; 
import './defaults.css'; 
import XpaioApp from './shop'; 

declare global {
  interface Window {
    Pi: any;
    PiDocs: any;
  }
}

// 1. root 요소를 찾고 TypeScript 타입을 지정합니다.
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// 2. React 18 방식의 createRoot를 사용하여 render의 밑줄을 해결합니다.
const root = ReactDOM.createRoot(rootElement as HTMLElement);

root.render(
  <React.StrictMode>
    <XpaioApp />
  </React.StrictMode>
);