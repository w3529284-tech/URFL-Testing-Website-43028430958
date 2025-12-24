import { useEffect } from "react";

export function NewYearPopup() {
  useEffect(() => {
    const audio = new Audio("data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==");
    audio.play().catch(() => {});
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-gradient-to-b from-blue-600 via-purple-600 to-pink-600 p-12 rounded-2xl shadow-2xl text-center space-y-8 max-w-2xl animate-popupBounce">
        <div className="space-y-6">
          <div className="flex justify-center gap-4 text-7xl">
            <span className="animate-fireworks">🎆</span>
            <span className="animate-bounce">✨</span>
            <span className="animate-fireworks">🎇</span>
          </div>
          <h1 className="text-7xl font-black text-white drop-shadow-lg">Happy New Year!</h1>
          <p className="text-4xl font-black text-yellow-200 drop-shadow-lg">2026</p>
          <p className="text-2xl text-white/95 drop-shadow-lg">Welcome to New Beginnings & Fresh Starts! 🌟</p>
        </div>

        <div className="flex justify-center gap-4 text-6xl">
          <span className="animate-pulse">🎉</span>
          <span className="animate-bounce">🎊</span>
          <span className="animate-pulse" style={{ animationDelay: "0.5s" }}>🎉</span>
        </div>

        <div className="grid grid-cols-2 gap-6 text-white drop-shadow-lg">
          <div className="space-y-3 bg-white/10 p-4 rounded-lg backdrop-blur">
            <div className="text-5xl">🚀</div>
            <p className="text-lg font-bold">Ambition</p>
            <p className="text-sm opacity-90">Chase your goals</p>
          </div>
          <div className="space-y-3 bg-white/10 p-4 rounded-lg backdrop-blur">
            <div className="text-5xl">💫</div>
            <p className="text-lg font-bold">Promise</p>
            <p className="text-sm opacity-90">Limitless potential</p>
          </div>
          <div className="space-y-3 bg-white/10 p-4 rounded-lg backdrop-blur">
            <div className="text-5xl">🌈</div>
            <p className="text-lg font-bold">Hope</p>
            <p className="text-sm opacity-90">Bright future ahead</p>
          </div>
          <div className="space-y-3 bg-white/10 p-4 rounded-lg backdrop-blur">
            <div className="text-5xl">🎯</div>
            <p className="text-lg font-bold">Success</p>
            <p className="text-sm opacity-90">Make it happen</p>
          </div>
        </div>

        <div className="pt-6 border-t-2 border-white/30">
          <p className="text-xl text-white font-semibold drop-shadow-lg">Let's make 2026 unforgettable! 🥳</p>
        </div>
      </div>
    </div>
  );
}
