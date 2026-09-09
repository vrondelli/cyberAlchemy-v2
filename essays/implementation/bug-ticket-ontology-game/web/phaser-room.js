import Phaser from "phaser";
import incidentControlUrl from "./assets/incident-control-room-v1.png";
import policyArchiveUrl from "./assets/policy-archive-v1.png";
import transferAnnexUrl from "./assets/transfer-annex-v1.png";

const ROOM_ART = {
  "incident-control-room": incidentControlUrl,
  "policy-archive": policyArchiveUrl,
  "transfer-annex": transferAnnexUrl
};

const COLORS = {acid:0xb8f36d, amber:0xefb95e, cyan:0x71cbd4, red:0xef6f67, muted:0x829095};

export function createPhaserRoom({parent, model, onStation}) {
  const rooms = model.game.rooms;
  let scene = null;
  let pendingState = null;
  let activeRoom = rooms[model.game.start_room];

  class InvestigationScene extends Phaser.Scene {
    constructor() {
      super("investigation-places");
      this.stationVisuals = new Map();
    }

    preload() {
      for (const [roomId, url] of Object.entries(ROOM_ART)) this.load.image(roomId, url);
    }

    create() {
      scene = this;
      this.showRoom(activeRoom.id, false);
    }

    showRoom(roomId, transition = true) {
      const room = rooms[roomId];
      if (!room) return;
      activeRoom = room;
      this.tweens.killAll();
      this.children.removeAll(true);
      this.stationVisuals.clear();
      this.add.image(0, 0, roomId).setOrigin(0).setDisplaySize(room.art.width, room.art.height);
      this.createAtmosphere(roomId, room);
      this.createHotspots(room);
      if (transition) this.cameras.main.fadeIn(420, 5, 10, 12);
      if (pendingState) this.applyState(pendingState);
    }

    createAtmosphere(roomId, room) {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const lights = roomId === "incident-control-room"
        ? [[230,585,410,240,0xffb24e],[932,315,360,300,0xffba55],[1540,130,220,170,COLORS.red]]
        : roomId === "policy-archive"
          ? [[470,610,520,290,0xffb24e],[920,330,390,360,0xffba55],[1370,260,330,300,COLORS.cyan]]
          : [[390,575,480,260,0xffc06a],[1020,350,380,330,0xffb24e],[1400,180,400,300,COLORS.cyan]];
      for (const [x,y,width,height,color] of lights) {
        const light = this.add.ellipse(x,y,width,height,color,0.045).setBlendMode(Phaser.BlendModes.ADD);
        if (!reducedMotion) this.tweens.add({targets:light,alpha:{from:0.025,to:0.085},duration:Phaser.Math.Between(1300,2300),yoyo:true,repeat:-1,ease:"Sine.InOut"});
      }
      for (let index = 0; index < (reducedMotion ? 0 : 18); index += 1) {
        const mote = this.add.circle(Phaser.Math.Between(70,room.art.width-70),Phaser.Math.Between(90,room.art.height-50),Phaser.Math.FloatBetween(0.8,2),0xd9c89f,Phaser.Math.FloatBetween(0.07,0.22));
        this.tweens.add({targets:mote,x:`+=${Phaser.Math.Between(-30,38)}`,y:`-=${Phaser.Math.Between(25,85)}`,alpha:0,duration:Phaser.Math.Between(3800,7800),delay:Phaser.Math.Between(0,2400),repeat:-1});
      }
    }

    createHotspots(room) {
      for (const station of room.stations) {
        const area = station.hit_area;
        const x = area.x + area.width / 2;
        const y = area.y + area.height / 2;
        const zone = this.add.zone(x,y,area.width,area.height).setInteractive({useHandCursor:true});
        const outline = this.add.rectangle(x,y,area.width,area.height,0x000000,0).setStrokeStyle(2,COLORS.cyan,0);
        const label = this.add.text(area.x+10,area.y+9,(station.clue ?? station.label).toUpperCase(),{fontFamily:"ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",fontSize:"15px",color:"#e9e5d9",backgroundColor:"rgba(4, 9, 11, 0.86)",padding:{x:8,y:5}}).setAlpha(0);
        const marker = this.add.circle(area.x+area.width-15,area.y+15,7,COLORS.cyan,0).setStrokeStyle(2,COLORS.cyan,0);
        const visual = {station,zone,outline,label,marker,locked:false,solved:false};
        this.stationVisuals.set(station.id,visual);
        zone.on("pointerover",()=>this.showHotspot(visual));
        zone.on("pointerout",()=>this.hideHotspot(visual));
        zone.on("pointerdown",()=>{ this.pulseHotspot(visual); onStation(station.id); });
      }
    }

    showHotspot(visual) {
      const color = visual.solved ? COLORS.acid : visual.locked ? COLORS.muted : COLORS.amber;
      visual.outline.setStrokeStyle(3,color,0.9);
      visual.label.setAlpha(1);
      visual.marker.setFillStyle(color,0.5).setStrokeStyle(2,color,1);
    }

    hideHotspot(visual) {
      visual.outline.setStrokeStyle(2,COLORS.cyan,0);
      visual.label.setAlpha(0);
      visual.marker.setFillStyle(COLORS.cyan,visual.solved?0.7:0).setStrokeStyle(2,visual.solved?COLORS.acid:COLORS.cyan,visual.solved?1:0);
    }

    pulseHotspot(visual) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      this.tweens.killTweensOf(visual.outline);
      visual.outline.setAlpha(1).setScale(1);
      this.tweens.add({targets:visual.outline,scaleX:1.025,scaleY:1.04,alpha:0.1,duration:230,yoyo:true});
      this.cameras.main.shake(85,0.0008);
    }

    applyState(state) {
      if (state.current_room !== activeRoom.id) {
        this.showRoom(state.current_room);
        return;
      }
      for (const visual of this.stationVisuals.values()) {
        const station = visual.station;
        visual.locked = (station.requires_items ?? []).some((item)=>!state.inventory.includes(item)) || (station.requires_solved ?? []).some((id)=>!state.solved.includes(id));
        visual.solved = state.solved.includes(station.puzzle_id) || state.solved.includes(`station:${station.id}`) || state.inspected.includes(station.id);
        visual.zone.setAlpha(visual.locked?0.72:1);
        visual.marker.setFillStyle(visual.solved?COLORS.acid:visual.locked?COLORS.muted:COLORS.cyan,visual.solved?0.72:0).setStrokeStyle(2,visual.solved?COLORS.acid:COLORS.cyan,visual.solved?1:0);
      }
    }
  }

  const game = new Phaser.Game({
    type:Phaser.AUTO,parent,width:activeRoom.art.width,height:activeRoom.art.height,
    backgroundColor:"#050a0c",transparent:false,antialias:true,
    render:{pixelArt:false,roundPixels:false},
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:InvestigationScene
  });

  return {
    updateState(state) { pendingState=state; scene?.applyState(state); },
    stationAt(clientX,clientY) {
      const canvas=game.canvas;
      if (!canvas) return null;
      const bounds=canvas.getBoundingClientRect();
      const x=(clientX-bounds.left)*activeRoom.art.width/bounds.width;
      const y=(clientY-bounds.top)*activeRoom.art.height/bounds.height;
      return [...activeRoom.stations].reverse().find((station)=>{ const area=station.hit_area; return x>=area.x&&x<=area.x+area.width&&y>=area.y&&y<=area.y+area.height; })?.id ?? null;
    },
    destroy() { game.destroy(true); }
  };
}
