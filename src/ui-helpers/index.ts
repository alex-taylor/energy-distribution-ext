export interface Segment {
  state: number;
  cssClass: string;
}

export interface SegmentGroup {
  segments: Segment[];
}
