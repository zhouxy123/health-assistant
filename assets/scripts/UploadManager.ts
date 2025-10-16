import { _decorator, Component, Node, Label, Sprite, SpriteFrame, Texture2D, ImageAsset, UITransform,sys  } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UploadManager')
export class UploadManager extends Component {
    @property(Label)
    nutritionResultLabel: Label = null!;

    @property(Sprite)
    imageSprite: Sprite = null!;

    //@property(any)
    //uiManager: any = null;

    private _lastMime = 'image/jpeg';
    private _lastName = 'photo.jpg';

    onLoad() {
        // iOS 原生拍照成功后，回调此全局函数并传入图片本地路径
        (globalThis as any).OnPhotoSelected = async (path: string) => {
          try {
            await this.showFromNativePath(path);
          } catch (e) {
            console.error('showFromNativePath error:', e);
          }
        };
      }

    async onClickUpload() {
        if (sys.isNative && sys.os === sys.OS_IOS) {
            // 调用原生相机 (iOS plugin)
            // @ts-ignore
            jsb.reflection.callStaticMethod('CameraBridge', 'openCamera');
        } else {
            // H5 环境（调试用）用 <input type="file">
            this.pickFileWeb();
        }
    }

    pickFileWeb() {
        // 将图片发给服务端处理
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
            //const file = e.target.files[0];
            const file: File = input.files![0];
            const blobURL = URL.createObjectURL(file);

            try {
                await this.setSpriteFromURL(blobURL);  // 显示到 Sprite（下面给实现）
                // 不要打印整段 dataURL，想看就打印 file.name/size/type 即可
                console.log('picked:', file.name, file.type, file.size, 'bytes');
              } catch (e) {
                console.error('preview error:', e);
              } finally {
                // 2) 用完释放
                URL.revokeObjectURL(blobURL);
              }
        };
        input.click();
    }

    private async setSpriteFromURL(url: string) {
        if (!this.imageSprite) throw new Error('imageSprite 未绑定到脚本属性！');
      
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
      
        // 等待解码（Safari/部分老环境可退化到 onload）
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
        const spriteFrame = new SpriteFrame();
        spriteFrame.texture = tex;
        this.imageSprite.spriteFrame = spriteFrame;

        // 让图片保持原始比例
        const size = tex.image?.width && tex.image?.height 
        ? { width: tex.image.width, height: tex.image.height }
        : { width: 1000, height: 400 }; // 默认

        const node = this.imageSprite.node;
        const aspect = size.width / size.height;

        // 例如希望高度固定为 400（或根据屏幕调整）
        const targetHeight = 400;
        node.getComponent(UITransform)!.setContentSize(targetHeight * aspect, targetHeight);
    }

    /** 原生：从本地路径读取并显示 */
    private async showFromNativePath(path: string) {
        const fu = (jsb as any)?.fileUtils;
        if (!fu) throw new Error('fileUtils not available in this runtime');

        // 读入二进制
        const ab: ArrayBuffer = fu.getDataFromFile(path);
        const b64 = this.arrayBufferToBase64(ab);
        const dataURL = `data:${this._lastMime};base64,${b64}`;

        await this.setSpriteFromURL(dataURL);
    }

    /*
     把 dataURL 显示到 Sprite 
    private async setSpriteFromDataURL(dataURL: string) {
        const img = new Image();
        img.src = dataURL;
        await img.decode();

        const imageAsset = new ImageAsset(img);
        const tex = new Texture2D();
        tex.image = imageAsset;
        if (this.imageSprite) {
        this.imageSprite.spriteFrame = new SpriteFrame();
        }
    }*/

    private arrayBufferToBase64(buffer: ArrayBuffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
    }

    start() {

    }

    /*update(deltaTime: number) {
        
    }*/
}

