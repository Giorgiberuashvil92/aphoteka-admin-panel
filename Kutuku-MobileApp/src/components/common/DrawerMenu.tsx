import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AversiHeader } from './AversiHeader';

interface MenuItem {
  id: string;
  title: string;
  imageSource?: any;
  hasChevron?: boolean;
  submenu?: SubMenuItem[];
  onPress?: () => void;
}

interface SubMenuItem {
  id: string;
  title: string;
  onPress: () => void;
}

interface MenuSection {
  id: string;
  title?: string;
  items: MenuItem[];
}

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
  onSearch?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function DrawerMenu({ visible, onClose, onSearch }: DrawerMenuProps) {
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState<{
    id: string;
    title: string;
    subItems: SubMenuItem[];
  } | null>(null);

  const insets = useSafeAreaInsets();

  const menuData: MenuSection[] = [
    {
      id: 'categories-section',
      items: [
        {
          id: 'pharmacies',
          title: 'ონლაინ აფთიაქი',
          hasChevron: true,
          submenu: [
            { id: 'find-pharmacy', title: 'აფთიაქის მოძიება', onPress: () => {} },
            { id: 'pharmacy-map', title: 'აფთიაქების რუკა', onPress: () => {} },
          ],
          onPress: () => {},
        },
        {
          id: 'offers',
          title: 'შეთავაზებები',
          hasChevron: false,
          onPress: () => {},
        },
        {
          id: 'news',
          title: 'სიახლეები',
          hasChevron: false,
          onPress: () => {},
        },
        {
          id: 'company',
          title: 'კომპანია',
          hasChevron: true,
          submenu: [
            { id: 'about', title: 'ჩვენს შესახებ', onPress: () => {} },
            { id: 'video', title: 'ვიდეო გალერეა', onPress: () => {} },
            { id: 'vacancies', title: 'ვაკანსიები', onPress: () => {} },
            { id: 'events', title: 'ივენტები', onPress: () => {} },
            { id: 'partners', title: 'პარტნიორები', onPress: () => {} },
            { id: 'charity', title: 'საქველმოქმედო ფონდი', onPress: () => {} },
            { id: 'projects', title: 'პროექტები და მიზნები', onPress: () => {} },
            { id: 'structure', title: 'სტრუქტურა', onPress: () => {} },
          ],
          onPress: () => {},
        },
        {
          id: 'brands',
          title: 'ბრენდები',
          hasChevron: false,
          onPress: () => {},
        },
        {
          id: 'medical',
          title: 'სამედიცინო თემები',
          hasChevron: false,
          onPress: () => {},
        },
        {
          id: 'contact',
          title: 'კონტაქტი',
          hasChevron: false,
          onPress: () => {},
        },
        {
          id: 'kurnali',
          title: 'კურნალი',
          hasChevron: false,
          onPress: () => {},
        },
      ],
    },
    {
      id: 'language-section',
      title: 'ენა',
      items: [
        {
          id: 'language',
          title: 'ქართული',
          hasChevron: true,
          onPress: () => {},
        },
      ],
    },
  ];

  const handleMenuItemPress = (item: MenuItem) => {
    if (item.submenu && item.submenu.length > 0) {
      setSelectedCategoryDetails({
        id: item.id,
        title: item.title,
        subItems: item.submenu,
      });
    } else {
      item.onPress?.();
      onClose();
    }
  };

  const handleGoBack = () => {
    setSelectedCategoryDetails(null);
  };

  const handleSubItemPress = (subItem: SubMenuItem) => {
    subItem.onPress();
    onClose();
  };

  return (
    <Modal visible={visible} transparent onRequestClose={onClose} animationType="none">
      <View style={styles.container}>
        {/* Status Bar Spacer */}
        <View style={[styles.statusBar, { height: insets.top === 0 ? 24 : insets.top }]} />

        {/* Header */}
        <AversiHeader
          onSearchPress={() => {
            onSearch?.();
            onClose();
          }}
          onMenuPress={onClose}
        />

        {/* Menu Content */}
        <View style={[styles.menuContainer, { maxHeight: SCREEN_HEIGHT - 200 }]}>
          {/* Submenu Header */}
          {selectedCategoryDetails && (
            <TouchableOpacity style={styles.submenuHeader} onPress={handleGoBack}>
              <Ionicons name="arrow-back" size={16} color={theme.colors.text.primary} style={styles.backArrow} />
              <Text style={styles.submenuTitle}>{selectedCategoryDetails.title}</Text>
            </TouchableOpacity>
          )}

          {/* Submenu Items */}
          {selectedCategoryDetails ? (
            <View style={styles.submenuContent}>
              {selectedCategoryDetails.subItems.map((subItem) => (
                <TouchableOpacity
                  key={subItem.id}
                  style={styles.menuItem}
                  onPress={() => handleSubItemPress(subItem)}
                >
                  <Text style={styles.menuItemText}>{subItem.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            /* Main Menu */
            <ScrollView showsVerticalScrollIndicator={false}>
              {menuData.map((section) => (
                <View key={section.id} style={styles.section}>
                  {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}

                  <View>
                    {section.items.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.menuItem}
                        onPress={() => handleMenuItemPress(item)}
                      >
                        <View style={styles.menuItemLeft}>
                          {item.imageSource && (
                            <Image source={item.imageSource} style={styles.flagImage} />
                          )}
                          <Text style={styles.menuItemText}>{item.title}</Text>
                        </View>
                        {item.hasChevron && (
                          <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {section.id === 'categories-section' && <View style={styles.separator} />}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Overlay */}
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    backgroundColor: theme.colors.white,
  },
  menuContainer: {
    backgroundColor: theme.colors.white,
    gap: 24,
  },
  submenuHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginBottom: -24,
  },
  backArrow: {
    position: 'absolute',
    left: 16,
  },
  submenuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginHorizontal: 40,
  },
  submenuContent: {
    paddingHorizontal: 16,
  },
  section: {
    gap: 4,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    gap: 16,
  },
  menuItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.colors.text.primary,
    flex: 1,
  },
  flagImage: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: theme.colors.gray[600],
    borderRadius: 16,
  },
  separator: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[400],
    marginTop: 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(31, 32, 33, 0.90)',
  },
});
