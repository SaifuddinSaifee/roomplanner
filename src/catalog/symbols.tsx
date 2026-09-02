// Schematic SVG symbols, one per catalog entry. Each is a pure function of
// (w, d) in px, drawn in local coordinates [0,0]..[w,d] with the item's
// *unrotated* footprint — the enclosing <g> handles rotation. This keeps the
// generic renderer free of any per-item hardcoding: a symbol scales to
// whatever width/depth the user sets.
//
// These are plain render functions keyed in a lookup table, not exported
// components — react/display-name's component heuristic doesn't apply.
/* eslint-disable react/display-name */
import type { ReactNode } from "react";

const STROKE = "#3a372f";
const FILL = "#f4efe4";
const FILL_SOFT = "#ece4d3";

function clampR(w: number, d: number, r: number) {
  return Math.max(0, Math.min(r, w / 2, d / 2));
}

type Symbol = (w: number, d: number) => ReactNode;

function bed(pillowRows: number): Symbol {
  return (w, d) => {
    const r = clampR(w, d, 10);
    const pillowH = Math.min(d * 0.22, 26);
    const pillowGap = w * 0.06;
    const pillowW = (w - pillowGap * (pillowRows + 1)) / pillowRows;
    return (
      <>
        <rect x={0} y={0} width={w} height={d} rx={r} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
        {Array.from({ length: pillowRows }).map((_, i) => (
          <rect
            key={i}
            x={pillowGap + i * (pillowW + pillowGap)}
            y={d * 0.06}
            width={pillowW}
            height={pillowH}
            rx={6}
            fill={FILL_SOFT}
            stroke={STROKE}
            strokeWidth={1}
          />
        ))}
        <line x1={0} y1={d * 0.34} x2={w} y2={d * 0.34} stroke={STROKE} strokeWidth={1} opacity={0.5} />
      </>
    );
  };
}

function wardrobeLike(doorLines = true): Symbol {
  return (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      {doorLines && <line x1={w / 2} y1={0} x2={w / 2} y2={d} stroke={STROKE} strokeWidth={1} />}
      <path d={`M0 ${d} A${d} ${d} 0 0 1 ${Math.min(d, w)} ${d - Math.min(d, w)}`} fill="none" stroke={STROKE} strokeWidth={0.75} opacity={0.5} />
    </>
  );
}

function drawerLines(rows: number): Symbol {
  return (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      {Array.from({ length: rows - 1 }).map((_, i) => (
        <line key={i} x1={2} y1={((i + 1) / rows) * d} x2={w - 2} y2={((i + 1) / rows) * d} stroke={STROKE} strokeWidth={1} />
      ))}
    </>
  );
}

function sofa(seats: number): Symbol {
  return (w, d) => {
    const r = clampR(w, d, 10);
    const backH = d * 0.28;
    const armW = Math.min(w * 0.12, 16);
    return (
      <>
        <rect x={0} y={0} width={w} height={d} rx={r} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
        <rect x={armW * 0.6} y={2} width={w - armW * 1.2} height={backH} rx={6} fill={FILL_SOFT} stroke={STROKE} strokeWidth={1} />
        <rect x={0} y={0} width={armW} height={d} rx={6} fill={FILL_SOFT} stroke={STROKE} strokeWidth={1} />
        <rect x={w - armW} y={0} width={armW} height={d} rx={6} fill={FILL_SOFT} stroke={STROKE} strokeWidth={1} />
        {Array.from({ length: seats - 1 }).map((_, i) => (
          <line
            key={i}
            x1={armW + ((i + 1) / seats) * (w - armW * 2)}
            y1={backH}
            x2={armW + ((i + 1) / seats) * (w - armW * 2)}
            y2={d}
            stroke={STROKE}
            strokeWidth={0.75}
            opacity={0.5}
          />
        ))}
      </>
    );
  };
}

function table(rounded = true): Symbol {
  return (w, d) => {
    const r = rounded ? clampR(w, d, 8) : 0;
    return <rect x={0} y={0} width={w} height={d} rx={r} fill="none" stroke={STROKE} strokeWidth={1.75} />;
  };
}

function ironTable(round: boolean): Symbol {
  return (w, d) => {
    const r = round ? Math.min(w, d) / 2 - 1 : clampR(w, d, 6);
    return round ? (
      <>
        <circle cx={w / 2} cy={d / 2} r={r} fill="none" stroke={STROKE} strokeWidth={2} />
        <circle cx={w / 2} cy={d / 2} r={Math.max(1, r - 5)} fill="none" stroke={STROKE} strokeWidth={0.75} strokeDasharray="3 3" opacity={0.6} />
      </>
    ) : (
      <>
        <rect x={0} y={0} width={w} height={d} rx={r} fill="none" stroke={STROKE} strokeWidth={2} />
        <rect x={4} y={4} width={Math.max(0, w - 8)} height={Math.max(0, d - 8)} rx={Math.max(0, r - 3)} fill="none" stroke={STROKE} strokeWidth={0.75} strokeDasharray="3 3" opacity={0.6} />
      </>
    );
  };
}

