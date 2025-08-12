import { AssetConfig } from '../config/AssetConfig.js';

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // 로딩 바 생성
        this.createLoadingBar();
        
        // 에셋 로드 (현재는 비어있음, 나중에 확장)
        this.loadAssets();
        
        // 로딩 이벤트 설정
        this.load.on('progress', this.updateLoadingBar, this);
        this.load.on('complete', this.loadComplete, this);
    }

    createLoadingBar() {
        const { width, height } = this.cameras.main;
        
        // 배경
        this.add.rectangle(width / 2, height / 2, width, height, 0x111111);
        
        // 로딩 바 배경
        const barBg = this.add.rectangle(width / 2, height / 2, 400, 20, 0x333333);
        
        // 로딩 바
        this.loadingBar = this.add.rectangle(width / 2 - 200, height / 2, 0, 20, 0x4488ff);
        this.loadingBar.setOrigin(0, 0.5);
        
        // 로딩 텍스트
        this.loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
            fontSize: '24px',
            fontFamily: 'Orbitron, monospace',
            fill: '#ffffff'
        }).setOrigin(0.5);
    }

    loadAssets() {
        // 현재는 실제 에셋이 없으므로 더미 로딩
        // 나중에 AssetConfig를 사용해서 실제 에셋 로드
        
        // 더미 데이터로 로딩 시뮬레이션
        for (let i = 0; i < 10; i++) {
            this.load.image(`dummy${i}`, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
        }
    }

    updateLoadingBar(progress) {
        this.loadingBar.width = 400 * progress;
        this.loadingText.setText(`Loading... ${Math.round(progress * 100)}%`);
    }

    loadComplete() {
        // 로딩 완료 후 메뉴 씬으로 전환
        this.time.delayedCall(500, () => {
            this.scene.start('MenuScene');
        });
    }
}
