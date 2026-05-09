# 📚 Satır Arası — Uygulama Planı

Bu belge, Satır Arası projesinin backend geliştirme sürecini ve tamamlanan/bekleyen görevleri takip eder.

## 🏁 Mevcut Durum Özeti
- **Kimlik Doğrulama:** Tamamlandı (JWT, Roles).
- **Sosyal Özellikler:** Tamamlandı (Takip, Bildirimler).
- **Depolama:** ✅ **MinIO (S3)** geçişi tamamlandı. Avatarlar ve kapaklar artık S3'te.
- **Veritabanı:** Prisma şeması hazır ve yayında.

## 🛠️ Aktif Görev: Kitap İşleme Hattı (Processing Pipeline)
Hedef: Yazarların yüklediği PDF/EPUB dosyalarını otomatik olarak bölümlere ayırıp okunabilir hale getirmek.

| Adım | Görev | Durum |
| :--- | :--- | :--- |
| 1 | `S3Service` Entegrasyonu (MinIO) | ✅ Tamamlandı |
| 2 | `POST /books/:id/upload` Endpoint'i (Kitap dosyası yükleme) | ✅ Tamamlandı |
| 3 | BullMQ Kuyruk Yapılandırması (`pdf-processing` queue) | ✅ Tamamlandı |
| 4 | PDF/EPUB Parser (Kitap içeriğini ayrıştırma) | ✅ Tamamlandı |
| 5 | Worker Geliştirme (Bölümleri DB'ye kaydetme & Status güncelleme) | ✅ Tamamlandı |

## 📅 Gelecek Planlar
- [ ] **Yazar Dashboard:** Detaylı istatistik ve analiz API'ları.
- [ ] **Arama Motoru:** Kitap ve yazar arama için PostgreSQL Full Text Search veya Meilisearch.
- [ ] **WebSocket (Jam):** Gerçek zamanlı etkileşim modülü.
- [ ] **iOS Client Entegrasyonu:** Mobil uygulama için API optimizasyonu.

---
*Son Güncelleme: 2026-05-09*
