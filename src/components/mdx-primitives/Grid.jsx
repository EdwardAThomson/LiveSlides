export default function Grid({ 
  cols = { base: 1, md: 2 }, 
  gap = 'md', 
  align = 'start',
  children 
}) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  // Build responsive grid columns
  const colsBase = typeof cols === 'number' ? cols : cols.base || 1;
  const colsMd = typeof cols === 'object' ? cols.md : cols;
  const colsLg = typeof cols === 'object' ? cols.lg : colsMd;

  return (
    <div 
      className={`
        grid 
        grid-cols-${colsBase} 
        ${colsMd ? `md:grid-cols-${colsMd}` : ''} 
        ${colsLg ? `lg:grid-cols-${colsLg}` : ''}
        ${gapClasses[gap] || gapClasses.md}
        ${alignClasses[align] || alignClasses.start}
        w-full
      `}
    >
      {children}
    </div>
  );
}
