import { _decorator, Component, Node, Label} from 'cc';
import { UploadManager } from './UploadManager';
const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
    @property(UploadManager)
    uploadManager: UploadManager = null!;

    @property(Label)
    resultLabel: Label = null!;

    //@property(Node)
    //loadingNode: Node = null!;

    start() {
        //this.uploadManager.uiManager = this;
        //this.loadingNode.active = false;
        this.resultLabel.string = '请选择或拍摄一张食物图片';
    }

    showLoading() {
        //this.loadingNode.active = true;
        this.resultLabel.string = '分析中，请稍候...';
    }

    hideLoading() {
        //this.loadingNode.active = false;
    }

    showResult(result: any) {
        this.hideLoading();
        try {
            // 如果是 JSON，格式化显示
            if (typeof result === 'object') {
                this.resultLabel.string = JSON.stringify(result, null, 2);
            } else {
                this.resultLabel.string = String(result);
            }
        } catch (e) {
            this.resultLabel.string = '识别结果解析失败。';
        }
    }

    showError(message: string) {
        this.hideLoading();
        this.resultLabel.string = '❌ ' + message;
    }

    /*update(deltaTime: number) {
        
    }*/
}

