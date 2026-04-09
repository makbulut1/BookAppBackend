# BookApp Backend

Endüstriyel seviye, ölçeklenebilir ve profesyonel BookApp Backend sistemi.

## Mimari Özellikler
 
- **NestJS**: Modüler ve kurumsal TypeScript framework.
- **PostgreSQL**: İlişkisel veri yönetimi için.
- **Redis & BullMQ**: PDF işleme gibi ağır işlemleri arka planda yönetmek için Job Queue sistemi.
- **Prisma ORM**: Tip güvenli veritabanı erişimi (v7+).
- **Swagger**: API dökümantasyonu (`/api` altında).
- **CI/CD**: GitHub Actions ile otomatik test ve build süreçleri.
- **Docker**: Tüm altyapıyı tek komutla ayağa kaldırma.

## Başlangıç

### Gereksinimler
- Node.js v18+
- Docker & Docker Compose

### Kurulum
1. `backend` klasörüne girin: `cd backend`
2. Bağımlılıkları yükleyin: `npm install`
3. Altyapıyı ayağa kaldırın: `docker-compose up -d`
4. Veritabanı tablolarını oluşturun: `npx prisma migrate dev --name init`

### Uygulamayı Çalıştırma
```bash
npm run start:de
```
API dökümantasyonuna [http://localhost:3000/api](http://localhost:3000/api) adresinden ulaşabilirsiniz.

## PDF İşleme Akışı
Uygulamada bir kitap oluşturulduğunda (`POST /books`), eğer bir `pdfUrl` verilmişse backend otomatik olarak:
1. Kaydı veritabanına `UPLOADING` statusuyla ekler.
2. Redis üzerinden bir iş (`process-pdf`) oluşturur.
3. `PDFProcessor` worker'ı bu işi alır, PDF'i indirir ve içeriğini parçalar.
4. İşlem bittiğinde kitabın durumu `READY` olarak güncellenir.

## Ortamlar (Environments)
- `.env`: Lokal geliştirme.
- GitHub Actions: Test ve Build doğrulaması.
- Gelecek adım: AWS/GCP deployment konfigürasyonları.
