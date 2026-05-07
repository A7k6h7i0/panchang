# panchang_flutter

Native Flutter client for temples, purohits, and pooja stores with API caching.

## Run

```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000
```

Use your deployed backend URL instead of `10.0.2.2` for physical devices.

## Cache behavior

- Cache store: `Hive` (`service_api_cache` box)
- Cached APIs: `temples`, `purohits`, `poojaStores`
- Cache expiry: `2 days`
- Strategy: show cached data first, then refresh in background

## Folder structure

- `lib/models` -> data models
- `lib/services` -> API + local cache services
- `lib/repositories` -> fetch/caching orchestration
- `lib/screens` -> UI screens
- `lib/widgets` -> reusable UI components
