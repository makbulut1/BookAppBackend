import { PrismaClient, BookStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Temizlik: Önce mevcut kitapları silelim (İsteğe bağlı, temiz başlangıç için iyi)
    await prisma.annotation.deleteMany();
    await prisma.userReview.deleteMany();
    await prisma.book.deleteMany();

    const books = [
        {
            title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
            author: 'Robert C. Martin',
            coverImage: 'https://m.media-amazon.com/images/I/41xShlnTZTL._SX218_BO1,204,203,200_QL40_FMwebp_.jpg',
            price: '$34.99',
            category: 'Software Engineering',
            pdfUrl: 'https://example.com/clean-code.pdf',
            pageCount: 464,
            status: BookStatus.READY,
            description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
            coverColor: '#5a1313',
        },
        {
            title: 'Dune',
            author: 'Frank Herbert',
            coverImage: 'https://m.media-amazon.com/images/I/41fdREpCGuL._SX218_BO1,204,203,200_QL40_FMwebp_.jpg',
            price: '$18.00',
            category: 'Science Fiction',
            pdfUrl: 'https://example.com/dune.pdf',
            pageCount: 688,
            status: BookStatus.READY,
            description: 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the "spice" melange.',
            coverColor: '#d69e45',
        },
        {
            title: 'Atomic Habits',
            author: 'James Clear',
            coverImage: 'https://m.media-amazon.com/images/I/513Y5o-DYtL._SX218_BO1,204,203,200_QL40_FMwebp_.jpg',
            price: '$14.99',
            category: 'Self-Help',
            pdfUrl: 'https://example.com/atomic-habits.pdf',
            pageCount: 320,
            status: BookStatus.READY,
            description: 'No matter your goals, Atomic Habits offers a proven framework for improving--every day.',
            coverColor: '#e0c090',
        },
        {
            title: 'The Pragmatic Programmer',
            author: 'Andrew Hunt, David Thomas',
            coverImage: 'https://m.media-amazon.com/images/I/51A8l+FxX4L._SX218_BO1,204,203,200_QL40_FMwebp_.jpg',
            price: '$45.00',
            category: 'Programming',
            pdfUrl: 'https://example.com/pragmatic-programmer.pdf',
            pageCount: 352,
            status: BookStatus.PROCESSING,
            description: 'The Pragmatic Programmer is one of those rare tech books you’ll read, re-read, and read again over the years.',
            coverColor: '#2c3e50',
        }
    ];

    for (const book of books) {
        // Modelde description alanı olmadığı için description'ı metadata içine koyalım veya yoksayalım.
        // Şemada description yok ama metadata Json alanı var.
        const { description, ...bookData } = book;

        await prisma.book.create({
            data: {
                ...bookData,
                metadata: { description },
            },
        });
    }

    console.log('✅ Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
