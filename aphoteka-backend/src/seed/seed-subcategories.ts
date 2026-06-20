import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { CategorySchema } from '../categories/schemas/category.schema';

dotenv.config();

const SUBCATEGORIES_BY_PARENT: Record<string, string[]> = {
  მედიკამენტები: [
    'ალერგიის წამალი',
    'კუჭ-ნაწლავისთვის',
    'ტკივილგამაყუჩებელი',
    'სოკოს საწინააღმდეგო',
    'ნევროლოგია',
    'დერმატოლოგია',
    'ონკოლოგია',
    'ენდოკრინოლოგია',
    'გულ სისხლძარღვთა სისტემა',
    'ოტორინოლარინგოლოგია',
    'სამკურნალო მცენარეები',
    'ჰომეოპათიური წამლები',
    'პირველადი დახმარება',
    'ანტიბიოტიკები',
    'ანთების საწინააღმდეგო',
    'ვიტამინები და მინერალები',
    'ოფთalmოლოგiა',
    'პარაზიტების საწინააღმდეგო პრეპარატები',
    'სასუნთქი სისტემა',
    'გრიპი და გაციება',
    'ძვალ-სახსროვანი სისტემა',
    'საშარდე სისტემა',
    'ჰემატოლოგია',
  ],
  'კოსმეტიკა და პირადი ჰიგიენა': [
    'თმის მოვლა',
    'სახის მოვლა',
    'ტანის მოვლა',
    'ქალის ჰიგიენა',
    'დეოდორანტი',
    'თვალის მოვლა',
    'ფრჩხილის მოვლა',
    'რუჯი და მზისგან დაცვა',
    'საპარსი და სადეპილაციო საშუალებები',
    'ჰიგიენის წვრილმანი საშუალებები',
  ],
  'დედა და ბავშვი': [
    'ბავშვის კვება',
    'ორსულები და დედები',
    'სათამაშოები',
    'ბავშვის საწოლის',
    'ბავშვის ჰიგიენა',
    'მატყუარა',
    'საბავშვო ნივთები სახლისთვის',
    'ბავშვის პირის ღრუს მოვლა',
    'ბავშვის კვების აქსესუარები',
    'საბავშვო კოსმეტიკა',
    'ბავშვის ტრუსები',
    'ბავშვთა ჯანმრთელობა',
    'ტექნიკა ბავშვის მოვლისთვის',
    'საბავშვო ინვენტარი',
    'საბავშვო სარეცხი საშუალებები',
  ],
};

async function seedSubcategories() {
  const mongoUri =
    process.env.MONGODB_URI || 'mongodb://localhost:27017/aphoteka';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  const CategoryModel = mongoose.model('Category', CategorySchema);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const [parentName, subNames] of Object.entries(
    SUBCATEGORIES_BY_PARENT,
  )) {
    const parent = await CategoryModel.findOne({ name: parentName }).exec();
    if (!parent) {
      console.warn(`⚠️  Parent not found: ${parentName}`);
      continue;
    }

    console.log(`\n📂 ${parentName}`);

    for (let i = 0; i < subNames.length; i++) {
      const name = subNames[i];
      const existing = await CategoryModel.findOne({
        name,
        parentId: parent._id,
      }).exec();

      if (existing) {
        if (existing.sortOrder !== i + 1) {
          existing.sortOrder = i + 1;
          await existing.save();
          console.log(`  🔄 Updated sort: ${name}`);
          updated++;
        } else {
          console.log(`  ⏭️  Exists: ${name}`);
          skipped++;
        }
        continue;
      }

      await CategoryModel.create({
        name,
        parentId: parent._id,
        active: true,
        sortOrder: i + 1,
        icon: 'folder',
        color: '#F5F5F5',
      });
      console.log(`  🆕 Created: ${name}`);
      created++;
    }
  }

  console.log(
    `\n🎉 Done — created: ${created}, updated: ${updated}, skipped: ${skipped}`,
  );
  await mongoose.disconnect();
}

seedSubcategories().catch((err) => {
  console.error(err);
  process.exit(1);
});
