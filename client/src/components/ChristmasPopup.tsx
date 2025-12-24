import { useEffect } from "react";

export function ChristmasPopup() {
  useEffect(() => {
    const audio = new Audio("data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==");
    audio.play().catch(() => {});
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-gradient-to-b from-red-600 to-green-600 p-12 rounded-2xl shadow-2xl text-center space-y-8 max-w-2xl animate-popupBounce">
        <div className="space-y-4">
          <div className="flex justify-center gap-4 text-7xl animate-pulse">
            <span className="animate-spin">🎄</span>
            <span>🎅</span>
            <span className="animate-spin" style={{ animationDirection: "reverse" }}>🎄</span>
          </div>
          <h1 className="text-6xl font-black text-white drop-shadow-lg">Merry Christmas!</h1>
          <p className="text-2xl text-white/90 drop-shadow-lg">🎁 The big day is here! 🎁</p>
        </div>
        
        <div className="flex justify-center gap-3 text-5xl animate-bounce">
          <span>🎉</span>
          <span>✨</span>
          <span>🎊</span>
          <span>✨</span>
          <span>🎉</span>
        </div>

        <div className="grid grid-cols-3 gap-4 text-white drop-shadow-lg">
          <div className="space-y-2 animate-pulse" style={{ animationDelay: "0s" }}>
            <div className="text-5xl font-black">🎀</div>
            <p className="text-lg font-bold">Joy</p>
          </div>
          <div className="space-y-2 animate-pulse" style={{ animationDelay: "0.2s" }}>
            <div className="text-5xl font-black">⛄</div>
            <p className="text-lg font-bold">Wonder</p>
          </div>
          <div className="space-y-2 animate-pulse" style={{ animationDelay: "0.4s" }}>
            <div className="text-5xl font-black">🔔</div>
            <p className="text-lg font-bold">Cheer</p>
          </div>
        </div>

        <div className="pt-6 border-t-2 border-white/30 space-y-3">
          <p className="text-xl text-white font-semibold drop-shadow-lg">Enjoy the festivities! 🎉</p>
          <p className="text-sm text-white/90 italic drop-shadow-lg">"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."</p>
          <p className="text-xs text-white/80 drop-shadow-lg">— John 3:16</p>
        </div>
      </div>
    </div>
  );
}
