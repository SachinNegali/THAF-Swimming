import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, Pattern, Rect, G, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme';

const WAYPOINTS = [
  { x: 70, y: 720, label: 'START · PUNE' },
  { x: 150, y: 520, label: 'LONAVALA' },
  { x: 240, y: 200, label: 'MAHABALESHWAR' },
  { x: 360, y: 60, label: 'GOA' },
];

export const PaperMap = React.memo(() => (
  <View style={styles.wrap}>
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 400 800"
      preserveAspectRatio="xMidYMid slice"
    >
      <Defs>
        <Pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <Line x1="0" y1="0" x2="0" y2="6" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
        </Pattern>
        <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <Path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
        </Pattern>
      </Defs>
      <Rect width="400" height="800" fill="url(#grid)" />

      <G stroke="rgba(0,0,0,0.07)" strokeWidth="0.8" fill="none">
        <Path d="M -20 200 Q 100 180 200 220 T 420 240" />
        <Path d="M -20 230 Q 110 210 200 250 T 420 270" />
        <Path d="M -20 260 Q 120 240 200 280 T 420 300" />
        <Path d="M -20 380 Q 80 360 200 410 T 420 430" />
        <Path d="M -20 420 Q 90 410 200 460 T 420 480" />
        <Path d="M -20 600 Q 100 580 200 620 T 420 640" />
        <Path d="M -20 640 Q 100 620 200 660 T 420 680" />
      </G>

      <Path
        d="M -20 720 Q 100 700 200 740 T 420 760 V 820 H -20 Z"
        fill="url(#hatch)"
      />

      <G stroke="rgba(0,0,0,0.13)" strokeWidth="6" fill="none" strokeLinecap="round">
        <Path d="M -20 580 Q 120 540 240 600 T 420 580" opacity={0.4} />
        <Path d="M 380 -20 Q 320 200 220 340 T 80 600" opacity={0.4} />
        <Path d="M -20 350 Q 160 380 280 320 T 420 340" opacity={0.3} />
      </G>

      <Path
        d="M 70 720 Q 90 600 150 520 Q 210 440 200 360 Q 190 280 240 200 Q 290 120 360 60"
        stroke={colors.ink}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M 70 720 Q 90 600 150 520 Q 200 470 215 430"
        stroke={colors.ink}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M 215 430 Q 210 380 200 360 Q 190 280 240 200 Q 290 120 360 60"
        stroke={colors.ink}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="2 6"
        opacity={0.4}
      />

      {WAYPOINTS.map((wp) => (
        <G key={wp.label}>
          <Circle cx={wp.x} cy={wp.y} r={5} fill={colors.white} stroke={colors.ink} strokeWidth="2" />
          <SvgText
            x={wp.x + 10}
            y={wp.y + 3}
            fontSize="9"
            fontFamily="Courier"
            fill={colors.ink}
            letterSpacing="1"
          >
            {wp.label}
          </SvgText>
        </G>
      ))}

      <G transform="translate(340, 750)">
        <Circle r="14" fill={colors.white} stroke="rgba(0,0,0,0.15)" />
        <Path d="M 0 -8 L 3 4 L 0 1 L -3 4 Z" fill={colors.ink} />
        <SvgText y="22" textAnchor="middle" fontSize="8" fontFamily="Courier" fill="rgba(0,0,0,0.5)">
          N
        </SvgText>
      </G>
    </Svg>
  </View>
));

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.paper2,
  },
});
