import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Modal, Animated, PanResponder, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[];
  enableBackdropDismiss?: boolean;
}

export function BottomSheet({
  isVisible,
  onClose,
  title,
  children,
  snapPoints = [0.5],
  enableBackdropDismiss = true,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = React.useState(false);
  const translateY = React.useRef(new Animated.Value(1000)).current;
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.spring(translateY, {
            toValue: 1000,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (isVisible && !mounted) {
      setMounted(true);
    }
  }, [isVisible, mounted]);

  useEffect(() => {
    if (mounted && isVisible) {
      translateY.setValue(1000);
      setTimeout(() => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start();
      }, 50);
    } else if (mounted && !isVisible) {
      Animated.spring(translateY, {
        toValue: 1000,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start(() => {
        setMounted(false);
      });
    }
  }, [mounted, isVisible, translateY]);

  const handleBackdropPress = useCallback(() => {
    if (enableBackdropDismiss) {
      onClose();
    }
  }, [enableBackdropDismiss, onClose]);

  if (!mounted && !isVisible) {
    return null;
  }

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={handleBackdropPress} />
        
        <Animated.View
          {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
          style={[
            styles.bottomSheetContainer,
            {
              paddingBottom: insets.bottom + 24,
              maxHeight: `${snapPoints[0] * 100}%`,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handle} />
          
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#fff" />
              </Pressable>
            </View>
          )}

          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function useBottomSheet() {
  const [isVisible, setIsVisible] = React.useState(false);

  const open = useCallback(() => setIsVisible(true), []);
  const close = useCallback(() => setIsVisible(false), []);

  return { isVisible, open, close };
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  bottomSheetContainer: {
    backgroundColor: '#171717',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#404040',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  content: {},
});
