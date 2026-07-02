import { fonts } from '@/src/theme/fonts';
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

const NAVY = '#132B73';
const TEAL = '#22B8B5';
const PHARMA = '#111111';

type NorixLogoProps = {
  width?: number;
};

/** ოფიციალური Norix PHARMACEUTICALS ლოგო (SVG) */
export function NorixLogo({ width = 168 }: NorixLogoProps) {
  const height = (width * 170) / 520;

  return (
    <Svg width={width} height={height} viewBox="0 0 520 170" fill="none">
      <SvgText
        x="20"
        y="95"
        fontFamily={fonts.medium}
        fontSize="86"
        fontWeight="500"
        letterSpacing={-3}
        fill={NAVY}
      >
        Norix
      </SvgText>

      <G transform="translate(298 18)">
        <Rect
          x="0"
          y="0"
          width="22"
          height="50"
          rx="11"
          fill="white"
          stroke={NAVY}
          strokeWidth="4"
        />
        <Path d="M3 11C3 5 8 2 11 2C17 2 19 6 19 11V24H3V11Z" fill={TEAL} />
        <Line x1="3" y1="25" x2="19" y2="25" stroke={NAVY} strokeWidth="2" />
      </G>

      <SvgText
        x="28"
        y="140"
        fontFamily={fonts.regular}
        fontSize="24"
        fontWeight="400"
        letterSpacing={11}
        fill={PHARMA}
      >
        PHARMACEUTICALS
      </SvgText>
    </Svg>
  );
}
