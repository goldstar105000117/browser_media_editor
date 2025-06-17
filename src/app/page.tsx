'use client';

import React, { useEffect, useState } from 'react';
import { VideoCanvas } from '@/components/Canvas/VideoCanvas';
import { Timeline } from '@/components/Timeline/Timeline';
import { Toolbar } from '@/components/UI/Toolbar';
import { PropertiesPanel } from '@/components/UI/PropertiesPanel';
import { initWASM, getWASMStatus, isUsingMockWASM } from '@/lib/wasm/wasmLoader';

export default function Home() {
  const [wasmReady, setWasmReady] = useState(false);
  const [wasmError, setWasmError] = useState<string | null>(null);
  const [wasmStatus, setWasmStatus] = useState<string>('Loading...');

  useEffect(() => {
    const loadWASM = async () => {
      try {
        const success = await initWASM();
        setWasmStatus(getWASMStatus());
      } catch (error) {
        console.error('WASM initialization error:', error);
        setWasmStatus('Failed');
      }
    };

    loadWASM();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* WASM Status Indicator */}
      {/* <div className="absolute top-[30px] right-4 z-50">
        <div className={`px-3 py-1 rounded text-sm font-medium ${wasmReady
          ? 'bg-green-600 text-white'
          : wasmError
            ? 'bg-yellow-600 text-white'
            : 'bg-blue-600 text-white'
          }`}>
          {wasmReady ? '🦀 WASM Ready' : wasmError ? '📱 JS Fallback' : '⏳ Loading WASM...'}
        </div>
      </div> */}

      {/* Toolbar */}
      <div className="h-16 border-b border-gray-700">
        <Toolbar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center bg-gray-800 relative">
          <VideoCanvas />
        </div>

        {/* Properties Panel */}
        <PropertiesPanel />
      </div>

      {/* Timeline */}
      <div className="h-64 border-t border-gray-700">
        <Timeline />
      </div>

      {/* <div className="absolute top-12 right-4 z-50">
        <div className={`px-3 py-1 rounded text-sm font-medium ${wasmStatus === 'Real WASM'
          ? 'bg-green-600 text-white'
          : wasmStatus === 'Mock WASM'
            ? 'bg-blue-600 text-white'
            : wasmStatus === 'Failed'
              ? 'bg-red-600 text-white'
              : 'bg-yellow-600 text-white'
          }`}>
          {wasmStatus === 'Real WASM' ? '🦀 Real WASM' :
            wasmStatus === 'Mock WASM' ? '🦀 Mock WASM' :
              wasmStatus === 'Failed' ? '❌ WASM Failed' : '⏳ Loading...'}
        </div>
      </div> */}
    </div>
  );
}