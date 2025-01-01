export interface OLComponents {
  Vector: {
    layer: any;
    source: any;
  };
  Style: {
    base: any;
    fill: any;
    stroke: any;
    text: any;
  };
}

export const createOL = (ol: any): OLComponents => ({
  Vector: {
    layer: ol.layer.Vector,
    source: ol.source.Vector,
  },
  Style: {
    base: ol.style.Style,
    fill: ol.style.Fill,
    stroke: ol.style.Stroke,
    text: ol.style.Text,
  },
});
