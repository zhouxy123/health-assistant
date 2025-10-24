import {
  _decorator, Component, Sprite, SpriteFrame, Texture2D, ImageAsset, sys, UITransform
} from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AnalyzeController')
export class AnalyzeController extends Component {
  @property(Sprite)
  imageSprite: Sprite = null!; // 预览用的 Sprite（在 Inspector 里拖拽绑定）

  // 开发期后端地址（本地跑 FastAPI）
  private SERVER_URL = 'http://localhost:8000/analyze';

  /** 点击“选择图片并分析”（绑定到 Button 的 Click Events） */
  onClickPickAndAnalyze() {
    if (sys.isNative && sys.os === sys.OS_IOS) {
      // 原生相机的接入之后再加；先在浏览器调试通
      console.warn('iOS 原生拍照未接入，先在浏览器用文件选择调试');
      return;
    }
    this.pickFileWeb();
  }

  /** 浏览器文件选择并上传 */
  private pickFileWeb() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file: File | undefined = e.target.files?.[0];
      if (!file) return;

      try {
        // 1) 先在屏幕上预览，保持原始比例缩放
        await this.previewByBlobURL(file);

        // 2) 上传到你自己的后端（FastAPI）
        const form = new FormData();
        form.append('image', file, file.name || 'photo.jpg');

        const res = await fetch(this.SERVER_URL, { method: 'POST', body: form });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status} - ${txt}`);
        }
        const json = await res.json();
        console.log('[Analyze result]', json);

        // TODO: 你可以把 json 显示到 Label / UIManager
      } catch (err) {
        console.error('Analyze failed:', err);
      }
    };
    input.click();
  }

  /** 预览：保持比例地把图片显示到 imageSprite */
  private async previewByBlobURL(file: File) {
    if (!this.imageSprite) return;

    const blobURL = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = blobURL;

      if ((img as any).decode) {
        await img.decode();
      } else {
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = (e) => reject(e);
        });
      }

      const imageAsset = new ImageAsset(img);
      const tex = new Texture2D();
      tex.image = imageAsset;

      // Cocos 3.8+：SpriteFrame 无参构造，再赋 texture
      const sf = new SpriteFrame();
      sf.texture = tex;
      this.imageSprite.spriteFrame = sf;

      // === 保持原始比例，缩放到父节点区域内 ===
      const ui = this.imageSprite.node.getComponent(UITransform)!;
      const parentUI = this.imageSprite.node.parent!.getComponent(UITransform)!;

      const boxW = parentUI.contentSize.width;
      const boxH = parentUI.contentSize.height;
      const imgW = tex.image.width;
      const imgH = tex.image.height;

      const imgRatio = imgW / imgH;
      const boxRatio = boxW / boxH;

      let finalW: number, finalH: number;
      if (imgRatio > boxRatio) {
        finalW = boxW;
        finalH = boxW / imgRatio;
      } else {
        finalH = boxH;
        finalW = boxH * imgRatio;
      }
      ui.setContentSize(finalW, finalH);
    } finally {
      URL.revokeObjectURL(blobURL);
    }
  }
}



