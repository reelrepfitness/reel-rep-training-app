import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ShoppingCart } from 'lucide-react-native';
import { useShop } from '@/contexts/ShopContext';
import Colors from '@/constants/colors';
import { hebrew } from '@/constants/hebrew';

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const { packages, cart, addToCart, removeFromCart, getTotal } = useShop();

  const handleAddToCart = (pkg: any) => {
    addToCart(pkg);
    Alert.alert(hebrew.common.success, 'נוסף לסל בהצלחה!');
  };

  const isInCart = (pkgId: string) => {
    return cart.some(item => item.package.id === pkgId);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{hebrew.shop.subscriptions}</Text>
        {cart.length > 0 && (
          <View style={styles.cartBadge}>
            <ShoppingCart size={20} color={Colors.background} />
            <Text style={styles.cartCount}>{cart.length}</Text>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {packages.map((pkg) => {
          const inCart = isInCart(pkg.id);
          
          return (
            <View 
              key={pkg.id} 
              style={[
                styles.packageCard,
                pkg.popular && styles.packageCardPopular,
              ]}
            >
              {pkg.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>{hebrew.shop.popular}</Text>
                </View>
              )}
              
              <View style={styles.packageHeader}>
                <Text style={styles.packageName}>{pkg.name}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>{pkg.price.toString()}</Text>
                  <Text style={styles.currency}>{pkg.currency}</Text>
                  <Text style={styles.duration}>/{hebrew.shop.month}</Text>
                </View>
              </View>

              <View style={styles.features}>
                {pkg.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Check size={16} color={Colors.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.addButton,
                  inCart && styles.addButtonActive,
                ]}
                onPress={() => {
                  if (inCart) {
                    const item = cart.find(i => i.package.id === pkg.id);
                    if (item) removeFromCart(item.id);
                  } else {
                    handleAddToCart(pkg);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.addButtonText,
                  inCart && styles.addButtonTextActive,
                ]}>
                  {inCart ? 'בסל' : hebrew.shop.addToCart}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {cart.length > 0 && (
          <View style={styles.cartSummary}>
            <Text style={styles.cartTitle}>{hebrew.shop.cart}</Text>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{hebrew.shop.total}:</Text>
              <Text style={styles.totalValue}>{getTotal()} ₪</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => Alert.alert('תשלום', 'בקרוב: אינטגרציה עם מערכת תשלומים')}
              activeOpacity={0.7}
            >
              <Text style={styles.checkoutButtonText}>{hebrew.shop.checkout}</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
  },
  cartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  cartCount: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  packageCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  packageCardPopular: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.background,
    writingDirection: 'rtl' as const,
  },
  packageHeader: {
    marginBottom: 20,
  },
  packageName: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
  },
  price: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  currency: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginLeft: 4,
  },
  duration: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginLeft: 4,
    writingDirection: 'rtl' as const,
  },
  features: {
    gap: 12,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonActive: {
    backgroundColor: Colors.success,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.background,
    writingDirection: 'rtl' as const,
  },
  addButtonTextActive: {
    color: Colors.background,
  },
  cartSummary: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    writingDirection: 'rtl' as const,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  checkoutButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.background,
    writingDirection: 'rtl' as const,
  },
});
