export class ClipRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  constructor(top: number, left: number, right: number, bottom: number) {
    this.top = top;
    this.left = left;
    this.right = right;
    this.right = right;
    this.bottom = bottom;
  }
}

export class SpiriteInfo<Image> {
  height: number;
  width: number;
  name: string;
  clips: Array<ClipRect>;
  src: Image;
  constructor(name:string, width: number, height: number, src: Image) {
    this.width = width;
    this.height = height;
    this.name = name;
    this.clips = [];
    this.src = src;
  }
}

export interface PositionInfo {
  ratio: number;
  top: number;
  left: number;
}

export class Target<Image> {
  top: number;
  left: number;
  handler: (clip: Clip<Image>) => void;
  constructor(top:number, left:number, handler: (clip: Clip<Image>)=>void) {
    this.top = top;
    this.left = left;
    this.handler = handler;
  }
}

interface ClipInfo<Image> {
  spirite: SpiriteInfo<Image>;
  topOffset: number;
  leftOffset: number;
}

interface DrawingContext<Image> {
  drawImage: (image: Image, sleft:number, stop:number, sw: number, sh:number, left:number, top:number, w:number, h:number) => void;
  drawText: (message: string, left: number, top: number, width: number) => void; // text, x, y
  clear: () => void;
}

export class Clip<Image> {
  name: string;
  vx: number;
  vy: number;
  boundry: ClipRect;
  clips: Map<string, ClipInfo<Image>>;
  currentFrame: number | null;
  currentClip: string | null;
  top: number;
  left: number;
  stage: Stage<Image>;
  speed: number;
  focus: boolean;
  hover: boolean;
  halted: boolean;
  target: Array<Target<Image>>;
  active: boolean;
  stopFrame: number | null;
  zIndex: number;
  stopCallback: (c: Clip<Image>) => void;
  message: string;

  constructor(name: string, boundry: ClipRect, zIndex: number, stage: Stage<Image>) {
    this.name = name;
    this.boundry = boundry;
    this.speed = 1;
    this.vx = 0;
    this.vy = 0;
    this.currentFrame = null;
    this.currentClip = null;
    this.clips = new Map<string, ClipInfo<Image>>();
    this.top = 0;
    this.left = 0;
    this.stage = stage;
    this.focus = false;
    this.hover = false;
    this.target = [];
    this.halted = true;
    this.active = false;
    this.stopFrame = null;
    this.zIndex = zIndex;
    this.stopCallback = (_c: Clip<Image>) => {return;};
    this.message = "";
  }

  show() {
    this.active = true;
  }

  hide() {
    this.active = false;
  }

  play() {
    this.halted = false;
    this.active = true;
  }

  stop() {
    this.halted = true;
  }

  getCurrentRect() {
    return this.clips.get(this.currentClip!)!.spirite.clips[this.currentFrame!];
  }

  getCurrentClipInfo() {
    return this.clips.get(this.currentClip!)!;
  }

  inRect(cursorLeft: number, cursorTop: number): boolean {
    const rect = this.getCurrentRect();
    const w = rect.right-rect.left;
    const r = this.stage.ratio;
    const bottom = this.top + w * r.ratio + r.top;
    const right = this.left + w * r.ratio + r.left;
    const margin = w * r.ratio / 4;
    if (cursorLeft > this.left + margin
      && cursorLeft < right - margin
      && cursorTop > this.top + margin
      && cursorTop < bottom) {
      return true;
    }
    return false;
  }

  select() {
    this.focus = true;
  }

  disSelect() {
    this.focus = false;
  }

  getBottom() {
    if (this.currentClip != null && this.currentFrame != null) {
      const rect = this.getCurrentRect();
      return this.top + (rect.bottom - rect.top);
    }
    else {
      return 0;
    }
  }

  getZCenter() {
    if (this.currentClip != null && this.currentFrame != null) {
      const rect = this.getCurrentRect();
      const w = rect.right-rect.left;
      const r = this.stage.ratio;
      return [this.left + r.ratio * w/2, this.top + r.ratio*w]
    }
    else {
      return null;
    }
  }

  getCurrentImage() {
    const rect = this.getCurrentClipInfo().spirite.src;
    return rect;
  }

  setSpeed(speed: number) {
    this.speed = speed;
  }


  updateSpeed() {
    if (this.target.length != 0) {
      const len = this.target.length - 1;
      const clipinfo = this.getCurrentClipInfo();
      let rx = this.target[len].left - (this.left - clipinfo.leftOffset);
      let ry = this.target[len].top - (this.top - clipinfo.topOffset);
      const dis = Math.sqrt(rx*rx + ry*ry);
      if (dis < 5) {
        const target = this.target.pop();
        if (this.target.length == 0) {
          target!.handler(this);
          //this.stage.emitEvent(this, "ReachTarget");
        }
      } else {
        rx = rx * this.speed / dis;
        ry = ry * this.speed / dis;
        this.vx = rx;
        this.vy = ry;
      }
    }
  }

  /*
   * play from frame start to end
   */
  playRange(start: number, end: number, stopcb: (a:Clip<Image>) => void) {
    this.active = true;
    this.halted = false;
    this.currentFrame = start;
    this.stopFrame = end;
    this.stopCallback = stopcb;
  }

