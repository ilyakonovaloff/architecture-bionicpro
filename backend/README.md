# PHP Backend API

## Endpoints

### GET /reports
Получить список отчётов с пагинацией.

**Query параметры:**
- `page` (опционально) - номер страницы (по умолчанию: 1)
- `limit` (опционально) - количество записей на странице (по умолчанию: 10)

**Пример запроса:**
```bash
curl http://localhost:8000/reports?page=1&limit=5
```

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Отчёт №1",
      "description": "Описание отчёта №1",
      "created_at": "2024-01-15 10:30:00",
      "status": "active",
      "author": "Иванов И.И.",
      "metrics": {
        "total_users": 5000,
        "active_users": 2500,
        "revenue": 150000,
        "growth_rate": 2.5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 10,
    "total_pages": 2
  }
}
```

## Запуск

```bash
docker-compose up backend
```

API будет доступен по адресу: http://localhost:8000 