# 📚 Satır Arası — Backend API

Sosyal kitap okuma platformu için NestJS tabanlı, ölçeklenebilir backend sistemi.

## 🏗️ Mimari

| Teknoloji | Kullanım |
|-----------|----------|
| **NestJS** | Modüler TypeScript framework |
| **PostgreSQL** | İlişkisel veritabanı |
| **Prisma ORM** | Tip güvenli veritabanı erişimi |
| **Redis & BullMQ** | Arka plan iş kuyrukları (PDF/EPUB işleme) |
| **Passport JWT** | Token tabanlı kimlik doğrulama |
| **MinIO** | S3 uyumlu dosya depolama |
| **Swagger** | Otomatik API dokümantasyonu |
| **Docker Compose** | Altyapıyı tek komutla ayağa kaldırma |

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js v18+
- Docker & Docker Compose

### Kurulum

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Altyapıyı başlat (PostgreSQL, Redis, MinIO)
docker compose up -d

# 3. Veritabanı şemasını uygula
npx prisma db push

# 4. Test verilerini yükle
npx ts-node prisma/seed.ts

# 5. Sunucuyu başlat
npm run start:dev
```

- **API Swagger UI**: http://localhost:3000/api
- **API JSON Schema**: http://localhost:3000/api-json

### Test Hesapları

| Rol | E-posta | Şifre |
|-----|---------|-------|
| Admin | `admin@satirarasi.com` | `password123` |
| Yazar | `orhan@satirarasi.com` | `password123` |
| Yazar | `elif@satirarasi.com` | `password123` |
| Okuyucu | `okuyucu@satirarasi.com` | `password123` |

## 📋 API Endpoint'leri (31 adet)

### Auth (`/auth`)
| Metot | Yol | Açıklama | Yetki |
|-------|-----|----------|-------|
| `POST` | `/auth/register` | Yeni kullanıcı kaydı | Public |
| `POST` | `/auth/login` | Giriş → JWT token | Public |
| `GET` | `/auth/profile` | Kullanıcı profili | 🔒 JWT |
| `PUT` | `/auth/profile` | Profil güncelle | 🔒 JWT |
| `POST` | `/auth/become-author` | Yazar rolüne yükselt | 🔒 JWT |

### Books (`/books`)
| Metot | Yol | Açıklama | Yetki |
|-------|-----|----------|-------|
| `POST` | `/books` | Kitap oluştur | 🔒 Author/Admin |
| `GET` | `/books` | Kitap listesi (sayfalama, arama, filtre) | Public |
| `GET` | `/books/my-books` | Kendi kitaplarım | 🔒 Author |
| `GET` | `/books/:identifier` | Kitap detayı (ID veya slug) | Public |
| `PUT` | `/books/:id` | Kitap güncelle | 🔒 Sahip/Admin |
| `DELETE` | `/books/:id` | Kitap sil | 🔒 Sahip/Admin |
| `POST` | `/books/:bookId/chapters` | Bölüm ekle | 🔒 Sahip |
| `GET` | `/books/:bookId/chapters` | İçindekiler listesi | Public |
| `GET` | `/books/:bookId/chapters/:chapterId` | Bölüm oku | Public |

### Authors (`/authors`)
| Metot | Yol | Açıklama | Yetki |
|-------|-----|----------|-------|
| `GET` | `/authors` | Yazar listesi | Public |
| `GET` | `/authors/:id` | Yazar detayı + kitapları | Public |
| `GET` | `/authors/me/profile` | Kendi yazar profilim | 🔒 Author |
| `GET` | `/authors/me/dashboard` | Yazar dashboard (istatistikler) | 🔒 Author |
| `PUT` | `/authors/:id` | Yazar profili güncelle | 🔒 Sahip |

### Categories (`/categories`)
| Metot | Yol | Açıklama | Yetki |
|-------|-----|----------|-------|
| `GET` | `/categories` | Kategoriler (ağaç yapılı) | Public |
| `GET` | `/categories/:idOrSlug` | Kategori detayı + kitapları | Public |
| `POST` | `/categories` | Kategori oluştur | 🔒 Admin |
| `DELETE` | `/categories/:id` | Kategori sil | 🔒 Admin |

### Reading (`/reading`)
| Metot | Yol | Açıklama | Yetki |
|-------|-----|----------|-------|
| `POST` | `/reading/progress` | Okuma ilerlemesi kaydet | 🔒 JWT |
| `GET` | `/reading/progress/:bookId` | Kitap ilerlemesi | 🔒 JWT |
| `GET` | `/reading/currently-reading` | Şu an okunanlar | 🔒 JWT |
| `GET` | `/reading/history` | Okuma geçmişi | 🔒 JWT |
| `GET` | `/reading/stats` | Okuma istatistikleri | 🔒 JWT |
| `POST` | `/reading/sessions/start` | Oturum başlat | 🔒 JWT |
| `PUT` | `/reading/sessions/:id/end` | Oturum bitir | 🔒 JWT |

## 🗃️ Veritabanı Şeması

15+ model ile kapsamlı veri yapısı:

```
User ─── Author ─── Book ─── Chapter
  │         │         │         │
  │         │         ├── Category (M:N)
  │         │         ├── Tag (M:N)
  │         │         ├── UserReview
  │         │         ├── Annotation
  │         │         ├── Bookmark
  │         │         ├── ReadingProgress
  │         │         └── ReadingSession
  │         │
  │         └── Publisher
  │
  ├── Follow (self-referential)
  └── Notification
```

**Roller**: `READER` | `AUTHOR` | `ADMIN`
**Kitap Durumları**: `DRAFT` → `UPLOADING` → `PROCESSING` → `REVIEW` → `PUBLISHED` / `FAILED` / `ARCHIVED`

## 📂 Proje Yapısı

```
src/
├── auth/                    # Kimlik doğrulama
│   ├── strategies/          #   JWT Passport strategy
│   ├── guards/              #   Auth & Role guards
│   ├── decorators/          #   @CurrentUser, @Roles, @Public
│   └── dto/                 #   Register, Login, UpdateProfile
├── modules/
│   ├── books/               # Kitap & bölüm yönetimi
│   │   ├── dto/             #   Create/Update Book, CreateChapter
│   │   └── processors/     #   PDF/EPUB BullMQ worker
│   ├── authors/             # Yazar profilleri & dashboard
│   ├── categories/          # Kategori & etiket sistemi
│   └── reading/             # Okuma ilerlemesi & oturumlar
├── jam/                     # WebSocket gateway (real-time)
├── prisma/                  # Prisma service & module
└── app.module.ts            # Ana modül
```

## ⚙️ Ortam Değişkenleri

`.env` dosyasından yüklenir:

```env
DATABASE_URL=postgresql://admin:password@localhost:5432/bookapp?schema=public
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=super-secret-key-change-it
JWT_EXPIRES_IN=7d
PORT=3000
```

## 🔄 Kitap İşleme Akışı

1. Yazar `POST /books` ile kitap oluşturur (fileUrl ile)
2. Kitap `PROCESSING` durumuna geçer
3. BullMQ worker dosyayı indirir ve ayrıştırır (PDF/EPUB)
4. Her sayfa bir `Chapter` olarak veritabanına yazılır
5. Kitap `PUBLISHED` durumuna geçer

## 📝 Lisans

MIT — [LICENSE](LICENSE) dosyasına bakınız.
