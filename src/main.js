import { GameConfig } from './config/GameConfig.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

// 씬 등록
const scenes = [
    PreloadScene,
    MenuScene,
    GameScene,
    GameOverScene
];

// Phaser 게임 설정
const config = {
    ...GameConfig,
    scene: scenes
};

// 게임 시작
const game = new Phaser.Game(config);

// 전역 게임 인스턴스 내보내기
export { game };
