import { BodyRegion, findBodyRegionById } from '@/models/BodyRegion';

export type BodySelectionListener = (selectedIds: string[], gender: 'male' | 'female') => void;

export class BodyRegionSelectionController {
  private selectedRegionIds: Set<string> = new Set();
  private currentGender: 'male' | 'female' = 'male';
  private listeners: Set<BodySelectionListener> = new Set();

  constructor(initialSelected: string[] = [], gender: 'male' | 'female' = 'male') {
    this.selectedRegionIds = new Set(initialSelected);
    this.currentGender = gender;
  }

  public getSelectedIds(): string[] {
    return Array.from(this.selectedRegionIds);
  }

  public getSelectedRegions(): BodyRegion[] {
    return this.getSelectedIds()
      .map((id) => findBodyRegionById(id))
      .filter((r): r is BodyRegion => r !== undefined);
  }

  public getGender(): 'male' | 'female' {
    return this.currentGender;
  }

  public setGender(gender: 'male' | 'female') {
    if (this.currentGender !== gender) {
      this.currentGender = gender;
      this.notifyListeners();
    }
  }

  public toggleRegion(regionId: string) {
    if (this.selectedRegionIds.has(regionId)) {
      this.selectedRegionIds.delete(regionId);
    } else {
      this.selectedRegionIds.add(regionId);
    }
    this.notifyListeners();
  }

  public selectRegion(regionId: string) {
    if (!this.selectedRegionIds.has(regionId)) {
      this.selectedRegionIds.add(regionId);
      this.notifyListeners();
    }
  }

  public deselectRegion(regionId: string) {
    if (this.selectedRegionIds.has(regionId)) {
      this.selectedRegionIds.delete(regionId);
      this.notifyListeners();
    }
  }

  public clearSelection() {
    if (this.selectedRegionIds.size > 0) {
      this.selectedRegionIds.clear();
      this.notifyListeners();
    }
  }

  public setSelectedIds(ids: string[]) {
    this.selectedRegionIds = new Set(ids);
    this.notifyListeners();
  }

  public subscribe(listener: BodySelectionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const ids = this.getSelectedIds();
    this.listeners.forEach((listener) => listener(ids, this.currentGender));
  }
}
