// Mock Orders Data for Development + API სტატუსების ეტიკეტები (Nest: pending | confirmed | shipped | delivered | cancelled)

export type OrderStatusUi =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface MockOrder {
  id: string;
  orderNumber: string;
  date: string;
  status: OrderStatusUi;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    phone: string;
  };
  paymentMethod: string;
  trackingNumber?: string;
}

export const MOCK_ORDERS: MockOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    date: '2024-11-15',
    status: 'delivered',
    items: [
      {
        id: '1',
        name: 'პარაცეტამოლი',
        quantity: 2,
        price: 4.50,
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
      },
      {
        id: '2',
        name: 'იბუპროფენი',
        quantity: 1,
        price: 6.50,
        image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400',
      },
    ],
    subtotal: 15.50,
    shipping: 5.00,
    total: 20.50,
    shippingAddress: {
      name: 'გიორგი გელაშვილი',
      address: 'ვაჟა-ფშაველას გამზ. 41',
      city: 'თბილისი, 0177',
      phone: '+995 555 123 456',
    },
    paymentMethod: 'ბარათით გადახდა',
    trackingNumber: 'TRK123456789',
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    date: '2024-11-18',
    status: 'shipped',
    items: [
      {
        id: '3',
        name: 'ვიტამინი C',
        quantity: 1,
        price: 12.00,
        image: 'https://images.unsplash.com/photo-1550572017-4814c5c7e6c4?w=400',
      },
    ],
    subtotal: 12.00,
    shipping: 5.00,
    total: 17.00,
    shippingAddress: {
      name: 'გიორგი გელაშვილი',
      address: 'ვაჟა-ფშაველას გამზ. 41',
      city: 'თბილისი, 0177',
      phone: '+995 555 123 456',
    },
    paymentMethod: 'ნაღდი ანგარიშსწორება',
    trackingNumber: 'TRK987654321',
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    date: '2024-11-20',
    status: 'processing',
    items: [
      {
        id: '4',
        name: 'ამოქსიცილინი',
        quantity: 1,
        price: 15.50,
        image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
      },
      {
        id: '8',
        name: 'ვიტამინი D3',
        quantity: 2,
        price: 14.50,
        image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
      },
    ],
    subtotal: 44.50,
    shipping: 5.00,
    total: 49.50,
    shippingAddress: {
      name: 'გიორგი გელაშვილი',
      address: 'ვაჟა-ფშაველას გამზ. 41',
      city: 'თბილისი, 0177',
      phone: '+995 555 123 456',
    },
    paymentMethod: 'ბარათით გადახდა',
  },
];

export const getOrderStatusText = (status: OrderStatusUi): string => {
  switch (status) {
    case 'pending':
      return 'მოლოდინში';
    case 'confirmed':
      return 'დადასტურებული';
    case 'processing':
      return 'მუშავდება';
    case 'shipped':
      return 'გზაშია';
    case 'delivered':
      return 'მიტანილია';
    case 'cancelled':
      return 'გაუქმებულია';
    default:
      return status;
  }
};

export const getOrderStatusColor = (status: OrderStatusUi): string => {
  switch (status) {
    case 'pending':
      return '#FFA500';
    case 'confirmed':
      return '#1976D2';
    case 'processing':
      return '#2196F3';
    case 'shipped':
      return '#9C27B0';
    case 'delivered':
      return '#4CAF50';
    case 'cancelled':
      return '#F44336';
    default:
      return '#757575';
  }
};
