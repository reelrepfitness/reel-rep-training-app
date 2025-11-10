import React from 'react';
import { Image } from 'react-native';

interface WorkoutIconProps {
  size?: number;
  progress?: number;
  weeklyGoal?: number;
}

export default function WorkoutIcon({ size = 24 }: WorkoutIconProps) {
  return (
    <Image
      source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/5vkod15oli073tmaxnug1' }}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
