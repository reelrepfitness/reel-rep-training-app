import React from 'react';
import { View as RNView, ViewProps } from 'react-native';

export function View({ style, ...props }: ViewProps) {
  return <RNView style={style} {...props} />;
}
