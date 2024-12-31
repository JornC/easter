import type { GameInstance } from "../types";
import { Map, Feature } from "ol";
import { Circle } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Style, Fill, Stroke } from "ol/style";

export class GameController implements GameInstance {
  private map: Map | null = null;
  private gameLayer: VectorLayer<VectorSource> | null = null;

  // Harskamp military training ground coordinates (approximate)
  private readonly TRAINING_GROUND = [186000, 460000];

  activate(map: Map): void {
    this.map = map;

    // Create game layer
    this.gameLayer = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        fill: new Fill({
          color: "rgba(255, 0, 0, 0.2)",
        }),
        stroke: new Stroke({
          color: "#ff0000",
          width: 2,
        }),
      }),
    });

    // Add layer to map
    this.map.addLayer(this.gameLayer);

    // Animate to location and draw circle
    this.map.getView().animate(
      {
        center: this.TRAINING_GROUND,
        zoom: 12,
        duration: 2000,
      },
      () => {
        // After animation, draw the circle
        const circle = new Feature({
          geometry: new Circle(this.TRAINING_GROUND, 500), // 500m radius
        });

        this.gameLayer?.getSource()?.addFeature(circle);
      }
    );
  }

  deactivate(): void {
    if (this.gameLayer && this.map) {
      this.map.removeLayer(this.gameLayer);
    }
    this.map = null;
    this.gameLayer = null;
  }
}
