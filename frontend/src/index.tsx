import React from 'react';
import * as ReactDOM from 'react-dom'; 
import 'normalize.css'; 
import './defaults.css'; 

// shop 폴더 내부의 index.tsx (XpaioApp)를 가져옴
import XpaioApp from './shop'; 

declare global {
  interface Window {
    Pi: any;
    PiDocs: any;
  }
}

// 1. rootElement가 확실히 존재한다고 지정 (as HTMLElement)
const rootElement = document.getElementById('root') as HTMLElement;

// 2. ReactDOM을 any로 형변환하여 render 메서드에 대한 타입 경고를 강제로 제거
// 이 방식은 React 16 버전에서 발생하는 타입 충돌을 가장 확실하게 해결합니다.
(ReactDOM as any).render(
  <React.StrictMode>
    <XpaioApp />
  </React.StrictMode>,
  rootElement
);