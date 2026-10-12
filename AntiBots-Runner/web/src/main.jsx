import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
function App(){
  return <iframe className="game-frame" title="AntiBots Runner" src="/game/index.html" allow="fullscreen; autoplay; gamepad" allowFullScreen />;
}
createRoot(document.getElementById('root')).render(<App/>);
