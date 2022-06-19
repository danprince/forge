import { GameObject } from "./game";

export interface Storage {
  container: Container<any>;
}

export function hasStorage(object: GameObject): object is GameObject & Storage {
  return (object as any).container instanceof Container;
}

export type ContainerRule<StoredObject extends GameObject> =
  (object: GameObject, stored: StoredObject | undefined) => object is StoredObject;

export interface ContainerParams<StoredObject extends GameObject> {
  capacity: number;
  rule: ContainerRule<StoredObject>;
}

export class Container<StoredObject extends GameObject> {
  objects: StoredObject[] = [];
  capacity: number;
  private rule: ContainerRule<StoredObject>;

  constructor(params: ContainerParams<StoredObject>) {
    this.capacity = params.capacity;
    this.rule = params.rule;
  }

  empty() {
    this.objects = [];
  }

  canStore(object: GameObject): object is StoredObject {
    return !this.isFull() && this.rule(object, this.peek());
  }

  isFull() {
    return this.objects.length >= this.capacity;
  }

  isEmpty() {
    return this.objects.length === 0;
  }

  peek(): StoredObject | undefined {
    return this.objects[this.objects.length - 1];
  }

  pop(): StoredObject | undefined {
    return this.objects.pop();
  }

  push(object: StoredObject) {
    if (!this.isFull()) {
      this.objects.push(object);
    }
  }
}
