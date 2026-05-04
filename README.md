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

## 📋 API Endpoint'leri (67 adet)

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

### Annotations (`/annotations`)
| Metot | Yol | Açıklama | Yetki |
|-------|-----|----------|-------|
| `POST` | `/annotations` | Anotasyon / highlight oluştur | 🔒 JWT |
| `GET` | `/annotations/book/:bookId` | Kitaptaki anotasyonlar (kendi + public) | 🔒 JWT |
| `GET` | `/annotations/my` | Tüm anotasyonlarım | 🔒 JWT |
| `PUT` | `/annotations/:id` | Anotasyon güncelle | 🔒 Sahip |
| `DELETE` | `/annotations/:id` | Anotasyon sil | 🔒 Sahip |

### Reviews (`/reviews`)
| Metot | Yol | Açıklama | Yetki |
|-------|-----|----------|-------|
| `POST` | `/reviews` | Yorum yaz (kitap başına 1) | 🔒 JWT |
| `GET` | `/reviews/book/:bookId` | Kitap yorumları + puan dağılımı | Public |
| `GET` | `/reviews/my` | Tüm yorumlarım | 🔒 JWT |
| `PUT` | `/reviews/:id` | Yorum güncelle | 🔒 Sahip |
| `DELETE` | `/reviews/:id` | Yorum sil | 🔒 Sahip |
| `POST` | `/reviews/:id/like` | Yorum beğen | 🔒 JWT |

### Bookmarks (`/bookmarks`)
| Metot | Yol | Açıklama | Yetki |
|-------|-----|----------|-------|
| `POST` | `/bookmarks` | Yer imi oluştur | 🔒 JWT |
| `GET` | `/bookmarks` | Tüm yer imlerim | 🔒 JWT |
| `GET` | `/bookmarks/book/:bookId` | Kitaptaki yer imleri | 🔒 JWT |
| `DELETE` | `/bookmarks/:id` | Yer imi sil | 🔒 Sahip |
| `DELETE` | `/bookmarks/book/:bookId` | Kitaptaki tüm yer imlerini sil | 🔒 Sahip |
### Social (`/social`)
| Metot | Yol | Açıklama | Yetki |
|-------|-----|----------|-------|
| `POST` | `/social/follow/:userId` | Takip et | 🔒 JWT |
| `DELETE` | `/social/follow/:userId` | Takibi bırak | 🔒 JWT |
| `GET` | `/social/followers` | Takipçilerim | 🔒 JWT |
| `GET` | `/social/following` | Takip ettiklerim | 🔒 JWT |
| `GET` | `/social/followers/:userId` | Kullanıcının takipçileri | 🔒 JWT |
| `GET` | `/social/following/:userId` | Kullanıcının takip ettikleri | 🔒 JWT |
| `GET` | `/social/is-following/:userId` | Takip durumu kontrolü | 🔒 JWT |

### Notifications (`/notifications`)
| Metot | Yol | Açıklama | Yetki |
|-------|-----|----------|-------|
| `GET` | `/notifications` | Bildirimlerim | 🔒 JWT |
| `GET` | `/notifications/unread-count` | Okunmamış bildirim sayısı | 🔒 JWT |
| `PUT` | `/notifications/:id/read` | Okundu işaretle | 🔒 JWT |
| `PUT` | `/notifications/read-all` | Tümünü okundu yap | 🔒 JWT |
| `DELETE` | `/notifications/:id` | Bildirim sil | 🔒 JWT |

### Wishlist (`/wishlist`)
| Metot | Yol | Açıklama | Yetki |
|-------|-----|----------|-------|
| `POST` | `/wishlist/:bookId` | İstek listesine ekle | 🔒 JWT |
| `DELETE` | `/wishlist/:bookId` | İstek listesinden çıkar | 🔒 JWT |
| `GET` | `/wishlist` | İstek listem | 🔒 JWT |
| `GET` | `/wishlist/:bookId/check` | İstek listesinde mi? | 🔒 JWT |

### Users (`/users`) — Public
| Metot | Yol | Açıklama | Yetki |
|-------|-----|----------|-------|
| `GET` | `/users/:id` | Kullanıcı public profili (isFollowing desteği) | Public |
| `GET` | `/users/:id/reviews` | Kullanıcının public yorumları | Public |
| `GET` | `/users/:id/annotations` | Kullanıcının public anotasyonları | Public |
| `GET` | `/users/:id/shelf` | Kullanıcının okuduğu kitaplar | Public |

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
