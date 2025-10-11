export default function Transition({ kind = 'fade', active, children }) {
  const baseClasses = "absolute inset-0 flex items-center justify-center p-16";
  
  const transitionClasses = {
    fade: `transition-opacity duration-300 ease-in-out ${active ? 'opacity-100' : 'opacity-0'}`,
    slide: `transition-all duration-350 ease-in-out ${
      active 
        ? 'opacity-100 translate-x-0' 
        : 'opacity-0 translate-x-[40%]'
    }`,
  };

  return (
    <div className={`${baseClasses} ${transitionClasses[kind] || transitionClasses.fade}`}>
      {children}
    </div>
  );
}
