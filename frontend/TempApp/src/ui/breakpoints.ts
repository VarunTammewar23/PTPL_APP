import { useWindowDimensions } from 'react-native';

export function useTabletLayout() {
  const { width } = useWindowDimensions();

  return {
    isSmallTablet: width < 1000,   // 7–8 inch
    isMediumTablet: width >= 1000 && width < 1200,
    isLargeTablet: width >= 1200,
  };
}
