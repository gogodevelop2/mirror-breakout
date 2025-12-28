/**
 * High Score Manager (Supabase 글로벌 리더보드)
 *
 * 아키텍처:
 * - Supabase = 단일 진실 공급원 (모든 점수 저장)
 * - localStorage = 캐시 전용 (빠른 UI 로딩)
 * - 오프라인 시 에러 메시지 표시
 */

class HighScoreManager {
    constructor() {
        this.cacheKey = 'mirrorBreakout_globalScoresCache';
        this.maxEntries = 10;

        // 글로벌 리더보드 상태
        this.globalScores = [];
        this.globalLoading = false;
        this.globalError = null;

        // 캐시 로드 (페이지 로드 시 즉시 표시용)
        this.loadCache();

        // 백그라운드에서 최신 데이터 가져오기
        this.fetchGlobalScores().catch(err => {
            console.warn('[HighScore] Initial fetch failed:', err.message);
            // 캐시된 데이터라도 표시
        });
    }

    // ==================== 캐시 관리 ====================

    /**
     * 캐시에서 점수 로드 (즉시 UI 표시용)
     */
    loadCache() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (cached) {
                this.globalScores = JSON.parse(cached);
                console.log(`[HighScore] Loaded ${this.globalScores.length} scores from cache`);
            }
        } catch (error) {
            console.warn('[HighScore] Failed to load cache:', error);
            this.globalScores = [];
        }
    }

    /**
     * 캐시에 점수 저장
     */
    saveCache() {
        try {
            localStorage.setItem(this.cacheKey, JSON.stringify(this.globalScores));
        } catch (error) {
            console.warn('[HighScore] Failed to save cache:', error);
        }
    }

    /**
     * 캐시 삭제
     */
    clearCache() {
        localStorage.removeItem(this.cacheKey);
        this.globalScores = [];
        console.log('[HighScore] Cache cleared');
    }

    // ==================== Supabase 연동 ====================

    /**
     * Supabase에서 최신 글로벌 점수 가져오기
     * @returns {Promise<Array>} 점수 배열
     */
    async fetchGlobalScores() {
        if (!Supabase.initialized) {
            this.globalError = 'Supabase not configured';
            throw new Error(this.globalError);
        }

        this.globalLoading = true;
        this.globalError = null;

        try {
            this.globalScores = await Supabase.fetchTopScores(this.maxEntries);
            this.saveCache(); // 캐시 업데이트
            console.log(`[HighScore] Global scores fetched: ${this.globalScores.length}`);
            return this.globalScores;

        } catch (error) {
            console.error('[HighScore] Failed to fetch global scores:', error);
            this.globalError = error.message;
            throw error; // 에러를 상위로 전파 (폴백 없음)

        } finally {
            this.globalLoading = false;
        }
    }

    /**
     * Supabase에 점수 제출
     * @param {string} name - 플레이어 이름 (3글자)
     * @param {number} score - 총점
     * @param {Object} breakdown - 점수 상세 정보
     * @returns {Promise<number>} 달성한 순위 (1-10, 또는 -1)
     */
    async submitScore(name, score, breakdown) {
        if (!Supabase.initialized) {
            this.globalError = '네트워크 연결이 필요합니다';
            throw new Error(this.globalError);
        }

        try {
            console.log('[HighScore] Submitting score to global leaderboard...');
            await Supabase.submitScore(name, score, breakdown);

            // 제출 후 최신 리더보드 가져오기
            await this.fetchGlobalScores();

            // 달성한 순위 반환
            const rank = this.getRank(score);
            console.log(`[HighScore] Score submitted successfully. Rank: ${rank}`);
            return rank;

        } catch (error) {
            console.error('[HighScore] Failed to submit score:', error);
            this.globalError = error.message;
            throw error; // 에러를 상위로 전파
        }
    }

    // ==================== 유틸리티 메서드 ====================

    /**
     * 점수가 하이스코어 테이블에 들어갈 자격이 있는지 확인
     * @param {number} score - 확인할 점수
     * @returns {boolean} true면 하이스코어
     */
    isHighScore(score) {
        // 리더보드가 10개 미만이면 무조건 high score
        if (this.globalScores.length < this.maxEntries) {
            return true;
        }
        // 10위 점수보다 높으면 high score
        return score > this.globalScores[this.globalScores.length - 1].score;
    }

    /**
     * 특정 점수의 순위 계산
     * @param {number} score - 확인할 점수
     * @returns {number} 순위 (1-10), 또는 -1 (순위 밖)
     */
    getRank(score) {
        let rank = 1;
        for (const entry of this.globalScores) {
            if (score >= entry.score) {
                return rank;
            }
            rank++;
        }
        // 10위 이내에 들어가면 순위 반환, 아니면 -1
        return rank <= this.maxEntries ? rank : -1;
    }

    /**
     * 현재 점수 목록 반환 (읽기 전용)
     * @returns {Array} 점수 배열
     */
    getScores() {
        return this.globalScores;
    }

    /**
     * Supabase 사용 가능 여부 확인
     * @returns {boolean} true면 사용 가능
     */
    isAvailable() {
        return Supabase.initialized;
    }

    /**
     * 로딩 중 여부
     * @returns {boolean} true면 로딩 중
     */
    isLoading() {
        return this.globalLoading;
    }

    /**
     * 에러 메시지 반환
     * @returns {string|null} 에러 메시지 또는 null
     */
    getError() {
        return this.globalError;
    }
}

// 전역 싱글톤 인스턴스
const HighScore = new HighScoreManager();
