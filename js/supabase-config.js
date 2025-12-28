/**
 * Supabase Configuration
 * 글로벌 리더보드를 위한 Supabase 설정
 */

const SUPABASE_CONFIG = {
    url: 'https://mnqtistonanssxsfwvml.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ucXRpc3RvbmFuc3N4c2Z3dm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTUzNzAsImV4cCI6MjA4MjQ3MTM3MH0.844LP3Xc518jmOukiiCZXOiOcT5nyuQIgS7WtFYznwM',
    enabled: true,
};

// 설정 검증
if (SUPABASE_CONFIG.url === 'https://YOUR-PROJECT-REF.supabase.co') {
    console.warn('[Supabase] Placeholder config detected. Update supabase-config.js');
    SUPABASE_CONFIG.enabled = false;
}
