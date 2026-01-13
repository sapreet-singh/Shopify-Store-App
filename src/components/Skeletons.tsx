import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ViewStyle } from "react-native";

interface SkeletonItemProps {
  style?: ViewStyle;
  borderRadius?: number;
}

export const SkeletonItem = ({ style, borderRadius = 8 }: SkeletonItemProps) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        { opacity, borderRadius },
        style,
      ]}
    />
  );
};

export const ProductCardSkeleton = ({ style }: { style?: ViewStyle }) => {
  return (
    <View style={[styles.productCard, style]}>
      <SkeletonItem style={styles.productImage} borderRadius={12} />
      <SkeletonItem style={styles.productTitle} borderRadius={4} />
      <SkeletonItem style={styles.productPrice} borderRadius={4} />
    </View>
  );
};

export const CategoryChipSkeleton = () => {
  return (
    <View style={styles.chipContainer}>
      <SkeletonItem style={styles.chipImage} borderRadius={30} />
      <SkeletonItem style={styles.chipText} borderRadius={4} />
    </View>
  );
};

export const CategoryCardSkeleton = () => {
  return (
    <View style={styles.categoryCard}>
      <SkeletonItem style={styles.categoryImage} borderRadius={10} />
      <SkeletonItem style={styles.categoryTitle} borderRadius={4} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: "#e2e8f0",
  },
  // Product Card
  productCard: {
    width: 140,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    marginRight: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  productImage: {
    width: "100%",
    height: 120,
    marginBottom: 10,
  },
  productTitle: {
    width: "90%",
    height: 14,
    marginBottom: 6,
  },
  productPrice: {
    width: "50%",
    height: 14,
  },

  // Category Chip
  chipContainer: {
    alignItems: "center",
    width: 80,
    marginRight: 12,
  },
  chipImage: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  chipText: {
    width: 50,
    height: 10,
  },

  // Category Card (Grid)
  categoryCard: {
    width: "48%",
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  categoryImage: {
    width: "100%",
    height: 140,
    marginBottom: 10,
  },
  categoryTitle: {
    width: "80%",
    height: 16,
  },
});
