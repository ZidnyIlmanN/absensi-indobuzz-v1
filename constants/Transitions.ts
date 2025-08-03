import { TransitionPresets } from '@react-navigation/stack';

export const customTransition = {
  ...TransitionPresets.SlideFromRightIOS,
  gestureDirection: 'horizontal',
  cardStyleInterpolator: ({ current, layouts }: { current: any; layouts: any }) => {
    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
      },
    };
  },
};