  draw(ctx: DrawingContext<Image>) {
    if (this.currentClip != null && this.currentFrame != null && this.active == true) {
      const ratio = this.stage.ratio;
      const rect = this.getCurrentRect();
      const clipinfo = this.getCurrentClipInfo();
      const w = rect.right - rect.left;
      const h = rect.bottom - rect.top;
      const src = this.getCurrentImage();
      const left = (this.left - clipinfo.leftOffset) * ratio.ratio + ratio.left;
      const top = (this.top - clipinfo.topOffset) * ratio.ratio + ratio.top;
      ctx.drawImage(src, rect.left, rect.top, w, h, left, top, w * ratio.ratio, h * ratio.ratio);

      /*
      {
        ctx.fillRect(this.left + 30, this.top - 13, fullname.length * 7 + 5, 15);
        ctx.fillStyle = "white";  // Red color
        ctx.font = "12px Arial";
        ctx.fillText(fullname, this.left+35, this.top); // text, x, y
      }
      */
      if (this.hover == true) {
        //ctx.fillStyle = 'hsl(20%, 100%, 15%)'; // Use 50% gray to desaturate
        //ctx.globalCompositeOperation = "saturation";
      }

      if (this.message != "") {
        const topOff = 5;
        const msgWidth = this.message.length * 5.5 + 5;
        const leftOff = w * (ratio.ratio/2) - msgWidth/2;
        ctx.drawText(this.message, left + leftOff + 5, top + topOff, msgWidth); // text, x, y
        /*

        */
      }
    }
  }

  setMessage(msg: string) {
    this.message = msg;
  }

  setPos(top: number, left: number) {
    this.top = top;
    this.left = left;
  }


  incFrame() {
    if (this.currentFrame != null && this.currentFrame == this.stopFrame) {
      //this.active = false;
      this.halted = true;
      this.stopFrame = null;
      this.stopCallback(this);
      return;
    }
    if (this.currentFrame!=null && this.currentClip!=null && this.halted == false) {
      const clipinfo = this.getCurrentClipInfo();
      const len = clipinfo.spirite.clips.length;
      this.currentFrame = (this.currentFrame + 1) % len;
      this.top = this.vy + this.top;
      this.left = this.vx + this.left;
      this.updateSpeed();
      if (this.target.length == 0) {
        if (this.top < this.boundry.top) {
          this.top = this.boundry.top;
        }
        if (this.top > this.boundry.bottom) {
          this.top = this.boundry.bottom;
        }
        if (this.left < this.boundry.left) {
          this.left = this.boundry.left;
        }
        if (this.left > this.boundry.right) {
          this.left = this.boundry.right;
        }
      }
    }
  }

  switchAnimationClip(name: string, start = 0) {
    this.currentClip = name;
    this.currentFrame = start;
  }

  setAnimationClip(top: number, left: number, start: number, spiriteInfo: SpiriteInfo<Image>) {
    this.clips.set(spiriteInfo.name, {
      spirite:spiriteInfo,
      topOffset: top,
      leftOffset: left,
    });
    this.currentFrame = start;
  }
}

class Event<Image> {
  clip: Clip<Image>;
  eventType: string;
  constructor(clip: Clip<Image>, event: string) {
    this.clip = clip;
    this.eventType = event;
  }
}

export class Stage<Image> {
  clips: Map<string, Clip<Image>>;
  ratio: PositionInfo;
  events: Array<Event<Image>>;
  eventHandler: Map<string, (c:Clip<Image>, eventType: JSON)=> void>;
  stageHeight: number;
  stageWidth: number;
  constructor(stageWidth: number, stageHeight: number) {
    this.clips = new Map();
    this.eventHandler = new Map();
    this.stageWidth = stageWidth;
    this.stageHeight = stageHeight;
    this.events = [];
    this.ratio = {
        ratio:0,
        top:0,
        left: 0,
      }
  }

  public emitEvent(clip: Clip<Image>, eventInfo: JSON) {
    const handler = this.eventHandler.get(clip.name);
    if (handler) {
      handler(clip, eventInfo);
    }
  }

  registerEventHandler(clip: Clip<Image>, cb: (c:Clip<Image>) => void) {
    this.eventHandler.set(clip.name, cb);
  }

  getRectRatio(effW: number, effH: number): PositionInfo {
    if (effW == 0 || effH == 0) {
      return {
        ratio:0,
        top:0,
        left: 0,
      }
    }
    if ((effW/effH) > (this.stageWidth/this.stageHeight)) {
      // spread to fit height
      const ratio = effW / this.stageWidth;
      const height = ratio * this.stageHeight;
      return {
        ratio: ratio,
        top: (effH - height)/2,
        left: 0,
      }
    } else {
      // spread to fit width
      const ratio = effH / this.stageHeight;
      const width = ratio * this.stageWidth;
      return {
        ratio: ratio,
        top: 0,
        left: (effW - width)/2,
      }
    }
  }

  setRatio(r: PositionInfo) {
    this.ratio = r;
  }


  addClip(clip: Clip<Image>) {
    this.clips.set(clip.name, clip);
  }

  removeClip(clipName: string) {
    this.clips.delete(clipName);
  }

  getClip(name: string) {
    return this.clips.get(name);
  }

  draw(context: DrawingContext<Image>) {
    //const context = (canvas as HTMLCanvasElement).getContext("2d")!;
    context.clear();
    //context.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    const carray = Array.from(this.clips.values()).sort((a,b)=> a.zIndex - b.zIndex);
    for (const v of carray) {
      v.draw(context);
      v.incFrame();
    }
  }
}

