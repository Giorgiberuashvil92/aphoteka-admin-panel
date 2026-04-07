import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

export type PaymentMethodIconName = ComponentProps<typeof Ionicons>['name'];

/**
 * აპში ყოველთვის ხელმისაწვდომი გადახდის ვარიანტები (სერვერზე gateway-ის გარეშე — კომენტარში ეწერება).
 * `enabled: false` — არ ჩანს სიაში (მაგ. მომავალში ჩასართავად).
 */
export type BuiltinPaymentMethodDef = {
  id: string;
  name: string;
  subtitle: string;
  icon: PaymentMethodIconName;
  enabled?: boolean;
};

export const BUILTIN_PAYMENT_METHODS: BuiltinPaymentMethodDef[] = [
  {
    id: 'cod',
    name: 'ნაღდი ანგარიშსწორება',
    subtitle: 'მიტანისას',
    icon: 'cash-outline',
  },
  {
    id: 'bog_online',
    name: 'ონლაინ გადახდა',
    subtitle: 'საქართველოს ბანკი (ბარათი / iBank)',
    icon: 'card-outline',
  },
  {
    id: 'bank_transfer',
    name: 'ბანკის გადარიცხვა',
    subtitle: 'დეტალები შეკვეთის შემდეგ',
    icon: 'business-outline',
    enabled: false,
  },
];

export const DEFAULT_PAYMENT_METHOD_ID =
  BUILTIN_PAYMENT_METHODS.find((m) => m.enabled !== false)?.id ?? 'cod';
