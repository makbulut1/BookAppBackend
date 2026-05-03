import { PrismaClient, BookStatus, BookFormat, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Cleanup ─────────────────────────────────────
  console.log('🧹 Cleaning existing data...');
  await prisma.notification.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.readingSession.deleteMany();
  await prisma.readingProgress.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.annotation.deleteMany();
  await prisma.userReview.deleteMany();
  await prisma.tagsOnBooks.deleteMany();
  await prisma.categoriesOnBooks.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.book.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.author.deleteMany();
  await prisma.user.deleteMany();

  // ─── Users ──────────────────────────────────────
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 12);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@satirarasi.com',
      password: hashedPassword,
      name: 'Admin',
      displayName: 'admin',
      role: UserRole.ADMIN,
      isVerified: true,
    },
  });

  const authorUser1 = await prisma.user.create({
    data: {
      email: 'orhan@satirarasi.com',
      password: hashedPassword,
      name: 'Orhan Pamuk',
      displayName: 'orhanpamuk',
      role: UserRole.AUTHOR,
      isVerified: true,
      bio: 'Nobel ödüllü Türk romancı ve edebiyatçı.',
    },
  });

  const authorUser2 = await prisma.user.create({
    data: {
      email: 'elif@satirarasi.com',
      password: hashedPassword,
      name: 'Elif Şafak',
      displayName: 'elifsafak',
      role: UserRole.AUTHOR,
      isVerified: true,
      bio: 'Uluslararası alanda tanınan Türk yazar.',
    },
  });

  const readerUser = await prisma.user.create({
    data: {
      email: 'okuyucu@satirarasi.com',
      password: hashedPassword,
      name: 'Mehmet Eren',
      displayName: 'mehmeteren',
      role: UserRole.READER,
      bio: 'Kitap okumayı seven bir yazılımcı.',
    },
  });

  // ─── Authors ─────────────────────────────────────
  console.log('✍️ Creating author profiles...');
  const author1 = await prisma.author.create({
    data: {
      userId: authorUser1.id,
      penName: 'Orhan Pamuk',
      biography: 'Nobel Edebiyat Ödülü sahibi Türk romancı. İstanbul, Masumiyet Müzesi ve Benim Adım Kırmızı gibi eserleriyle tanınır.',
      isVerified: true,
      socialLinks: {
        twitter: '@oraborhan',
        website: 'https://orhanpamuk.com',
      },
    },
  });

  const author2 = await prisma.author.create({
    data: {
      userId: authorUser2.id,
      penName: 'Elif Şafak',
      biography: 'Uluslararası bestseller yazar. Aşk, Baba ve Piç, Havva\'nın Üç Kızı gibi eserleriyle tanınır.',
      isVerified: true,
      socialLinks: {
        twitter: '@Elif_Safak',
        instagram: '@elifsafak',
      },
    },
  });

  // ─── Categories ──────────────────────────────────
  console.log('📂 Creating categories...');
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: 'Roman', slug: 'roman', description: 'Kurgu romanlar' },
    }),
    prisma.category.create({
      data: { name: 'Bilim Kurgu', slug: 'bilim-kurgu', description: 'Bilim kurgu ve fantastik' },
    }),
    prisma.category.create({
      data: { name: 'Kişisel Gelişim', slug: 'kisisel-gelisim', description: 'Kişisel gelişim ve motivasyon' },
    }),
    prisma.category.create({
      data: { name: 'Tarih', slug: 'tarih', description: 'Tarihi eserler' },
    }),
    prisma.category.create({
      data: { name: 'Felsefe', slug: 'felsefe', description: 'Felsefe ve düşünce' },
    }),
    prisma.category.create({
      data: { name: 'Yazılım', slug: 'yazilim', description: 'Programlama ve teknoloji' },
    }),
    prisma.category.create({
      data: { name: 'Klasik', slug: 'klasik', description: 'Klasik edebiyat eserleri' },
    }),
    prisma.category.create({
      data: { name: 'Şiir', slug: 'siir', description: 'Şiir kitapları' },
    }),
  ]);

  const [roman, bilimKurgu, kisiselGelisim, tarih, felsefe, yazilim, klasik, siir] = categories;

  // ─── Tags ────────────────────────────────────────
  console.log('🏷️ Creating tags...');
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'Bestseller', slug: 'bestseller' } }),
    prisma.tag.create({ data: { name: 'Nobel Ödüllü', slug: 'nobel-odullu' } }),
    prisma.tag.create({ data: { name: 'Türk Edebiyatı', slug: 'turk-edebiyati' } }),
    prisma.tag.create({ data: { name: 'Dünya Klasikleri', slug: 'dunya-klasikleri' } }),
    prisma.tag.create({ data: { name: 'Çok Okunan', slug: 'cok-okunan' } }),
  ]);

  const [bestseller, nobelOdullu, turkEdebiyati, dunyaKlasikleri, cokOkunan] = tags;

  // ─── Books ───────────────────────────────────────
  console.log('📚 Creating books...');

  const book1 = await prisma.book.create({
    data: {
      title: 'Benim Adım Kırmızı',
      slug: 'benim-adim-kirmizi',
      description: '16. yüzyıl İstanbul\'unda geçen, Osmanlı minyatür sanatçılarının hikâyesi. Bir cinayet gizemi etrafında örülen bu roman, Doğu ve Batı sanat anlayışlarının çatışmasını konu alır.',
      coverColor: '#8B0000',
      language: 'tr',
      price: 45.00,
      format: BookFormat.EPUB,
      pageCount: 472,
      wordCount: 185000,
      status: BookStatus.PUBLISHED,
      publishedAt: new Date('2024-01-15'),
      authorId: author1.id,
      metadata: {
        originalTitle: 'Benim Adım Kırmızı',
        firstPublished: 1998,
        awards: ['IMPAC Dublin Edebiyat Ödülü', 'Prix du Meilleur Livre Étranger'],
      },
    },
  });

  const book2 = await prisma.book.create({
    data: {
      title: 'İstanbul: Hatıralar ve Şehir',
      slug: 'istanbul-hatiralar-ve-sehir',
      description: 'Orhan Pamuk\'un İstanbul\'a adanmış otobiyografik eseri. Şehrin hüzünlü güzelliğini ve yazarın çocukluk anılarını bir arada sunar.',
      coverColor: '#4A4A4A',
      language: 'tr',
      price: 55.00,
      format: BookFormat.EPUB,
      pageCount: 380,
      wordCount: 120000,
      status: BookStatus.PUBLISHED,
      publishedAt: new Date('2024-03-20'),
      authorId: author1.id,
    },
  });

  const book3 = await prisma.book.create({
    data: {
      title: 'Aşk',
      slug: 'ask',
      description: 'Ella Rubinstein\'ın hayatı, Mevlâna ve Şems-i Tebrizi\'nin hikâyesiyle iç içe geçer. Aşkın dönüştürücü gücünü anlatan çoksatan roman.',
      coverColor: '#DC143C',
      language: 'tr',
      price: 39.99,
      format: BookFormat.EPUB,
      pageCount: 432,
      wordCount: 165000,
      status: BookStatus.PUBLISHED,
      publishedAt: new Date('2024-02-10'),
      authorId: author2.id,
    },
  });

  const book4 = await prisma.book.create({
    data: {
      title: 'Havva\'nın Üç Kızı',
      slug: 'havvanin-uc-kizi',
      description: 'İstanbul, Londra ve Beyrut\'ta geçen, üç kuşak kadının hikâyesini anlatan güçlü bir roman.',
      coverColor: '#006400',
      language: 'tr',
      price: 42.00,
      format: BookFormat.EPUB,
      pageCount: 400,
      wordCount: 155000,
      status: BookStatus.PUBLISHED,
      publishedAt: new Date('2024-06-01'),
      authorId: author2.id,
    },
  });

  const book5 = await prisma.book.create({
    data: {
      title: 'Masumiyet Müzesi',
      slug: 'masumiyet-muzesi',
      description: 'Kemal\'in Füsun\'a olan büyük aşkının hikâyesi. 1970\'lerin İstanbul\'unda geçen, tutkulu ve trajik bir aşk romanı.',
      coverColor: '#FFD700',
      language: 'tr',
      isFree: true,
      format: BookFormat.EPUB,
      pageCount: 590,
      wordCount: 210000,
      status: BookStatus.PUBLISHED,
      publishedAt: new Date('2024-04-15'),
      authorId: author1.id,
    },
  });

  // Taslak kitap (author dashboard test için)
  const book6 = await prisma.book.create({
    data: {
      title: 'Yeni Projeler (Taslak)',
      slug: 'yeni-projeler-taslak',
      description: 'Henüz tamamlanmamış bir eser.',
      authorId: author2.id,
      status: BookStatus.DRAFT,
    },
  });

  // ─── Book-Category Relations ──────────────────────
  console.log('🔗 Linking categories...');
  await prisma.categoriesOnBooks.createMany({
    data: [
      { bookId: book1.id, categoryId: roman.id },
      { bookId: book1.id, categoryId: tarih.id },
      { bookId: book2.id, categoryId: tarih.id },
      { bookId: book3.id, categoryId: roman.id },
      { bookId: book3.id, categoryId: felsefe.id },
      { bookId: book4.id, categoryId: roman.id },
      { bookId: book5.id, categoryId: roman.id },
      { bookId: book5.id, categoryId: klasik.id },
    ],
  });

  // ─── Book-Tag Relations ──────────────────────────
  console.log('🏷️ Linking tags...');
  await prisma.tagsOnBooks.createMany({
    data: [
      { bookId: book1.id, tagId: nobelOdullu.id },
      { bookId: book1.id, tagId: turkEdebiyati.id },
      { bookId: book1.id, tagId: bestseller.id },
      { bookId: book2.id, tagId: nobelOdullu.id },
      { bookId: book2.id, tagId: turkEdebiyati.id },
      { bookId: book3.id, tagId: bestseller.id },
      { bookId: book3.id, tagId: cokOkunan.id },
      { bookId: book4.id, tagId: bestseller.id },
      { bookId: book5.id, tagId: nobelOdullu.id },
      { bookId: book5.id, tagId: dunyaKlasikleri.id },
    ],
  });

  // ─── Chapters (sample for book1) ──────────────────
  console.log('📖 Creating sample chapters...');
  await prisma.chapter.createMany({
    data: [
      {
        bookId: book1.id,
        title: 'Benim Adım Kırmızı',
        orderIndex: 1,
        content: 'Şimdi bir ölüyüm, bir ceset, bir kuyunun dibinde. Son nefesimi çoktan verdim, kalbim durdu. Ama katilimin beni neden öldürdüğünü bilmiyoruz benim zavallı amcam da, güzel Şeküre de. Beni tanıyorsanız bilirsiniz, ben uysal ve yumuşakbaşlı biriydim, herkesle iyi geçinirdim.',
        wordCount: 2500,
      },
      {
        bookId: book1.id,
        title: 'Benim Adım Şeküre',
        orderIndex: 2,
        content: 'Babam, annemi kaybettikten sonra yıllarca yalnız yaşadı. Sonunda bir gün bize geldi ve dedi ki: "Şeküre, senin için iyi bir koca bulacağım." Ama ben zaten gönlümü Kara\'ya kaptırmıştım. O güzel gözleri, o nazik bakışları...',
        wordCount: 2800,
      },
      {
        bookId: book1.id,
        title: 'Benim Adım Kara',
        orderIndex: 3,
        content: 'On iki yıl sonra İstanbul\'a döndüğümde, şehri tanıyamadım. Sokaklar daralmış, evler üst üste yığılmıştı. Ama Şeküre\'nin güzelliği hiç değişmemişti. Onu ilk gördüğüm an, kalbim yerinden fırladı.',
        wordCount: 3200,
      },
    ],
  });

  // ─── Reviews ─────────────────────────────────────
  console.log('⭐ Creating reviews...');
  await prisma.userReview.createMany({
    data: [
      {
        bookId: book1.id,
        userId: readerUser.id,
        rating: 5,
        title: 'Başyapıt',
        comment: 'Osmanlı minyatür sanatının derinliklerini keşfettiren muhteşem bir eser. Pamuk\'un en iyi romanı diyebilirim.',
        likes: 42,
      },
      {
        bookId: book3.id,
        userId: readerUser.id,
        rating: 4,
        title: 'Güzel ama uzun',
        comment: 'Mevlâna ve Şems hikâyesi çok etkileyici anlatılmış. Bazı bölümler biraz uzun ama genel olarak çok keyifli.',
        likes: 28,
      },
      {
        bookId: book5.id,
        userId: readerUser.id,
        rating: 5,
        title: 'Yürek burkan bir aşk',
        comment: 'Kemal\'in Füsun\'a olan saplantılı aşkı o kadar gerçekçi anlatılmış ki, insan kendini İstanbul sokaklarında hissediyor.',
        likes: 56,
      },
    ],
  });

  // ─── Reading Progress ────────────────────────────
  console.log('📊 Creating reading progress...');
  await prisma.readingProgress.createMany({
    data: [
      {
        userId: readerUser.id,
        bookId: book1.id,
        currentPage: 150,
        progressPercent: 31.8,
        lastReadAt: new Date(),
      },
      {
        userId: readerUser.id,
        bookId: book3.id,
        currentPage: 432,
        progressPercent: 100,
        lastReadAt: new Date(Date.now() - 86400000 * 7),
        finishedAt: new Date(Date.now() - 86400000 * 7),
      },
      {
        userId: readerUser.id,
        bookId: book5.id,
        currentPage: 45,
        progressPercent: 7.6,
        lastReadAt: new Date(Date.now() - 86400000 * 2),
      },
    ],
  });

  // ─── Follows ─────────────────────────────────────
  console.log('👥 Creating follow relationships...');
  await prisma.follow.createMany({
    data: [
      { followerId: readerUser.id, followingId: authorUser1.id },
      { followerId: readerUser.id, followingId: authorUser2.id },
    ],
  });

  // ─── Bookmarks ──────────────────────────────────
  console.log('🔖 Creating bookmarks...');
  await prisma.bookmark.createMany({
    data: [
      {
        userId: readerUser.id,
        bookId: book1.id,
        pageNumber: 47,
        title: 'Güzel sahne',
      },
      {
        userId: readerUser.id,
        bookId: book1.id,
        pageNumber: 123,
        title: 'Önemli bölüm',
      },
    ],
  });

  console.log('');
  console.log('✅ Seeding completed!');
  console.log('');
  console.log('📋 Test hesapları:');
  console.log('   Admin:    admin@satirarasi.com    / password123');
  console.log('   Yazar 1:  orhan@satirarasi.com    / password123');
  console.log('   Yazar 2:  elif@satirarasi.com     / password123');
  console.log('   Okuyucu:  okuyucu@satirarasi.com  / password123');
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
