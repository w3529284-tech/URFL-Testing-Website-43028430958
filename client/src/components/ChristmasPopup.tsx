import { useEffect } from "react";

interface ChristmasPopupProps {
  onClose: () => void;
}

export function ChristmasPopup({ onClose }: ChristmasPopupProps) {
  useEffect(() => {
    const audio = new Audio("data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==");
    audio.play().catch(() => {});
  }, []);

  const handleClose = () => {
    localStorage.setItem("christmasPopupDismissed", "true");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-gradient-to-b from-red-600 to-green-600 p-12 rounded-2xl shadow-2xl text-center space-y-8 max-w-2xl animate-popupBounce relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white hover:text-red-100 transition-colors drop-shadow-lg"
          aria-label="Close popup"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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

        <div className="pt-6 border-t-2 border-white/30 space-y-5">
          <div className="bg-white/10 p-4 rounded-lg backdrop-blur space-y-2">
            <p className="text-lg text-white font-bold drop-shadow-lg">Remember the True Meaning</p>
            <p className="text-sm text-white/90 drop-shadow-lg">Christmas isn't about the presents under the tree, the cookies we bake, or any of the material things. It's about celebrating the birth of Jesus Christ—God's greatest gift to humanity. In the midst of all the festivities, let us not forget that this holy day is fundamentally about Jesus and His love for us.</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-white/90 italic drop-shadow-lg">"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."</p>
            <p className="text-xs text-white/80 drop-shadow-lg">— John 3:16</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-white/90 italic drop-shadow-lg">"For to us a child is born, to us a son is given, and the government will be on his shoulders. And he will be called Wonderful Counselor, Mighty God, Everlasting Father, Prince of Peace."</p>
            <p className="text-xs text-white/80 drop-shadow-lg">— Isaiah 9:6</p>
          </div>
        </div>
      </div>
    </div>
  );
}