function ironTableStadium(): Symbol {
  return (w, d) => {
    const r = d / 2;
    return (
      <>
        <rect x={0} y={0} width={w} height={d} rx={r} fill="none" stroke={STROKE} strokeWidth={2} />
        <rect x={4} y={4} width={Math.max(0, w - 8)} height={Math.max(0, d - 8)} rx={Math.max(0, r - 4)} fill="none" stroke={STROKE} strokeWidth={0.75} strokeDasharray="3 3" opacity={0.6} />
      </>
    );
  };
}

function lamp(shadeOnly = false): Symbol {
  return (w, d) => {
    const r = Math.min(w, d) / 2 - 1;
    return (
      <>
        {!shadeOnly && <line x1={w / 2} y1={d / 2} x2={w / 2} y2={d} stroke={STROKE} strokeWidth={1.25} />}
        <circle cx={w / 2} cy={shadeOnly ? d / 2 : d / 2 - r * 0.15} r={r} fill={FILL_SOFT} stroke={STROKE} strokeWidth={1.5} />
        <circle cx={w / 2} cy={shadeOnly ? d / 2 : d / 2 - r * 0.15} r={1.4} fill={STROKE} />
      </>
    );
  };
}

function bench(): Symbol {
  return (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} rx={4} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      <line x1={2} y1={d * 0.3} x2={w - 2} y2={d * 0.3} stroke={STROKE} strokeWidth={0.75} opacity={0.5} />
    </>
  );
}

function oval(inset = 0.18): Symbol {
  return (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d * inset} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      <ellipse cx={w / 2} cy={d * (inset + (1 - inset) / 2)} rx={w / 2 - 2} ry={(d * (1 - inset)) / 2 - 2} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
    </>
  );
}

