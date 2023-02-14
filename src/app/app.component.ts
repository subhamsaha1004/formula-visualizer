import { Component } from '@angular/core';

// @ts-ignore
import * as Parser from './parser/formula-parser.js';
const parse = Parser.parse;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  formula: string = '($b + SQRT (SQR($b) - 4 * $a)) / (2 * $a)';
  syntaxTree: any;

  updateAstView() {
    if (!this.formula.length) return;
    try {
      this.syntaxTree = parse(this.formula);
    } catch(e) {
      alert('Please enter correct formula');
    }
  }
}
