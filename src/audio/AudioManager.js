export class AudioManager {
    constructor(scene) {
        this.scene = scene;
        
        // 오디오 상태
        this.enabled = true;
        this.musicVolume = 0.7;
        this.sfxVolume = 0.8;
        
        // 오디오 객체들
        this.music = null;
        this.sounds = {};
        
        // 현재 재생 중인 사운드들
        this.playingSounds = [];
        
        // 사운드 풀 (성능 최적화)
        this.soundPools = {};
        this.maxPoolSize = 5;
        
        // 오디오 컨텍스트 (Web Audio API 사용시)
        this.audioContext = null;
        
        this.initializeAudio();
    }

    initializeAudio() {
        // 브라우저 호환성 체크
        this.checkAudioSupport();
        
        // 사운드 정의 (현재는 더미, 실제 파일로 대체 예정)
        this.defineSounds();
        
        // 사운드 풀 초기화
        this.initializeSoundPools();
    }

    checkAudioSupport() {
        // Web Audio API 지원 확인
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        
        if (AudioContext) {
            this.audioContext = new AudioContext();
            console.log('Web Audio API supported');
        } else {
            console.warn('Web Audio API not supported, falling back to HTML5 audio');
        }
    }

    defineSounds() {
        // 사운드 정의 (추후 실제 파일로 교체)
        this.soundDefinitions = {
            paddle_hit: {
                key: 'paddle_hit',
                url: null, // 'assets/audio/paddle_hit.wav'
                volume: 0.6,
                rate: 1.0,
                detune: 0,
                loop: false
            },
            brick_break: {
                key: 'brick_break',
                url: null, // 'assets/audio/brick_break.wav'
                volume: 0.7,
                rate: 1.0,
                detune: 0,
                loop: false
            },
            wall_bounce: {
                key: 'wall_bounce',
                url: null, // 'assets/audio/wall_bounce.wav'
                volume: 0.5,
                rate: 1.0,
                detune: 0,
                loop: false
            },
            ball_split: {
                key: 'ball_split',
                url: null, // 'assets/audio/ball_split.wav'
                volume: 0.8,
                rate: 1.0,
                detune: 0,
                loop: false
            },
            powerup_collect: {
                key: 'powerup_collect',
                url: null, // 'assets/audio/powerup_collect.wav'
                volume: 0.7,
                rate: 1.0,
                detune: 0,
                loop: false
            },
            game_over: {
                key: 'game_over',
                url: null, // 'assets/audio/game_over.wav'
                volume: 0.9,
                rate: 1.0,
                detune: 0,
                loop: false
            },
            background_music: {
                key: 'background_music',
                url: null, // 'assets/audio/background_music.mp3'
                volume: 0.4,
                rate: 1.0,
                detune: 0,
                loop: true
            }
        };
    }

    initializeSoundPools() {
        // 각 사운드별로 풀 생성
        Object.keys(this.soundDefinitions).forEach(key => {
            if (key !== 'background_music') { // 배경음악은 풀링하지 않음
                this.soundPools[key] = [];
            }
        });
    }

    // 배경음악 재생
    playMusic(key = 'background_music', fadeIn = true) {
        if (!this.enabled) return;
        
        this.stopMusic();
        
        const soundDef = this.soundDefinitions[key];
        if (!soundDef || !soundDef.url) {
            // 실제 파일이 없으면 사일런트 모드
            console.log(`Playing music: ${key} (silent mode)`);
            return;
        }
        
        try {
            this.music = this.scene.sound.add(key, {
                volume: fadeIn ? 0 : soundDef.volume * this.musicVolume,
                loop: soundDef.loop,
                rate: soundDef.rate,
                detune: soundDef.detune
            });
            
            this.music.play();
            
            if (fadeIn) {
                this.scene.tweens.add({
                    targets: this.music,
                    volume: soundDef.volume * this.musicVolume,
                    duration: 2000,
                    ease: 'Power2.easeIn'
                });
            }
            
        } catch (error) {
            console.warn('Failed to play music:', error);
        }
    }

    // 배경음악 정지
    stopMusic(fadeOut = true) {
        if (!this.music) return;
        
        if (fadeOut) {
            this.scene.tweens.add({
                targets: this.music,
                volume: 0,
                duration: 1000,
                ease: 'Power2.easeOut',
                onComplete: () => {
                    this.music.stop();
                    this.music = null;
                }
            });
        } else {
            this.music.stop();
            this.music = null;
        }
    }

    // 효과음 재생
    playSound(key, options = {}) {
        if (!this.enabled) return null;
        
        const soundDef = this.soundDefinitions[key];
        if (!soundDef) {
            console.warn(`Sound '${key}' not defined`);
            return null;
        }
        
        // 사일런트 모드 (실제 파일이 없을 때)
        if (!soundDef.url) {
            console.log(`Playing sound: ${key} (silent mode)`);
            return this.createSilentSound(key, options);
        }
        
        // 사운드 풀에서 사용 가능한 사운드 찾기
        let sound = this.getSoundFromPool(key);
        
        if (!sound) {
            try {
                sound = this.scene.sound.add(key, {
                    volume: (options.volume ?? soundDef.volume) * this.sfxVolume,
                    rate: options.rate ?? soundDef.rate,
                    detune: options.detune ?? soundDef.detune,
                    loop: options.loop ?? soundDef.loop
                });
            } catch (error) {
                console.warn(`Failed to create sound '${key}':`, error);
                return null;
            }
        } else {
            // 기존 사운드 설정 업데이트
            sound.setVolume((options.volume ?? soundDef.volume) * this.sfxVolume);
            sound.setRate(options.rate ?? soundDef.rate);
            sound.setDetune(options.detune ?? soundDef.detune);
        }
        
        // 재생 완료 시 풀로 반환
        sound.once('complete', () => {
            this.returnSoundToPool(key, sound);
        });
        
        sound.play();
        this.playingSounds.push(sound);
        
        return sound;
    }

    // 사일런트 사운드 생성 (테스트용)
    createSilentSound(key, options) {
        const soundDef = this.soundDefinitions[key];
        
        return {
            key,
            volume: (options.volume ?? soundDef.volume) * this.sfxVolume,
            rate: options.rate ?? soundDef.rate,
            detune: options.detune ?? soundDef.detune,
            isPlaying: true,
            setVolume: (vol) => {},
            setRate: (rate) => {},
            setDetune: (detune) => {},
            stop: () => {},
            destroy: () => {}
        };
    }

    // 사운드 풀에서 사운드 가져오기
    getSoundFromPool(key) {
        const pool = this.soundPools[key];
        if (pool && pool.length > 0) {
            return pool.pop();
        }
        return null;
    }

    // 사운드를 풀로 반환
    returnSoundToPool(key, sound) {
        const pool = this.soundPools[key];
        if (pool && pool.length < this.maxPoolSize) {
            pool.push(sound);
        } else {
            sound.destroy();
        }
        
        // 재생 중 사운드 목록에서 제거
        const index = this.playingSounds.indexOf(sound);
        if (index > -1) {
            this.playingSounds.splice(index, 1);
        }
    }

    // 특정 사운드 정지
    stopSound(sound) {
        if (sound && sound.isPlaying) {
            sound.stop();
        }
    }

    // 모든 사운드 정지
    stopAllSounds() {
        this.playingSounds.forEach(sound => {
            if (sound.isPlaying) {
                sound.stop();
            }
        });
        this.playingSounds = [];
    }

    // 게임 상황별 사운드 재생 메서드들
    onPaddleHit(velocity = 1.0) {
        // 속도에 따른 피치 조절
        const rate = Math.max(0.8, Math.min(1.5, 0.8 + velocity * 0.1));
        const volume = Math.max(0.3, Math.min(1.0, 0.5 + velocity * 0.1));
        
        this.playSound('paddle_hit', { rate, volume });
    }

    onBrickBreak(brickType = 'normal') {
        let detune = 0;
        let volume = 1.0;
        
        // 벽돌 타입에 따른 사운드 변화
        switch (brickType) {
            case 'strong':
                detune = -200;
                volume = 1.2;
                break;
            case 'bonus':
                detune = 400;
                volume = 0.8;
                break;
            default:
                detune = Math.random() * 200 - 100; // 랜덤 피치
        }
        
        this.playSound('brick_break', { detune, volume });
    }

    onWallBounce(wallType = 'side') {
        const detune = wallType === 'top' ? 200 : wallType === 'bottom' ? -200 : 0;
        this.playSound('wall_bounce', { detune });
    }

    onBallSplit() {
        this.playSound('ball_split');
    }

    onPowerUpCollect(powerUpType) {
        // 파워업 타입에 따른 사운드 변화
        const pitchMap = {
            speed: 200,
            multiball: 0,
            paddle_size: -100,
            slow_motion: -300,
            penetrate: 300,
            life: 400
        };
        
        const detune = pitchMap[powerUpType] || 0;
        this.playSound('powerup_collect', { detune });
    }

    onGameOver(playerWon) {
        // 승리/패배에 따른 사운드
        const rate = playerWon ? 1.0 : 0.8;
        const detune = playerWon ? 0 : -400;
        
        this.playSound('game_over', { rate, detune });
    }

    // 볼륨 조절
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        
        if (this.music) {
            this.music.setVolume(this.musicVolume);
        }
    }

    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        
        // 현재 재생 중인 사운드들의 볼륨 조절
        this.playingSounds.forEach(sound => {
            const soundDef = this.soundDefinitions[sound.key];
            if (soundDef) {
                sound.setVolume(soundDef.volume * this.sfxVolume);
            }
        });
    }

    // 오디오 활성화/비활성화
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (!enabled) {
            this.stopMusic(false);
            this.stopAllSounds();
        }
    }

    // 음소거
    mute() {
        this.scene.sound.mute = true;
    }

    unmute() {
        this.scene.sound.mute = false;
    }

    // 정리
    destroy() {
        this.stopMusic(false);
        this.stopAllSounds();
        
        // 사운드 풀 정리
        Object.values(this.soundPools).forEach(pool => {
            pool.forEach(sound => sound.destroy());
        });
        
        this.soundPools = {};
        this.playingSounds = [];
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }

    // 디버그 정보
    getDebugInfo() {
        return {
            enabled: this.enabled,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            musicPlaying: !!this.music,
            playingSounds: this.playingSounds.length,
            soundPools: Object.keys(this.soundPools).reduce((acc, key) => {
                acc[key] = this.soundPools[key].length;
                return acc;
            }, {}),
            audioContextState: this.audioContext?.state || 'not available'
        };
    }
}