export const SYMBOLS: Record<string, Symbol> = {
  bed_single: bed(1),
  bed_double: bed(2),
  bed_queen: bed(2),
  bed_king: bed(2),
  bedside_table: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      <line x1={4} y1={d * 0.4} x2={w - 4} y2={d * 0.4} stroke={STROKE} strokeWidth={1} />
      <circle cx={w / 2} cy={d * 0.25} r={1.6} fill={STROKE} />
    </>
  ),

  bunk_bed: bed(2),
  daybed: bed(1),

  dressing_table: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      <ellipse cx={w / 2} cy={d * 0.24} rx={w * 0.32} ry={d * 0.18} fill="#fff" stroke={STROKE} strokeWidth={1.25} />
      <line x1={4} y1={d * 0.58} x2={w - 4} y2={d * 0.58} stroke={STROKE} strokeWidth={0.75} opacity={0.5} />
    </>
  ),

  wardrobe: wardrobeLike(true),
  chest_drawers: drawerLines(3),
  sideboard: drawerLines(2),
  display_cabinet: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} fill="#fff" stroke={STROKE} strokeWidth={1.5} />
      <line x1={w / 2} y1={0} x2={w / 2} y2={d} stroke={STROKE} strokeWidth={0.75} opacity={0.5} />
    </>
  ),
  filing_cabinet: drawerLines(3),
  bookshelf: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      {Array.from({ length: 4 }).map((_, i) => (
        <line key={i} x1={((i + 1) / 5) * w} y1={2} x2={((i + 1) / 5) * w} y2={d - 2} stroke={STROKE} strokeWidth={0.75} opacity={0.6} />
      ))}
    </>
  ),
  shoe_rack: drawerLines(3),
  loft_storage: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} fill="none" stroke={STROKE} strokeWidth={1.5} strokeDasharray="6 4" />
      <line x1={0} y1={0} x2={w} y2={d} stroke={STROKE} strokeWidth={0.75} opacity={0.4} />
      <line x1={w} y1={0} x2={0} y2={d} stroke={STROKE} strokeWidth={0.75} opacity={0.4} />
    </>
  ),

  sofa_3: sofa(3),
  sofa_2: sofa(2),
  armchair: sofa(1),
  recliner: sofa(1),
  coffee_table: table(true),
  ottoman: (w, d) => <rect x={0} y={0} width={w} height={d} rx={clampR(w, d, 8)} fill={FILL_SOFT} stroke={STROKE} strokeWidth={1.5} />,
  side_table: table(true),
  side_table_iron: ironTable(true),
  iron_table_long: ironTableStadium(),
  table: table(true),
  tv_unit: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      <rect x={w * 0.15} y={d * 0.2} width={w * 0.7} height={d * 0.35} fill={FILL_SOFT} stroke={STROKE} strokeWidth={1} />
    </>
  ),
  media_console: drawerLines(2),
  bar_cart: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} rx={3} fill="none" stroke={STROKE} strokeWidth={1.5} />
      <circle cx={4} cy={4} r={1.4} fill={STROKE} />
      <circle cx={w - 4} cy={4} r={1.4} fill={STROKE} />
      <circle cx={4} cy={d - 4} r={1.4} fill={STROKE} />
      <circle cx={w - 4} cy={d - 4} r={1.4} fill={STROKE} />
    </>
  ),

  study_desk: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      <line x1={2} y1={d * 0.75} x2={w - 2} y2={d * 0.75} stroke={STROKE} strokeWidth={0.75} opacity={0.5} />
    </>
  ),
  office_chair: (w, d) => (
    <>
      <circle cx={w / 2} cy={d * 0.6} r={Math.min(w, d) / 2 - 1} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      <rect x={w * 0.2} y={0} width={w * 0.6} height={d * 0.28} rx={4} fill={FILL_SOFT} stroke={STROKE} strokeWidth={1} />
    </>
  ),
  standing_desk: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      <line x1={2} y1={d * 0.15} x2={w - 2} y2={d * 0.15} stroke={STROKE} strokeWidth={0.75} opacity={0.5} />
    </>
  ),
  meeting_table: table(true),

  dining_2: table(true),
  dining_4: table(true),
  dining_6: table(true),
  dining_8: table(true),
  dining_table_iron: ironTable(false),
  bar_stool: (w, d) => <circle cx={w / 2} cy={d / 2} r={Math.min(w, d) / 2 - 1} fill={FILL} stroke={STROKE} strokeWidth={1.5} />,

  counter_run: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      <line x1={0} y1={4} x2={w} y2={4} stroke={STROKE} strokeWidth={0.75} opacity={0.6} />
    </>
  ),
  fridge: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      <line x1={0} y1={d * 0.35} x2={w} y2={d * 0.35} stroke={STROKE} strokeWidth={1} />
      <circle cx={w - 5} cy={d * 0.18} r={1.4} fill={STROKE} />
    </>
  ),
  sink: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      <rect x={w * 0.15} y={d * 0.18} width={w * 0.7} height={d * 0.64} rx={6} fill="#fff" stroke={STROKE} strokeWidth={1} />
    </>
  ),
  kitchen_island: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      <rect x={w * 0.1} y={d * 0.35} width={w * 0.8} height={d * 0.3} rx={4} fill={FILL_SOFT} stroke={STROKE} strokeWidth={1} />
    </>
  ),
  dishwasher: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      <rect x={4} y={4} width={w - 8} height={d - 8} fill="none" stroke={STROKE} strokeWidth={0.75} opacity={0.5} />
    </>
  ),
  oven_range: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      {[0, 1].map((r) =>
        [0, 1].map((c) => (
          <circle key={`${r}-${c}`} cx={w * (0.3 + c * 0.4)} cy={d * (0.3 + r * 0.4)} r={2.2} fill="none" stroke={STROKE} strokeWidth={1} />
        ))
      )}
    </>
  ),
  pantry_cabinet: wardrobeLike(true),

  wc: oval(0.3),
  basin: oval(0.35),
  shower_tray: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      <line x1={0} y1={0} x2={w} y2={d} stroke={STROKE} strokeWidth={0.75} opacity={0.5} />
      <line x1={w} y1={0} x2={0} y2={d} stroke={STROKE} strokeWidth={0.75} opacity={0.5} />
      <circle cx={w / 2} cy={d / 2} r={2} fill="none" stroke={STROKE} strokeWidth={1} />
    </>
  ),
  bathtub: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} rx={clampR(w, d, 10)} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      <rect x={4} y={4} width={w - 8} height={d - 8} rx={clampR(w - 8, d - 8, 8)} fill="#fff" stroke={STROKE} strokeWidth={0.75} opacity={0.6} />
    </>
  ),
  vanity: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      <ellipse cx={w / 2} cy={d * 0.4} rx={w * 0.28} ry={d * 0.22} fill="#fff" stroke={STROKE} strokeWidth={1} />
    </>
  ),
  linen_cabinet: drawerLines(3),

  floor_lamp: lamp(),
  floor_lamp_arc: (w, d) => (
    <>
      <line x1={w * 0.1} y1={d * 0.9} x2={w * 0.1} y2={d * 0.4} stroke={STROKE} strokeWidth={1.25} />
      <path d={`M${w * 0.1} ${d * 0.4} Q${w * 0.1} ${d * 0.05} ${w * 0.85} ${d * 0.2}`} fill="none" stroke={STROKE} strokeWidth={1.25} />
      <circle cx={w * 0.85} cy={d * 0.2} r={Math.min(w, d) * 0.16} fill={FILL_SOFT} stroke={STROKE} strokeWidth={1.25} />
    </>
  ),
  iron_floor_lamp: lamp(),
  table_lamp: lamp(true),
  pendant_light: (w, d) => (
    <>
      <circle cx={w / 2} cy={d / 2} r={Math.min(w, d) / 2 - 1} fill="none" stroke={STROKE} strokeWidth={1.5} strokeDasharray="3 3" />
      <circle cx={w / 2} cy={d / 2} r={1.6} fill={STROKE} />
    </>
  ),
  chandelier: (w, d) => (
    <>
      <circle cx={w / 2} cy={d / 2} r={Math.min(w, d) / 2 - 1} fill="none" stroke={STROKE} strokeWidth={1.5} strokeDasharray="3 3" />
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        const r = Math.min(w, d) / 2 - 4;
        return <circle key={i} cx={w / 2 + Math.cos(a) * r} cy={d / 2 + Math.sin(a) * r} r={1.4} fill={STROKE} />;
      })}
    </>
  ),
  wall_sconce: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} rx={1} fill={FILL_SOFT} stroke={STROKE} strokeWidth={1} />
    </>
  ),

  patio_table_iron: ironTable(true),
  patio_chair_iron: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} rx={clampR(w, d, 6)} fill="none" stroke={STROKE} strokeWidth={1.75} />
      <line x1={2} y1={d * 0.3} x2={w - 2} y2={d * 0.3} stroke={STROKE} strokeWidth={0.75} opacity={0.6} />
    </>
  ),
  outdoor_sofa: sofa(3),
  sun_lounger: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} rx={clampR(w, d, 8)} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      <line x1={2} y1={d * 0.28} x2={w - 2} y2={d * 0.28} stroke={STROKE} strokeWidth={1} opacity={0.6} />
      {Array.from({ length: 4 }).map((_, i) => (
        <line key={i} x1={2} y1={d * (0.4 + i * 0.14)} x2={w - 2} y2={d * (0.4 + i * 0.14)} stroke={STROKE} strokeWidth={0.5} opacity={0.4} />
      ))}
    </>
  ),
  umbrella_stand: (w, d) => (
    <>
      <circle cx={w / 2} cy={d / 2} r={Math.min(w, d) / 2 - 1} fill="none" stroke={STROKE} strokeWidth={1.5} strokeDasharray="2 3" />
      <circle cx={w / 2} cy={d / 2} r={1.6} fill={STROKE} />
    </>
  ),

  console_table: table(true),
  console_table_iron: ironTable(false),
  coat_rack: (w, d) => (
    <>
      <circle cx={w / 2} cy={d / 2} r={Math.min(w, d) / 2 - 1} fill="none" stroke={STROKE} strokeWidth={1.5} />
      <circle cx={w / 2} cy={d / 2} r={2} fill={STROKE} />
    </>
  ),
  entry_bench: bench(),

  crib: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} rx={clampR(w, d, 6)} fill="none" stroke={STROKE} strokeWidth={1.75} />
      <rect x={4} y={4} width={w - 8} height={d - 8} fill={FILL} stroke={STROKE} strokeWidth={0.75} opacity={0.6} />
    </>
  ),
  kids_bed: bed(1),
  changing_table: drawerLines(2),
  toy_storage: (w, d) => (
    <>
      <rect x={0} y={0} width={w} height={d} rx={6} fill={FILL} stroke={STROKE} strokeWidth={1.5} />
      <line x1={2} y1={d * 0.5} x2={w - 2} y2={d * 0.5} stroke={STROKE} strokeWidth={0.75} opacity={0.5} />
    </>
  ),
};

export function genericSymbol(w: number, d: number): ReactNode {
  return <rect x={0} y={0} width={w} height={d} fill={FILL} stroke={STROKE} strokeWidth={1.5} />;
}

export function drawSymbol(catalogId: string, w: number, d: number): ReactNode {
  const fn = SYMBOLS[catalogId];
  return fn ? fn(w, d) : genericSymbol(w, d);
}
