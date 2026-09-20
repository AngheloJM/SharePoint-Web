const SHAPES = [
  { type: 'circle', top: '12%', left: '8%', size: 22, color: '#3b82f6', delay: '0s' },
  { type: 'circle', top: '78%', left: '14%', size: 14, color: '#22c55e', delay: '1.2s' },
  { type: 'circle', top: '65%', left: '92%', size: 18, color: '#3b82f6', delay: '0.6s' },
  { type: 'triangle', top: '20%', left: '90%', size: 26, color: '#22c55e', delay: '0.4s' },
  { type: 'triangle', top: '85%', left: '85%', size: 18, color: '#3b82f6', delay: '1.6s' },
  { type: 'triangle', top: '90%', left: '5%', size: 20, color: '#22c55e', delay: '0.9s' },
  { type: 'square', top: '8%', left: '48%', size: 14, color: '#64748b', delay: '1.4s' },
  { type: 'square', top: '45%', left: '4%', size: 12, color: '#3b82f6', delay: '0.2s' },
];

function Shape({ type, top, left, size, color, delay }) {
  const style = { top, left, animationDelay: delay };

  if (type === 'circle') {
    return (
      <span
        className="swamp-shape swamp-shape-circle"
        style={{ ...style, width: size, height: size, borderColor: color }}
      />
    );
  }

  if (type === 'square') {
    return (
      <span
        className="swamp-shape swamp-shape-square"
        style={{ ...style, width: size, height: size, borderColor: color }}
      />
    );
  }

  return (
    <span
      className="swamp-shape swamp-shape-triangle"
      style={{ ...style, borderBottomColor: color, borderBottomWidth: size, borderLeftWidth: size / 1.8, borderRightWidth: size / 1.8 }}
    />
  );
}

/** Fondo oscuro del login con figuras geométricas flotantes (círculos, triángulos, cuadrados). */
export default function SwampBackground() {
  return (
    <div className="swamp-bg" aria-hidden="true">
      {SHAPES.map((shape, i) => (
        <Shape key={i} {...shape} />
      ))}
    </div>
  );
}
