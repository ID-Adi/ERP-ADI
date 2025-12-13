'use client';

export default function LoadingMoreItems() {
  return (
    <div className="flex items-center justify-center py-6">
      {/* Shimmer text background */}
      <div
        className="relative inline-block px-6 py-3 rounded-lg overflow-hidden"
        style={{
          background: `linear-gradient(
            90deg,
            transparent 0%,
            rgba(217, 93, 57, 0.15) 25%,
            rgba(217, 93, 57, 0.3) 50%,
            rgba(217, 93, 57, 0.15) 75%,
            transparent 100%
          )`,
          backgroundSize: '200% 100%',
          animation: 'shimmerMove 2s infinite ease-in-out',
        }}
      >
        <span className="text-sm font-medium text-primary-600">
          Loading more items..
        </span>
      </div>

      {/* Animated dots */}
      <div className="flex gap-1 ml-3">
        {[0, 1, 2].map((dot) => (
          <div
            key={dot}
            className="w-1.5 h-1.5 rounded-full bg-primary-600"
            style={{
              animation: `pulse 1.4s infinite ease-in-out`,
              animationDelay: `${dot * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes shimmerMove {
          0% {
            backgroundPosition: 200% 0;
          }
          50% {
            backgroundPosition: -200% 0;
          }
          100% {
            backgroundPosition: 200% 0;
          }
        }

        @keyframes pulse {
          0%, 80%, 100% {
            opacity: 0.4;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
