import * as Y from 'yjs';
import { CanvasShape, UserPresence } from '../types/canvas';

export class CollabDoc {
  public doc: Y.Doc;
  public shapesMap: Y.Map<CanvasShape>;
  public presenceMap: Y.Map<UserPresence>;

  constructor(roomName: string = 'default-room') {
    this.doc = new Y.Doc();
    this.shapesMap = this.doc.getMap<CanvasShape>('shapes');
    this.presenceMap = this.doc.getMap<UserPresence>('presence');
  }

  public setShape(shape: CanvasShape): void {
    this.shapesMap.set(shape.id, shape);
  }

  public removeShape(id: string): void {
    this.shapesMap.delete(id);
  }

  public getShapes(): CanvasShape[] {
    const list: CanvasShape[] = [];
    this.shapesMap.forEach((shape) => {
      list.push(shape);
    });
    return list;
  }

  public updateCursor(userId: string, name: string, color: string, x: number, y: number): void {
    this.presenceMap.set(userId, {
      id: userId,
      name,
      color,
      cursor: { x, y },
      lastActive: Date.now()
    });
  }

  public getActivePresences(): UserPresence[] {
    const list: UserPresence[] = [];
    const now = Date.now();
    this.presenceMap.forEach((user) => {
      // Discard stale cursors > 30 seconds
      if (now - user.lastActive < 30000) {
        list.push(user);
      }
    });
    return list;
  }
}
