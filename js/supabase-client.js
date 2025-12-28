/**
 * Supabase API Client
 * Supabase REST API를 사용하여 글로벌 리더보드 관리
 */

class SupabaseClient {
    constructor() {
        this.SUPABASE_URL = SUPABASE_CONFIG.url;
        this.SUPABASE_ANON_KEY = SUPABASE_CONFIG.anonKey;
        this.initialized = SUPABASE_CONFIG.enabled && this.validateConfig();

        // 캐시 및 쿨다운 설정
        this.cachedScores = null;
        this.lastFetchTime = 0;
        this.FETCH_COOLDOWN = 3000; // 3초 (무료 티어 보호)

        if (this.initialized) {
            console.log('[Supabase] Client initialized successfully');
        } else {
            console.warn('[Supabase] Client not initialized - check configuration');
        }
    }

    validateConfig() {
        const isValid = this.SUPABASE_URL.includes('supabase.co')
            && this.SUPABASE_ANON_KEY.length > 20;

        if (!isValid) {
            console.error('[Supabase] Invalid configuration');
        }

        return isValid;
    }

    /**
     * TOP N 점수 조회
     * @param {number} limit - 조회할 점수 개수 (기본: 10)
     * @returns {Promise<Array>} 점수 배열
     */
    async fetchTopScores(limit = 10) {
        if (!this.initialized) {
            throw new Error('Supabase not configured');
        }

        // 쿨다운 체크 (너무 자주 호출 방지)
        const now = Date.now();
        if (now - this.lastFetchTime < this.FETCH_COOLDOWN && this.cachedScores) {
            console.log('[Supabase] Using cached scores (cooldown active)');
            return this.cachedScores;
        }

        this.lastFetchTime = now;

        const url = `${this.SUPABASE_URL}/rest/v1/high_scores?select=*&order=score.desc,created_at.desc&limit=${limit}`;

        try {
            const response = await fetch(url, {
                headers: {
                    'apikey': this.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
                }
            });

            if (!response.ok) {
                throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Supabase 형식 → 로컬 형식 변환
            const scores = data.map(entry => ({
                name: entry.player_name,
                score: entry.score,
                breakdown: {
                    total: entry.score,
                    base: entry.base_score,
                    scoreDiffBonus: entry.score_diff_bonus,
                    timeBonus: entry.time_bonus,
                    scoreDiff: entry.score_diff,
                    gameTime: entry.game_time
                },
                date: entry.created_at
            }));

            this.cachedScores = scores;
            console.log(`[Supabase] Fetched ${scores.length} scores`);

            return scores;

        } catch (error) {
            console.error('[Supabase] Failed to fetch scores:', error);
            throw error;
        }
    }

    /**
     * 점수 제출
     * @param {string} name - 플레이어 이름 (3글자)
     * @param {number} score - 총점
     * @param {Object} breakdown - 점수 상세 정보
     * @returns {Promise<Object>} 제출된 점수 데이터
     */
    async submitScore(name, score, breakdown) {
        if (!this.initialized) {
            throw new Error('Supabase not configured');
        }

        const url = `${this.SUPABASE_URL}/rest/v1/high_scores`;

        // 이름 정규화 (대문자, 3글자, 부족하면 _ 로 채움)
        const normalizedName = name.toUpperCase().substring(0, 3).padEnd(3, '_');

        const payload = {
            player_name: normalizedName,
            score: score,
            base_score: breakdown.base || 0,
            score_diff_bonus: breakdown.scoreDiffBonus || 0,
            time_bonus: breakdown.timeBonus || 0,
            score_diff: breakdown.scoreDiff || 0,
            game_time: breakdown.gameTime || 0
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'apikey': this.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Supabase] Submit error:', errorText);
                throw new Error(`Submit failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('[Supabase] Score submitted successfully:', normalizedName, score);

            // 캐시 무효화 (다음 fetch에서 최신 데이터 가져오도록)
            this.cachedScores = null;
            this.lastFetchTime = 0;

            return result;

        } catch (error) {
            console.error('[Supabase] Failed to submit score:', error);
            throw error;
        }
    }
}

// 전역 인스턴스 생성
const Supabase = new SupabaseClient();
