import type { GameInstance } from "../types";
import type { Map } from "ol";

export class GameController implements GameInstance {
  private map: Map | null = null;

  activate(mapElementId: string): void {
    const mapElement = document.getElementById(mapElementId);
    if (!mapElement) {
      throw new Error("Map element not found");
    }

    console.log("Game activated on map:", mapElementId);
  }

  deactivate(): void {
    this.map = null;
    console.log("Game deactivated");
  }
}
