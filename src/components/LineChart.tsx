import { useId } from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Polygon,
  Polyline,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { useTheme } from '@/lib/useTheme';

export interface ChartPoint {
  x: number; // any monotonic value (e.g. timestamp or index)
  y: number;
  label?: string; // x-axis label (e.g. date)
}

/**
 * Minimal responsive line chart. Plots y over x with min/max y guides.
 * Renders on web and native via react-native-svg.
 */
export function LineChart({
  data,
  height = 160,
  width = 320,
  color,
}: {
  data: ChartPoint[];
  height?: number;
  width?: number;
  color?: string;
}) {
  const { palette: c } = useTheme();
  const stroke = color ?? c.accent;
  if (data.length === 0) return null;

  const padL = 34;
  const padR = 10;
  const padT = 12;
  const padB = 22;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const xs = data.map((d) => d.x);
  const ys = data.map((d) => d.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const sx = (x: number) => padL + ((x - minX) / spanX) * plotW;
  const sy = (y: number) => padT + plotH - ((y - minY) / spanY) * plotH;

  const points = data.map((d) => `${sx(d.x)},${sy(d.y)}`).join(' ');
  // closed polygon for the gradient area fill (line down to the baseline)
  const baseline = padT + plotH;
  const area = `${sx(minX)},${baseline} ${points} ${sx(maxX)},${baseline}`;
  const gradId = `area-${useId().replace(/:/g, '')}`;

  return (
    <View>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={stroke} stopOpacity={0.35} />
            <Stop offset="1" stopColor={stroke} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {data.length > 1 && <Polygon points={area} fill={`url(#${gradId})`} />}
        {/* y guides: min, mid, max */}
        {[maxY, (maxY + minY) / 2, minY].map((gy, i) => {
          const y = sy(gy);
          return (
            <Line
              key={i}
              x1={padL}
              y1={y}
              x2={width - padR}
              y2={y}
              stroke={c.border}
              strokeWidth={1}
            />
          );
        })}
        {[maxY, minY].map((gy, i) => (
          <SvgText
            key={`l${i}`}
            x={4}
            y={sy(gy) + 4}
            fill={c.textMuted}
            fontSize={10}
          >
            {Math.round(gy)}
          </SvgText>
        ))}
        {data.length > 1 && (
          <Polyline points={points} fill="none" stroke={stroke} strokeWidth={2.5} />
        )}
        {data.map((d, i) => (
          <Circle key={i} cx={sx(d.x)} cy={sy(d.y)} r={3.5} fill={stroke} />
        ))}
        {/* first & last x labels */}
        {[data[0], data[data.length - 1]].map((d, i) =>
          d.label ? (
            <SvgText
              key={`x${i}`}
              x={i === 0 ? padL : width - padR}
              y={height - 6}
              fill={c.textMuted}
              fontSize={10}
              textAnchor={i === 0 ? 'start' : 'end'}
            >
              {d.label}
            </SvgText>
          ) : null,
        )}
      </Svg>
    </View>
  );
}
