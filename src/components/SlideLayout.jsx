export default function SlideLayout({ layout = 'center', children }) {
  const layouts = {
    center: 'flex items-center justify-center max-w-6xl mx-auto px-8',
    'split-40-60': 'grid grid-cols-[40%_60%] gap-8 items-center px-8',
    'split-60-40': 'grid grid-cols-[60%_40%] gap-8 items-center px-8',
    'three-up': 'grid grid-cols-3 gap-6 items-start px-8',
    full: 'w-full h-full p-0',
  };

  return (
    <div className={`w-full h-full ${layouts[layout] || layouts.center}`}>
      {children}
    </div>
  );
}
