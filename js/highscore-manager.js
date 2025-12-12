// js/highscore-manager.js
// High Score Management System (Arcade Style)

class HighScoreManager {
    constructor() {
        this.storageKey = 'mirrorBreakout_highScores';
        this.maxEntries = 10;
        this.scores = this.loadScores();
    }

    /**
     * Load high scores from localStorage
     * @returns {Array} Array of score entries
     */
    loadScores() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const scores = JSON.parse(stored);
                // Validate format
                if (Array.isArray(scores)) {
                    return scores;
                }
            }
        } catch (error) {
            console.error('[HighScore] Failed to load scores:', error);
        }

        // Return default scores if none exist
        return [];
    }

    /**
     * Save high scores to localStorage
     */
    saveScores() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.scores));
            console.log('[HighScore] Scores saved:', this.scores);
        } catch (error) {
            console.error('[HighScore] Failed to save scores:', error);
        }
    }

    /**
     * Check if a score qualifies for high score table
     * @param {number} score - The score to check
     * @returns {boolean} True if score qualifies
     */
    isHighScore(score) {
        if (this.scores.length < this.maxEntries) {
            return true;
        }
        return score > this.scores[this.scores.length - 1].score;
    }

    /**
     * Get the rank for a given score (1-based)
     * @param {number} score - The score to check
     * @returns {number} Rank (1-10), or -1 if doesn't qualify
     */
    getRank(score) {
        if (!this.isHighScore(score)) {
            return -1;
        }

        let rank = 1;
        for (const entry of this.scores) {
            if (score > entry.score) {
                return rank;
            }
            rank++;
        }
        return rank;
    }

    /**
     * Add a new high score entry
     * @param {string} name - Player name (3 characters)
     * @param {number} score - Total score
     * @param {Object} breakdown - Score breakdown (base, scoreDiffBonus, timeBonus)
     * @returns {number} Rank achieved (1-10)
     */
    addScore(name, score, breakdown) {
        const entry = {
            name: name.toUpperCase().substring(0, 3).padEnd(3, '_'),
            score: score,
            breakdown: breakdown,
            date: new Date().toISOString()
        };

        // Insert in sorted order
        this.scores.push(entry);
        this.scores.sort((a, b) => b.score - a.score);

        // Keep only top N entries
        if (this.scores.length > this.maxEntries) {
            this.scores = this.scores.slice(0, this.maxEntries);
        }

        this.saveScores();

        // Return rank
        return this.scores.indexOf(entry) + 1;
    }

    /**
     * Get all high scores
     * @returns {Array} Array of score entries
     */
    getScores() {
        return [...this.scores];
    }

    /**
     * Clear all high scores (for testing)
     */
    clearScores() {
        this.scores = [];
        this.saveScores();
        console.log('[HighScore] All scores cleared');
    }
}

// Singleton instance
const HighScore = new HighScoreManager();
