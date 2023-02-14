import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormulaVisualizerComponent } from './formula-visualizer.component';

describe('FormulaVisualizerComponent', () => {
  let component: FormulaVisualizerComponent;
  let fixture: ComponentFixture<FormulaVisualizerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormulaVisualizerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormulaVisualizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
