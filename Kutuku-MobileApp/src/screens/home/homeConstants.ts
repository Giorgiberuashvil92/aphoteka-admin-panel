/** მთავარი გვერდის ჰერო — შეგიძლია მოგვიანებით API/CMS */
export const HOME_HERO_SLIDES = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
    title: 'თქვენი ჯანმრთელობა ჩვენი პრიორიტეტია',
    description: 'ხარისხიანი მედიკამენტები და პროფესიონალი სერვისი',
    buttonText: 'მეტის ნახვა',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800',
    title: '24/7 მიწოდება',
    description: 'უფასო მიწოდება 50₾-ზე მეტი შეძენისას',
    buttonText: 'შეკვეთა',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
    title: 'ფარმაცევტის კონსულტაცია',
    description: 'პროფესიონალი დახმარება ყოველ დღე',
    buttonText: 'კონსულტაცია',
  },
] as const;

export const HOME_ACTIVE_SALES_DEMO = [
  {
    id: '1',
    title: 'ზამთრის მეგა გაყიდვები',
    description: 'დაზოგეთ 50%-მდე ყველა ვიტამინზე და დანამატზე',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    title: 'ახალი წლის აქცია',
    description: 'სპეციალური ფასები კოსმეტიკურ პროდუქტებზე',
    image: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=800',
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  },
];
