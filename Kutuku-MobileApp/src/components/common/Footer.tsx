import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FooterLink {
  title: string;
  onPress: () => void;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

export function Footer() {
  const footerSections: FooterSection[] = [
    {
      title: 'კომპანია',
      links: [
        { title: 'ჩვენს შესახებ', onPress: () => {} },
        { title: 'კონტაქტი', onPress: () => {} },
        { title: 'ვაკანსიები', onPress: () => {} },
      ],
    },
    {
      title: 'დახმარება',
      links: [
        { title: 'FAQ', onPress: () => {} },
        { title: 'მიწოდება', onPress: () => {} },
        { title: 'დაბრუნება', onPress: () => {} },
      ],
    },
    {
      title: 'პირობები',
      links: [
        { title: 'წესები და პირობები', onPress: () => {} },
        { title: 'კონფიდენციალურობა', onPress: () => {} },
      ],
    },
    {
      title: 'კონტაქტი',
      links: [
        { title: '2 40 40 40', onPress: () => {} },
        { title: 'info@kutuku.ge', onPress: () => {} },
      ],
    },
  ];

  const socialLinks = [
    { icon: 'logo-facebook' as const, url: 'https://facebook.com' },
    { icon: 'logo-instagram' as const, url: 'https://instagram.com' },
    { icon: 'logo-twitter' as const, url: 'https://twitter.com' },
    { icon: 'logo-youtube' as const, url: 'https://youtube.com' },
  ];

  const handleSocialPress = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
  };

  const partnerLogos = [
    { id: '1', name: 'Partner 1', image: 'https://via.placeholder.com/80x40/FF6B6B/FFFFFF?text=Partner1' },
    { id: '2', name: 'Partner 2', image: 'https://via.placeholder.com/80x40/4ECDC4/FFFFFF?text=Partner2' },
    { id: '3', name: 'Partner 3', image: 'https://via.placeholder.com/80x40/45B7D1/FFFFFF?text=Partner3' },
    { id: '4', name: 'Partner 4', image: 'https://via.placeholder.com/80x40/96CEB4/FFFFFF?text=Partner4' },
    { id: '5', name: 'Partner 5', image: 'https://via.placeholder.com/80x40/FFEAA7/333333?text=Partner5' },
    { id: '6', name: 'Partner 6', image: 'https://via.placeholder.com/80x40/DFE6E9/333333?text=Partner6' },
  ];

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Ionicons name="heart" size={32} color={theme.colors.primary} />
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Partner Logos */}
      <View style={styles.partnersSection}>
        <Text style={styles.partnersTitle}>ჩვენი პარტნიორები</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.partnersScroll}
        >
          {partnerLogos.map(partner => (
            <TouchableOpacity key={partner.id} style={styles.partnerLogoContainer}>
              <Image
                source={{ uri: partner.image }}
                style={styles.partnerLogo}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Footer Sections */}
      <View style={styles.sectionsContainer}>
        {footerSections.map((section, index) => (
          <View key={index} style={[styles.linkSection, { width: (SCREEN_WIDTH - 32 - 20) / 2 }]}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.links.map((link, linkIndex) => (
              <TouchableOpacity
                key={linkIndex}
                style={styles.linkButton}
                onPress={link.onPress}
              >
                <Text style={styles.linkText}>{link.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Social Media */}
      <View style={styles.socialMediaContainer}>
        <View style={styles.socialIconsContainer}>
          {socialLinks.map((social, index) => (
            <TouchableOpacity
              key={index}
              style={styles.socialButton}
              onPress={() => handleSocialPress(social.url)}
            >
              <Ionicons name={social.icon} size={16} color={theme.colors.text.primary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Powered By */}
      <View style={styles.poweredByContainer}>
        <Text style={styles.poweredByText}>შექმნილია Kutuku-ს მიერ</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[600],
    backgroundColor: theme.colors.gray[200],
  },
  logoContainer: {
    alignItems: 'flex-start',
  },
  separator: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[400],
  },
  partnersSection: {
    gap: 16,
  },
  partnersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  partnersScroll: {
    gap: 16,
    paddingRight: 16,
  },
  partnerLogoContainer: {
    width: 100,
    height: 50,
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
  },
  partnerLogo: {
    width: 80,
    height: 40,
  },
  sectionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 20,
    rowGap: 32,
  },
  linkSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
  },
  linkButton: {
    flexDirection: 'row',
    gap: 6,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    textDecorationLine: 'underline',
  },
  socialMediaContainer: {
    gap: 12,
  },
  socialIconsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  socialButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: theme.colors.gray[600],
    borderRadius: 8,
    backgroundColor: theme.colors.gray[300],
  },
  poweredByContainer: {
    alignItems: 'center',
  },
  poweredByText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
});
